import React, { useState, useEffect } from "react";
import { db } from "../../backend/firebaseConfig";
import { ref, onValue } from "firebase/database";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import Modal from "react-modal";
import ViewInsurance from "../../components/ViewInsurance";
import DentalChart from "../../components/DentalChart";
import TreatmentHistory from "../../components/TreatmentHistory";
import MedicalHistory from "../../components/MedicalHistory";
import { useLocation, useNavigate, Link } from "react-router-dom";

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
  const [userDetails, setUserDetails] = useState(null);


  const location = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();
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
            allAppointmentsList.push({ id, date, ...appointment });
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
        Object.entries(allUsers).forEach(([uid, user]) => {
          patientList.push({
            email: user.email,
            firstName: user.firstName,
            middleName: user.middleName,
            lastName: user.lastName,
            birthDate: user.birthday,
            age: user.age,
            address: user.address,
            civilStatus: user.civilStatus,
            occupation: user.occupation,
            uid: uid,
          });
        });
        setPatients(patientList);
        setFilteredPatients(patientList);
      }
    });
  };

  // Fetch user details for sidebar profile (search all personnel types)
  useEffect(() => {
    const personnelTypes = ["DentistOwner", "AssociateDentist", "ClinicStaff"];
    let unsubscribes = [];
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        let found = false;
        personnelTypes.forEach(type => {
          const userRef = ref(db, `users/Personnel/${type}/${user.uid}`);
          const unsub = onValue(userRef, (snapshot) => {
            if (snapshot.exists() && !found) {
              setUserDetails(snapshot.val());
              found = true;
              unsubscribes.forEach(u => u());
            }
          });
          unsubscribes.push(() => unsub());
        });
      }
    });
    return () => {
      unsubscribeAuth();
      unsubscribes.forEach(u => u());
    };
  }, [auth]);

  // Function to handle patient selection
  const handlePatientClick = (email) => {
    const patient = patients.find((patient) => patient.email === email);
    setSelectedPatient(email);
    setSelectedPatientName({ firstName: patient.firstName, middleName: patient.middleName, lastName: patient.lastName });
    setSelectedPatientInfo(patient);
    const patientAppointments = appointments.filter(
      (appointment) => appointment.uid === patient.uid && appointment.status === "Completed"
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
        (appointment) => appointment.uid === patient.uid && appointment.status === "Completed"
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

  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate("/", { replace: true });
    });
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div
        style={{
          width: "250px",
          background: "#f4f4f4",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          borderRight: "1px solid #ddd",
        }}
      >
        <div>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: "10px" }}>
              <Link to="/dashboard-dentistowner" state={{ userRole: "DentistOwner" }} style={{ textDecoration: "none", color: "#333"}}>
                Dashboard
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/patient-record" state={{ userRole: "DentistOwner" }} style={{ textDecoration: 'none', color: '#333', fontWeight: "bold" }}>
                Patient Record
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/inventory" state={{ userRole: "DentistOwner" }} style={{ textDecoration: 'none', color: '#333' }}>
                Inventory
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/revenue" state={{ userRole: "DentistOwner" }} style={{ textDecoration: 'none', color: '#333' }}>
                Revenue
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/manage-personnel" state={{ userRole: "DentistOwner" }} style={{ textDecoration: 'none', color: '#333' }}>
                Manage Personnel
              </Link>
            </li>
            <li style={{ marginBottom: "10px" }}>
              <Link to="/settings-personnel" state={{ userRole: "DentistOwner" }} style={{ textDecoration: "none", color: "#333" }}>
                Settings
              </Link>
            </li>
          </ul>
        </div>
         {/* User Profile and Logout */}
        <div>
          {userDetails && (
            <div style={{ display: "flex", alignItems: "center", marginBottom: "30px" }}>
              <img
                src={userDetails.profilePictureUrl || "https://via.placeholder.com/50"}
                alt="Profile"
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #ddd",
                  marginRight: "10px",
                }}
              />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span style={{ fontWeight: "bold", fontSize: "15px", textAlign: "left" }}>
                  {userDetails.firstName} {userDetails.middleName} {userDetails.lastName}
                </span>
                <span style={{ fontSize: "13px", color: "#555", textAlign: "left" }}>
                  {userDetails.email}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              background: "#f44336",
              color: "white",
              border: "none",
              padding: "10px",
              cursor: "pointer",
              borderRadius: "5px",
              width: "100%",
            }}
          >
            Logout
          </button>
        </div>
      </div>
      {/* Main Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Place all your existing PersonnelPatientRecord JSX here */}
        <div style={{ padding: "20px" }}>
          {/* ...existing content from your return statement... */}
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
      </div>
    </div>
  );
};

export default PersonnelPatientRecord;
