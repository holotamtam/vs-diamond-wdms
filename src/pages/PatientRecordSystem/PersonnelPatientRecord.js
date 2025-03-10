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
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [insuranceDetails, setInsuranceDetails] = useState(null);
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);
  const [selectedPatientName, setSelectedPatientName] = useState({ firstName: "", middleName: "", lastName: "" });
  const [selectedPatientInfo, setSelectedPatientInfo] = useState(null);
  const [showTreatmentHistory, setShowTreatmentHistory] = useState(false);

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
          patientList.push({
            email: user.email,
            firstName: user.firstName,
            middleName: user.middleName,
            lastName: user.lastName,
            civilStatus: user.civilStatus,
            occupation: user.occupation,
          });
        });

        setPatients(patientList);
        setFilteredPatients(patientList);
      }
    });
  };

  const handlePatientClick = (email) => {
    const patient = patients.find((patient) => patient.email === email);
    setSelectedPatient(email);
    setSelectedPatientName({ firstName: patient.firstName, middleName: patient.middleName, lastName: patient.lastName });
    setSelectedPatientInfo(patient);
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

  const handleTreatmentHistoryClose = () => {
    setShowTreatmentHistory(false);
  };

  const formatTime = (time) => {
    const [hour, minute] = time.split(":").map(Number);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    const formattedMinute = minute < 10 ? `0${minute}` : minute;
    return `${formattedHour}:${formattedMinute} ${ampm}`;
  };

  const handleSearch = (event) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = patients.filter((patient) => {
      const patientAppointments = appointments.filter(
        (appointment) => appointment.userId === patient.email
      );
      return (
        patient.email.toLowerCase().includes(term) ||
        patient.firstName.toLowerCase().includes(term) ||
        patient.middleName.toLowerCase().includes(term) ||
        patient.lastName.toLowerCase().includes(term) ||
        patientAppointments.some((appointment) =>
          appointment.date.toLowerCase().includes(term) ||
          appointment.services.some((service) =>
            service.toLowerCase().includes(term)
          )
        )
      );
    });
    setFilteredPatients(filtered);
  };

  return (
    <div>
      <button>
        <a href="/DashboardPersonnel">Go Back to Dashboard</a>
      </button>
      <h2>Patient Records</h2>
      <input
        type="text"
        placeholder="Search"
        value={searchTerm}
        onChange={handleSearch}
        style={{ marginBottom: "20px", padding: "10px", width: "30%" }}
      />
      {selectedPatient ? (
        <div>
          <button onClick={() => setSelectedPatient(null)}>Back to Patient List</button>
          <h3>Personal Information for {selectedPatientName.firstName} {selectedPatientName.middleName} {selectedPatientName.lastName} ({selectedPatient})</h3>
          {selectedPatientInfo && (
            <div>
              <p><strong>Name:</strong> {selectedPatientInfo.firstName} {selectedPatientInfo.middleName} {selectedPatientInfo.lastName}</p>
              <p><strong>Birthday:</strong> {selectedPatientInfo.birthday}</p>
              <p><strong>Age:</strong> {selectedPatientInfo.age}</p>
              <p><strong>Address:</strong> {selectedPatientInfo.address}</p>
              <p><strong>Email:</strong> {selectedPatientInfo.email}</p>
              <p><strong>Civil Status:</strong> {selectedPatientInfo.civilStatus}</p>
              <p><strong>Occupation:</strong> {selectedPatientInfo.occupation}</p>
              <button onClick={() => setShowTreatmentHistory(true)}>View Treatment History</button>
            </div>
          )}
          <Modal
            isOpen={showTreatmentHistory}
            onRequestClose={handleTreatmentHistoryClose}
            contentLabel="Treatment History Modal"
            style={{
              overlay: {
                backgroundColor: "rgba(0, 0, 0, 0.5)",
              },
              content: {
                top: '50%',
                left: '50%',
                right: 'auto',
                bottom: 'auto',
                marginRight: '-50%',
                transform: 'translate(-50%, -50%)',
              },
            }}
          >
            <h3>Treatment History for {selectedPatientName.firstName} {selectedPatientName.middleName} {selectedPatientName.lastName}</h3>
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
            <button onClick={handleTreatmentHistoryClose} style={{ marginTop: "10px" }}>Close</button>
          </Modal>
        </div>
      ) : (
        <div>
          {filteredPatients.length === 0 ? (
            <p>No patients found.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filteredPatients.map((patient) => (
                <button
                  key={patient.email}
                  onClick={() => handlePatientClick(patient.email)}
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    background: "#f9f9f9",
                    textAlign: "left",
                  }}
                >
                  {patient.email}
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