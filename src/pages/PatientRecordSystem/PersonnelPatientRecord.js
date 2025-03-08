import React, { useState, useEffect } from "react";
import { db } from "../../backend/firebaseConfig";
import { ref, onValue } from "firebase/database";
import Modal from "react-modal";
import ViewInsurance from "../../components/ViewInsurance";

Modal.setAppElement("#root");

const PersonnelPatientRecord = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [insuranceDetails, setInsuranceDetails] = useState(null);
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);

  useEffect(() => {
    fetchAllAppointments();
    fetchAllPatients();
  }, []);

  const fetchAllAppointments = () => {
    const appointmentsRef = ref(db, "appointments");

    onValue(appointmentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allAppointments = snapshot.val();
        let allAppointmentsList = [];

        Object.entries(allAppointments).forEach(([date, dateAppointments]) => {
          Object.entries(dateAppointments).forEach(([id, appointment]) => {
            allAppointmentsList.push({ id, ...appointment });
          });
        });

        setAppointments(allAppointmentsList);
      }
    });
  };

  const fetchAllPatients = () => {
    const usersRef = ref(db, "users/Patient");

    onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const allUsers = snapshot.val();
        let patientList = [];

        Object.entries(allUsers).forEach(([id, user]) => {
          patientList.push(user.email);
        });

        setPatients(patientList);
      }
    });
  };

  const handlePatientClick = (email) => {
    setSelectedPatient(email);
    const patientAppointments = appointments.filter(
      (appointment) => appointment.userId === email
    );
    setPatientRecords(patientAppointments);
  };

  const handleViewInsuranceDetails = (appointment) => {
    setInsuranceDetails(appointment.insuranceDetails);
    setShowInsuranceForm(true);
  };

  const handleInsuranceClose = () => {
    setShowInsuranceForm(false);
    setInsuranceDetails(null);
  };

  const formatTime = (time) => {
    const [hour, minute] = time.split(":").map(Number);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    const formattedMinute = minute < 10 ? `0${minute}` : minute;
    return `${formattedHour}:${formattedMinute} ${ampm}`;
  };

  return (
    <div>
      <button>
        <a href="/DashboardPersonnel">Go Back to Dashboard</a>
      </button>
      <h2>Patient Records</h2>
      {selectedPatient ? (
        <div>
          <button onClick={() => setSelectedPatient(null)}>Back to Patient List</button>
          <h3>Records for {selectedPatient}</h3>
          {patientRecords.length === 0 ? (
            <p>No appointments found for this patient.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {patientRecords.map((appointment) => (
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
                  <p><strong>Time:</strong> {formatTime(appointment.time)} - {formatTime(appointment.endTime)}</p>
                  <p><strong>Services:</strong> {appointment.services.join(", ")}</p>
                  <p><strong>Status:</strong> {appointment.status}</p>
                  <p><strong>Bill:</strong> {appointment.bill}</p>
                  {appointment.insuranceDetails && (
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
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {patients.length === 0 ? (
            <p>No patients found.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {patients.map((email) => (
                <button
                  key={email}
                  onClick={() => handlePatientClick(email)}
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    background: "#f9f9f9",
                    textAlign: "left",
                  }}
                >
                  {email}
                </button>
              ))}
            </div>
          )}
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

export default PersonnelPatientRecord;