import React, { useState, useEffect } from "react";
import { db, auth } from "../../backend/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue } from "firebase/database";

const PatientAppointmentStatus = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user ? user : null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchAppointments();
    }
  }, [currentUser]);

  const fetchAppointments = () => {
    const appointmentsRef = ref(db, "appointments");
    onValue(appointmentsRef, (snapshot) => {
      const data = snapshot.val();
      const userAppointments = [];
      if (data) {
        Object.entries(data).forEach(([date, appointmentsOnDate]) => {
          Object.entries(appointmentsOnDate).forEach(([id, appointment]) => {
            if (
              appointment.userId === currentUser.email &&
              (appointment.status === "Pending" || appointment.status === "Confirmed")
            ) {
              userAppointments.push({ id, date, ...appointment });
            }
          });
        });
      }
      setAppointments(userAppointments);
    });
  };

  return (
    <div>
      <button>
        <a href="/DashboardPatient">Go Back to Dashboard</a>
      </button>
      <h1>Your Appointments</h1>
      {appointments.length > 0 ? (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid black", padding: "10px" }}>Date</th>
              <th style={{ border: "1px solid black", padding: "10px" }}>Time</th>
              <th style={{ border: "1px solid black", padding: "10px" }}>Services</th>
              <th style={{ border: "1px solid black", padding: "10px" }}>Dentist</th>
              <th style={{ border: "1px solid black", padding: "10px" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td style={{ border: "1px solid black", padding: "10px" }}>{appointment.date}</td>
                <td style={{ border: "1px solid black", padding: "10px" }}>{appointment.time}</td>
                <td style={{ border: "1px solid black", padding: "10px" }}>{appointment.services.join(", ")}</td>
                <td style={{ border: "1px solid black", padding: "10px" }}>{appointment.dentist}</td>
                <td style={{ border: "1px solid black", padding: "10px", color: appointment.status === "Confirmed" ? "green" : "orange" }}>
                  {appointment.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No appointments found.</p>
      )}
    </div>
  );
};

export default PatientAppointmentStatus;