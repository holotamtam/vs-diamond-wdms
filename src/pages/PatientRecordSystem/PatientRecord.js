import React, { useState, useEffect } from "react";
import { db, auth } from "../../backend/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import ViewInsurance from "../../components/ViewInsurance";
import TreatmentHistory from "../../components/TreatmentHistory";

const PatientRecord = () => {
  // State variables
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [insuranceDetails, setInsuranceDetails] = useState(null);
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);
  const [userDetails, setUserDetails] = useState(null);

  // Function to handle user authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchUserDetails(user.uid); // Fetch patient details from database
        fetchCompletedAppointments(user.uid); // Fetch completed appointments
      } else {
        setCurrentUser(null);
        setAppointments([]);
        setUserDetails(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Function to fetch user details from Firebase database
  const fetchUserDetails = (uid) => {
    const patientsRef = ref(db, "users/Patient");

    onValue(patientsRef, (snapshot) => {
      if (snapshot.exists()) {
        const patients = snapshot.val();
        let userData = null;

        // Iterate through patient records to find the matching user
        Object.values(patients).forEach((patient) => {
          if (patient.uid === uid) {
            userData = patient;
          }
        });

        if (userData) {
          setUserDetails(userData);
        }
      }
    });
  };

  // Function to fetch completed appointments from Firebase database
  const fetchCompletedAppointments = (uid) => {
    const appointmentsRef = ref(db, "appointments");

    onValue(appointmentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allAppointments = snapshot.val();
        let completedAppointments = [];

        // Iterate through all appointments and filter completed ones
        Object.entries(allAppointments).forEach(([date, dateAppointments]) => {
          Object.entries(dateAppointments).forEach(([id, appointment]) => {
            if (appointment.uid === uid && appointment.status === "Completed") {
              completedAppointments.push({ id, ...appointment });
            }
          });
        });

        setAppointments(completedAppointments);
      }
    });
  };

  // Function to handle viewing insurance details
  const handleViewInsuranceDetails = (appointment) => {
    setInsuranceDetails(appointment.insuranceDetails);
    setShowInsuranceForm(true);
  };

  // Function to close insurance details view
  const handleInsuranceClose = () => {
    setShowInsuranceForm(false);
    setInsuranceDetails(null);
  };

   // Handle logout
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
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li style={{ marginBottom: "20px" }}>
            <Link
              to="/dashboard-patient"
              style={{
                textDecoration: "none",
                color: "#333",
              }}
            >
              Dashboard
            </Link>
          </li>
          <li style={{ marginBottom: "20px" }}>
            <Link to="/treatment-history" style={{ textDecoration: "none",
                  color: "#333",
                  fontWeight: "bold", }}>
              Treatment History
            </Link>
          </li>
          <li style={{ marginBottom: "20px" }}>
            <Link to="/settings" style={{ textDecoration: "none", color: "#333" }}>
              Settings
            </Link>
          </li>
        </ul>
      </div>
      {/* Move user profile section above the sign out button */}
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
          Sign Out
        </button>
      </div>
    </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "20px" }}>
        {userDetails && (
          <div style={{ textAlign: "center" }}>
            <h1>
              {userDetails.firstName} {userDetails.middleName} {userDetails.lastName}
            </h1>
            <p>{userDetails.email}</p>
          </div>
        )}

        <TreatmentHistory
          appointments={appointments}
          handleViewInsuranceDetails={handleViewInsuranceDetails}
        />

        <ViewInsurance
          isOpen={showInsuranceForm}
          onClose={handleInsuranceClose}
          insuranceDetails={insuranceDetails}
        />
      </div>
    </div>
  );
};

export default PatientRecord;