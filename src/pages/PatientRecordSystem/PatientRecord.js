import React, { useState, useEffect } from "react";
import { db, auth } from "../../backend/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import ViewInsurance from "../../components/ViewInsurance";
import TreatmentHistory from "../../components/TreatmentHistory";

const PatientRecord = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [insuranceDetails, setInsuranceDetails] = useState(null);
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchUserDetails(user.uid);
        fetchCompletedAppointments(user.email);
      } else {
        setCurrentUser(null);
        setAppointments([]);
        setUserDetails(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserDetails = (userId) => {
    const patientsRef = ref(db, "users/Patient");

    onValue(patientsRef, (snapshot) => {
      if(snapshot.exists()){
        const patients = snapshot.val();
        let userData = null;

        Object.values(patients).forEach((patient) => {
          if(patient.uid === userId){
            userData = patient;
          }
        });

        if(userData){
          setUserDetails(userData);
        }
      }
    });
  }

  const fetchCompletedAppointments = (email) => {
    const appointmentsRef = ref(db, "appointments");

    onValue(appointmentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allAppointments = snapshot.val();
        let completedAppointments = [];

        Object.entries(allAppointments).forEach(([date, dateAppointments]) => {
          Object.entries(dateAppointments).forEach(([id, appointment]) => {
            if (appointment.userId === email && appointment.status === "Completed") {
              completedAppointments.push({ id, ...appointment });
            }
          });
        });

        setAppointments(completedAppointments);
      }
    });
  };

  const handleViewInsuranceDetails = (appointment) => {
    setInsuranceDetails(appointment.insuranceDetails);
    setShowInsuranceForm(true);
  };

  const handleInsuranceClose = () => {
    setShowInsuranceForm(false);
    setInsuranceDetails(null);
  };

  return (
    <div>
      <button>
        <a href="/DashboardPatient">Go Back to Dashboard</a>
      </button>
  
      {userDetails && (
        <div style={{ textAlign: "center" }}>
          <h1>{userDetails.firstName} {userDetails.middleName} {userDetails.lastName}</h1>
          <p>{userDetails.email}</p>
        </div>
      )}
  
      <TreatmentHistory appointments={appointments} handleViewInsuranceDetails={handleViewInsuranceDetails} />
      
      <ViewInsurance
        isOpen={showInsuranceForm}
        onClose={handleInsuranceClose}
        insuranceDetails={insuranceDetails}
      />
    </div>
  );
};

export default PatientRecord;