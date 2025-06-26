import React, { useState, useEffect } from "react";
import { db } from "../../backend/firebaseConfig";
import { ref, onValue, get } from "firebase/database";
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
  const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      for (const type of personnelTypes) {
        const userRef = ref(db, `users/Personnel/${type}/${user.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          setUserDetails(snapshot.val());
          break;
        }
      }
    }
  });
  return () => {
    authUnsubscribe();
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
    <div style={{ display: "flex", height: "100vh", background: "#f8f5ef" }}>
      {/* Sidebar */}
      <div
        style={{
          width: "250px",
          background: "#f4f4f4",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          borderRight: "1px solid #ddd"
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
              <Link to="/patient-record" state={{ userRole: "DentistOwner" }} style={{ textDecoration: 'none', color: '#C7A76C', fontWeight: "bold" }}>
                Patient Record
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/inventory" state={{ userRole: "DentistOwner" }} style={{ textDecoration: 'none', color: '#333' }}>
                Inventory
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/analytics" state={{ userRole: "DentistOwner" }} style={{ textDecoration: 'none', color: '#333' }}>
                Analytics
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
      {/* Main Content Area: header and content in a column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {/* Header Bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#fff",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          padding: "28px 32px 18px 32px",
          borderBottom: "1px solid #f0eae2",
          position: "sticky",
          top: 0,
          zIndex: 10,
          height: "35.333px"
        }}>
          <span style={{ fontWeight: 700, fontSize: "24px", color: "#3d342b", letterSpacing: 0.5 }}>Patient Records</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={handleSearch}
              style={{
                background: "transparent",
                border: "none",
                borderBottom: "2px solid #d6cfc2",
                outline: "none",
                fontSize: 18,
                padding: "6px 32px 6px 8px",
                color: "#7a6d5c",
                width: 180,
                marginRight: 8
              }}
            />
            <svg width="22" height="22" fill="none" stroke="#bca77b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
        </div>
        {/* Main Content Row (table and patient info) */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", alignItems: "flex-start", padding: "15px 0 0 0" }}>
          {/* Patient List Card */}
          <div style={{
            flex: 2,
            minWidth: 0,
            background: "#fff",
            borderRadius: 24,
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            padding: "32px 32px 32px 32px",
            marginLeft: 20,
            marginRight: 0,
            overflow: "hidden",
            border: "1px solid #f0eae2"
          }}>
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 16 }}>
                <thead>
                  <tr style={{ background: '#fff' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#bca77b', borderBottom: '2px solid #e0e0e0' }}>Last Name <span style={{fontSize:12}}>⇅</span></th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#bca77b', borderBottom: '2px solid #e0e0e0' }}>First Name <span style={{fontSize:12}}>⇅</span></th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#bca77b', borderBottom: '2px solid #e0e0e0' }}>Middle Name <span style={{fontSize:12}}>⇅</span></th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#bca77b', borderBottom: '2px solid #e0e0e0' }}>Email Address <span style={{fontSize:12}}>⇅</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: '16px', color: '#888', textAlign: 'center' }}>No patients found.</td></tr>
                  ) : (
                    filteredPatients.map((patient) => {
                      const isSelected = selectedPatient === patient.email;
                      return (
                        <tr
                          key={patient.email}
                          onClick={() => handlePatientClick(patient.email)}
                          style={{
                            cursor: 'pointer',
                            background: isSelected ? '#393737' : '#fff',
                            color: isSelected ? '#fff' : '#222',
                            fontWeight: isSelected ? 600 : 500,
                            borderRadius: isSelected ? 12 : 0,
                            transition: 'all 0.2s',
                          }}
                        >
                          <td style={{ padding: '16px', borderBottom: '1px solid #e0e0e0', borderTopLeftRadius: isSelected ? 12 : 0, borderBottomLeftRadius: isSelected ? 12 : 0 }}>{patient.lastName}</td>
                          <td style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>{patient.firstName}</td>
                          <td style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>{patient.middleName && patient.middleName !== "--" ? patient.middleName : "--"}</td>
                          <td style={{ padding: '16px', borderBottom: '1px solid #e0e0e0', borderTopRightRadius: isSelected ? 12 : 0, borderBottomRightRadius: isSelected ? 12 : 0 }}>{patient.email}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* Patient Details Card */}
          <div style={{
            flex: 1,
            minWidth: 380,
            maxWidth: 440,
            padding: "0",
            background: "transparent",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            marginRight: 20
          }}>
            <div style={{
              width: 420,
              background: "#f9f6f2",
              borderRadius: 22,
              boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
              padding: 32,
              marginTop: 0,
              border: '1px solid #ede7df',
              minHeight: 420
            }}>
              {selectedPatient && selectedPatientInfo ? (
                <>
                  <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 18, color: '#3d342b' }}>Patient Information</div>
                  <hr style={{ border: 'none', borderTop: '1px solid #e0dedb', margin: '18px 0' }} />
                  <div style={{ fontWeight: 600, fontSize: 20, marginBottom: 16, color: '#3d342b' }}>Details</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 8, columnGap: 12, marginBottom: 24 }}>
                    <div style={{ color: '#b0a89f', fontWeight: 500 }}>Name</div>
                    <div style={{ color: '#3d342b', fontWeight: 500 }}>
                      {selectedPatientInfo.firstName ? selectedPatientInfo.firstName : 'N/A'}{' '}
                      {selectedPatientInfo.middleName && selectedPatientInfo.middleName !== '--' ? selectedPatientInfo.middleName + ' ' : selectedPatientInfo.middleName === '--' || !selectedPatientInfo.middleName ? '' : selectedPatientInfo.middleName + ' '}
                      {selectedPatientInfo.lastName ? selectedPatientInfo.lastName : 'N/A'}
                    </div>
                    <div style={{ color: '#b0a89f', fontWeight: 500 }}>Birthdate</div>
                    <div style={{ color: '#3d342b' }}>{selectedPatientInfo.birthday ? selectedPatientInfo.birthday : 'N/A'}</div>
                    <div style={{ color: '#b0a89f', fontWeight: 500 }}>Age</div>
                    <div style={{ color: '#3d342b' }}>{selectedPatientInfo.age ? selectedPatientInfo.age : 'N/A'}</div>
                    <div style={{ color: '#b0a89f', fontWeight: 500 }}>Address</div>
                    <div style={{ color: '#3d342b' }}>{selectedPatientInfo.address ? selectedPatientInfo.address : 'N/A'}</div>
                    <div style={{ color: '#b0a89f', fontWeight: 500 }}>Email</div>
                    <div style={{ color: '#3d342b' }}>{selectedPatientInfo.email ? selectedPatientInfo.email : 'N/A'}</div>
                    <div style={{ color: '#b0a89f', fontWeight: 500 }}>Civil Status</div>
                    <div style={{ color: '#3d342b' }}>{selectedPatientInfo.civilStatus ? selectedPatientInfo.civilStatus : 'N/A'}</div>
                    <div style={{ color: '#b0a89f', fontWeight: 500 }}>Occupation</div>
                    <div style={{ color: '#3d342b' }}>{selectedPatientInfo.occupation ? selectedPatientInfo.occupation : 'N/A'}</div>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid #e0dedb', margin: '18px 0' }} />
                  {/* Action Rows */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600, fontSize: 19, color: '#3d342b', marginBottom: 18 }}>
                    Treatment History
                    <button onClick={() => setShowTreatmentHistory(true)} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>View</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600, fontSize: 19, color: '#3d342b', marginBottom: 18 }}>
                    Medical History
                    <button onClick={() => setActiveTab("medical")} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>View</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600, fontSize: 19, color: '#3d342b', marginBottom: 0 }}>
                    Dental Chart
                    <button onClick={() => setShowDentalChart(true)} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>View</button>
                  </div>
                  {/* Medical History Modal */}
                  <Modal isOpen={activeTab === "medical"} onRequestClose={() => setActiveTab("personal")} style={{ content: { width: "60%", margin: "auto" } }}>
                    <h3>Medical History for {selectedPatientName.firstName} {selectedPatientName.middleName} {selectedPatientName.lastName}</h3>
                    <MedicalHistory patientId={selectedPatientInfo?.uid} />
                    <button onClick={() => setActiveTab("personal")}>Close</button>
                  </Modal>
                  {/* Treatment History Modal */}
                  <Modal isOpen={showTreatmentHistory} onRequestClose={handleTreatmentHistoryClose} style={{ content: { width: "80%", margin: "auto" } }}>
                    <h3>Treatment History for {selectedPatientName.firstName} {selectedPatientName.middleName} {selectedPatientName.lastName}</h3>
                    <TreatmentHistory appointments={patientRecords} handleViewInsuranceDetails={handleViewInsuranceDetails} />
                    <ViewInsurance
                      isOpen={showInsuranceForm}
                      onClose={handleInsuranceClose}
                      insuranceDetails={insuranceDetails}
                    />
                    <button onClick={handleTreatmentHistoryClose}>Close</button>
                  </Modal>
                  {/* Dental Chart Modal */}
                  <Modal isOpen={showDentalChart} onRequestClose={handleDentalChartClose} style={{ content: { width: "60%", margin: "auto" } }}>
                    <h3>Dental Chart for {selectedPatientName.firstName} {selectedPatientName.middleName} {selectedPatientName.lastName}</h3>
                    <DentalChart uid={selectedPatientInfo?.uid} />
                    <button onClick={handleDentalChartClose}>Close</button>
                  </Modal>
                </>
              ) : (
                <div style={{ color: "#888", fontSize: 18, marginTop: 80 }}>Select a patient to view their information.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonnelPatientRecord;
