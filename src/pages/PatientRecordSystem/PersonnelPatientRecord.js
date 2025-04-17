import React, { useState, useEffect } from "react";
import { db } from "../../backend/firebaseConfig";
import { ref, onValue } from "firebase/database";
import Modal from "react-modal";
import ViewInsurance from "../../components/ViewInsurance";
import DentalChart from "../../components/DentalChart";
import TreatmentHistory from "../../components/TreatmentHistory";
import MedicalHistory from "../../components/MedicalHistory"; // added for tab switching
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
  const [activeTab, setActiveTab] = useState("personal"); // 'personal' or 'medical'

  const location = useLocation();
  const navigate = useNavigate();
  const userRole = location.state?.userRole;

  // Fetch all appointments
  useEffect(() => {
    fetchAllAppointments();
    fetchAllPatients();
  }, []);

  // Fetch all appointments
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

  // Fetch all patient users
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
    setActiveTab("personal"); // Reset tab when selecting a new patient
  };

  // Function to handle search input
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

  // Function to handle viewing insurance details
  const handleViewInsuranceDetails = (appointment) => {
    setInsuranceDetails(appointment.insuranceDetails);
    setShowInsuranceForm(true);
  };


  // Function to close the insurance modal
  const handleInsuranceClose = () => {
    setShowInsuranceForm(false);
    setInsuranceDetails(null);
  };

  // Function to close the treatment history modal
  const handleTreatmentHistoryClose = () => {
    setShowTreatmentHistory(false);
  };


  // Function to close the dental chart modal
  const handleDentalChartClose = () => {
    setShowDentalChart(false);
  };

  // Function to handle going back to the dashboard based on user role
  const handleGoBack = () => {
    if (userRole === "DentistOwner") {
      navigate("/DashboardDentistOwner");
    } else if (userRole === "AssociateDentist") {
      navigate("/DashboardAssociateDentist");
    } else if (userRole === "ClinicStaff") {
      navigate("/DashboardClinicStaff");
    } else {
      alert("Unable to determine your role. Redirecting to the home page.");
      navigate("/");
    }
  };

  return (
    <div>
      <button onClick={handleGoBack}>Go Back to Dashboard</button>
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
          <h3>
            {selectedPatientName.firstName} {selectedPatientName.middleName} {selectedPatientName.lastName} ({selectedPatient})
          </h3>

          <div style={{ marginTop: "10px", marginBottom: "20px" }}>
            <button onClick={() => setShowTreatmentHistory(true)} style={{ marginRight: "10px" }}>
              View Treatment History
            </button>
            <button onClick={() => setShowDentalChart(true)}>View Dental Chart</button>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <button
              onClick={() => setActiveTab("personal")}
              style={{
                marginRight: "10px",
                backgroundColor: activeTab === "personal" ? "#ccc" : "#fff",
              }}
            >
              Personal Information
            </button>
            <button
              onClick={() => setActiveTab("medical")}
              style={{
                backgroundColor: activeTab === "medical" ? "#ccc" : "#fff",
              }}
            >
              Medical History
            </button>
          </div>

          {activeTab === "personal" && selectedPatientInfo && (
            <div>
              <p><strong>Name:</strong> {selectedPatientInfo.firstName} {selectedPatientInfo.middleName} {selectedPatientInfo.lastName}</p>
              <p><strong>Birthday:</strong> {selectedPatientInfo.birthday}</p>
              <p><strong>Age:</strong> {selectedPatientInfo.age}</p>
              <p><strong>Address:</strong> {selectedPatientInfo.address}</p>
              <p><strong>Email:</strong> {selectedPatientInfo.email}</p>
              <p><strong>Civil Status:</strong> {selectedPatientInfo.civilStatus}</p>
              <p><strong>Occupation:</strong> {selectedPatientInfo.occupation}</p>
            </div>
          )}

          {activeTab === "medical" && (
            <MedicalHistory patientId={selectedPatientInfo?.uid} />
          )}

          <Modal isOpen={showTreatmentHistory} onRequestClose={handleTreatmentHistoryClose} style={{ content: { width: "80%", margin: "auto" } }}>
            <h3>Treatment History for {selectedPatientName.firstName} {selectedPatientName.middleName} {selectedPatientName.lastName}</h3>
            <TreatmentHistory appointments={patientRecords} handleViewInsuranceDetails={handleViewInsuranceDetails} />
            <button onClick={handleTreatmentHistoryClose}>Close</button>
          </Modal>

          <Modal isOpen={showDentalChart} onRequestClose={handleDentalChartClose}>
            <DentalChart uid={selectedPatientInfo?.uid} />
            <button onClick={handleDentalChartClose}>Close</button>
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

      {/* View Insurance Modal */}
      <ViewInsurance
        isOpen={showInsuranceForm}
        onClose={handleInsuranceClose}
        insuranceDetails={insuranceDetails}
      />
    </div>
  );
};

export default PersonnelPatientRecord;
