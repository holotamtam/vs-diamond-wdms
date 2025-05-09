import React, { useState, useEffect } from "react";
import { db, auth } from "../../backend/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import ViewInsurance from "../../components/ViewInsurance";
import TreatmentHistory from "../../components/TreatmentHistory";

const PatientRecord = () => {
  // State variables
  const [currentUser, setCurrentUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [insuranceDetails, setInsuranceDetails] = useState(null);
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);
  const [userDetails, setUserDetails] = useState(null);

  // Function to handle user authentication state changes/
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchUserDetails(user.uid);  // Fetch patient details from database
        fetchCompletedAppointments(user.email);  // Fetch completed appointments
      } else {
        setCurrentUser(null);
        setAppointments([]);
        setUserDetails(null);
      }
    });

    return () => unsubscribe();
  }, []);

  
  // Function to fetch user details from Firebase database
  const fetchUserDetails = (userId) => {
    const patientsRef = ref(db, "users/Patient");

    onValue(patientsRef, (snapshot) => {
      if(snapshot.exists()){
        const patients = snapshot.val();
        let userData = null;

        // Iterate through patient records to find the matching user
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

  // Function to fetch completed appointments from Firebase database
  const fetchCompletedAppointments = (email) => {
    const appointmentsRef = ref(db, "appointments");

    onValue(appointmentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allAppointments = snapshot.val();
        let completedAppointments = [];

        // Iterate through all appointments and filter completed ones
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

  // Function to handle viewing insurance details
  const handleViewInsuranceDetails = (appointment) => {
    setInsuranceDetails(appointment.insuranceDetails);
    setShowInsuranceForm(true);
  };

  // Function to close insurance details view
  const handleInsuranceClose = () => {
    setShowInsuranceForm(false);
    setInsuranceDetails(null);
  };

  return (
    <div>
      <button>
        <a href="/dashboard-patient">Go Back to Dashboard</a>
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