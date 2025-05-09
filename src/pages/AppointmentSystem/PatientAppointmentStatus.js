import React, { useState, useEffect } from "react";
import { db, auth } from "../../backend/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue, remove } from "firebase/database";
import ViewInsurance from "../../components/ViewInsurance";

const PatientAppointmentStatus = () => {
  // State variables
  const [currentUser, setCurrentUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [selectedInsuranceDetails, setSelectedInsuranceDetails] = useState(null);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);

  // Fetch current user and appointments on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user ? user : null);
    });
    return () => unsubscribe();
  }, []);

  // Fetch appointments when current user changes
  useEffect(() => {
    if (currentUser) {
      fetchAppointments();
    }
  }, [currentUser]);

  // Fetch appointments from Firebase
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

  // Cancel appointment function
  const cancelAppointment = async (appointmentId, date) => {
    const appointmentRef = ref(db, `appointments/${date}/${appointmentId}`);
    try {
      await remove(appointmentRef);
      setAppointments((prevAppointments) =>
        prevAppointments.filter((appointment) => appointment.id !== appointmentId)
      );
      alert("Appointment canceled successfully.");
    } catch (error) {
      console.error("Error canceling appointment:", error);
      alert("Failed to cancel the appointment.");
    }
  };

  // View insurance details function
  const viewInsuranceDetails = (insuranceDetails) => {
    setSelectedInsuranceDetails(insuranceDetails);
    setShowInsuranceModal(true);
  };

  // Format time in AM/PM format
  const formatTime = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12; // Convert 0 to 12 for AM/PM format
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  // Calculate end time based on start time and duration
  const calculateEndTime = (startTime, duration) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return formatTime(`${endHours}:${endMinutes}`);
  };

  return (
    <div>
      <button>
        <a href="/dashboard-patient">Go Back to Dashboard</a>
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
              <th style={{ border: "1px solid black", padding: "10px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td style={{ border: "1px solid black", padding: "10px" }}>{appointment.date}</td>
                <td style={{ border: "1px solid black", padding: "10px" }}>
                  {formatTime(appointment.time)} - {calculateEndTime(appointment.time, appointment.duration)}
                </td>
                <td style={{ border: "1px solid black", padding: "10px" }}>{appointment.services.join(", ")}</td>
                <td style={{ border: "1px solid black", padding: "10px" }}>{appointment.dentist}</td>
                <td
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    color: appointment.status === "Confirmed" ? "green" : "orange",
                  }}
                >
                  {appointment.status}
                </td>
                <td style={{ border: "1px solid black", padding: "10px", textAlign: "center" }}>
                  <button
                    onClick={() => cancelAppointment(appointment.id, appointment.date)}
                    style={{
                      background: "red",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      cursor: "pointer",
                      borderRadius: "5px",
                      marginRight: "5px",
                    }}
                  >
                    Cancel
                  </button>
                  {appointment.insuranceDetails && (
                  <button
                  onClick={() => viewInsuranceDetails(appointment.insuranceDetails)}
                  style={{
                   background: "blue",
                   color: "white",
                  border: "none",
                   padding: "5px 10px",
                  cursor: "pointer",
                   borderRadius: "5px",
                  }}
                    >
                      View Insurance
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No appointments found.</p>
      )}

      {/* Insurance Details Modal */}
      <ViewInsurance
        isOpen={showInsuranceModal}
        onClose={() => setShowInsuranceModal(false)}
        insuranceDetails={selectedInsuranceDetails}
      />
    </div>
  );
};

export default PatientAppointmentStatus;