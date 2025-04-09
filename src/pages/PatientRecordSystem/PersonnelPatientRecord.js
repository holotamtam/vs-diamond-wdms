import React, { useState, useEffect } from "react";
import { db } from "../../backend/firebaseConfig";
import { ref, onValue } from "firebase/database";
import Modal from "react-modal";
import ViewInsurance from "../../components/ViewInsurance";
import DentalChart from "../../components/DentalChart";
import TreatmentHistory from "../../components/TreatmentHistory";
import { useLocation, useNavigate } from "react-router-dom";

Modal.setAppElement("#root");

const PersonnelPatientRecord = () => {
  // State variables
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
  const [showDentalChart, setShowDentalChart] = useState(false);
  const location = useLocation(); // Get the current location
  const navigate = useNavigate(); // Initialize the navigate function
  const userRole = location.state?.userRole; // Get the user role from the state

  // Fetch all appointments and patients when the component mounts
  useEffect(() => {
    fetchAllAppointments();
    fetchAllPatients();
  }, []);

  // Function to fetch all appointments from Firebase database
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

  // Function to fetch all patients from Firebase database
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
            birthday: user.birthday,
            age: user.age,
            address: user.address,
            civilStatus: user.civilStatus,
            occupation: user.occupation,
            uid: id,
          });
        });

        setPatients(patientList);
        setFilteredPatients(patientList);
      }
    });
  };

  // Function to handle patient selection
  const handlePatientClick = (email) => {
    const patient = patients.find((patient) => patient.email === email);
    setSelectedPatient(email);
    setSelectedPatientName({ firstName: patient.firstName, middleName: patient.middleName, lastName: patient.lastName });
    setSelectedPatientInfo(patient);
    const patientAppointments = appointments.filter(
      (appointment) => appointment.userId === email && appointment.status === "Completed"
    );
    setPatientRecords(patientAppointments);
  };

  // Function to handle viewing insurance details
  const handleViewInsuranceDetails = (appointment) => {
    setInsuranceDetails(appointment.insuranceDetails);
    setShowInsuranceForm(true);
  };
  
  // Function to handle closing the insurance form modal
  const handleInsuranceClose = () => {
    setShowInsuranceForm(false);
    setInsuranceDetails(null);
  };

  // Function to handle closing the treatment history modal
  const handleTreatmentHistoryClose = () => {
    setShowTreatmentHistory(false);
  };

  // Function to handle closing the dental chart modal
  const handleDentalChartClose = () => {
    setShowDentalChart(false);
  };

  // Function to format time from 24-hour to 12-hour format
  const formatTime = (time) => {
    const [hour, minute] = time.split(":").map(Number);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    const formattedMinute = minute < 10 ? `0${minute}` : minute;
    return `${formattedHour}:${formattedMinute} ${ampm}`;
  };

  // Function to handle search input change
  const handleSearch = (event) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = patients.filter((patient) => {
      const patientAppointments = appointments.filter(
        (appointment) => appointment.userId === patient.email && appointment.status === "Completed"
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

  const handleGoBack = () => {
      if (userRole === "DentistOwner") {
        navigate("/DashboardDentistOwner",);
      }else if (userRole === "AssociateDentist") {
        navigate("/DashboardAssociateDentist",);
      }else if (userRole === "ClinicStaff") {
        navigate("/DashboardClinicStaff",);
      }else {
            alert("Unable to determine your role. Redirecting to the home page.");
            navigate("/"); // Default to home if role is not determined
          }
    };

  return (
    <div>
      <button onClick ={handleGoBack}>Go Back to Dashboard </button>
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
              <button onClick={() => setShowDentalChart(true)}>View Dental Chart</button>
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
                width: '80%',
                marginRight: '-50%',
                transform: 'translate(-50%, -50%)',
              },
            }}
          >
            <h3>Treatment History for {selectedPatientName.firstName} {selectedPatientName.middleName} {selectedPatientName.lastName}</h3>
            <TreatmentHistory appointments={patientRecords} handleViewInsuranceDetails={handleViewInsuranceDetails} />
            <button onClick={handleTreatmentHistoryClose} style={{ marginTop: "10px" }}>Close</button>
          </Modal>
          <Modal
            isOpen={showDentalChart}
            onRequestClose={handleDentalChartClose}
            contentLabel="Dental Chart Modal"
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
            <DentalChart uid={selectedPatientInfo.uid} />
            <button onClick={handleDentalChartClose} style={{ marginTop: "10px" }}>Close</button>
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