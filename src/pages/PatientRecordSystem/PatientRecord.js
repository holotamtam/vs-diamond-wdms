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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchCompletedAppointments(user.email);
      } else {
        setCurrentUser(null);
        setAppointments([]);
      }
    });

    return () => unsubscribe();
  }, []);

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
      <h2>Completed Appointments</h2>
      {appointments.length === 0 ? (
        <p>No completed appointments.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                background: "#f9f9f9",
              }}
            >
              <p><strong>Date:</strong> {appointment.date}</p>
              <p><strong>Time:</strong> {appointment.time} - {appointment.endTime}</p>
              <p><strong>Services:</strong> {appointment.services.join(", ")}</p>
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
