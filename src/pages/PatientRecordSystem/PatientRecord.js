import React, { useState, useEffect } from "react";
import { db, auth } from "../../backend/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import ViewInsurance from "../../components/ViewInsurance";

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
        <h1 style={{ textAlign: "center" }}>
          {userDetails.firstName} {userDetails.middleName} {userDetails.lastName}
        </h1>
      )}
  
      <h2>Treatment History</h2>
      {appointments.length === 0 ? (
        <p>No completed appointments.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                background: "#f9f9f9",
              }}
            >
              {/* First Row: Horizontal Layout */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <p><strong>Date:</strong> {appointment.date}</p>
                <p><strong>Time:</strong> {appointment.time} - {appointment.endTime}</p>
                <p><strong>Services:</strong> {appointment.services.join(", ")}</p>
                <p><strong>Bill:</strong> {appointment.bill}</p>
                <button
                  onClick={() => handleViewInsuranceDetails(appointment)}
                  style={{
                    background: "blue",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  View Insurance Details
                </button>
              </div>
  
              {/* Second Row: Dentist Remarks Below */}
              <div style={{ marginTop: "-4px", padding: "0" }}>
                <p style={{ margin: "0", marginBottom: "16px", padding: "0", lineHeight: "1" }}>
                  <strong>Dentist Remarks:</strong> {appointment.dentistRemarks}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      <ViewInsurance
        isOpen={showInsuranceForm}
        onClose={handleInsuranceClose}
        insuranceDetails={insuranceDetails}
      />
    </div>
  );
};

export default PatientRecord;
