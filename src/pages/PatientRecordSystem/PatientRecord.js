import React, { useState, useEffect } from "react";
import { db, auth } from "../../backend/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { ref, onValue, get } from "firebase/database";
import ViewInsurance from "../../components/ViewInsurance";

const PatientRecord = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [insuranceDetails, setInsuranceDetails] = useState(null);
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);
  const [userDetails, setUserDetails] = useState(null);

  // For selected treatment details
  const [selectedTreatment, setSelectedTreatment] = useState(null);

  // Fetch user and appointments
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchUserDetails(user.uid);
        fetchCompletedAppointments(user.uid);
      } else {
        setCurrentUser(null);
        setAppointments([]);
        setUserDetails(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch user details
  const fetchUserDetails = async (uid) => {
  const patientsRef = ref(db, "users/Patient");
  try {
    const snapshot = await get(patientsRef);
    if (snapshot.exists()) {
      const patients = snapshot.val();
      let userData = null;
      Object.values(patients).forEach((patient) => {
        if (patient.uid === uid) {
          userData = patient;
        }
      });
      if (userData) setUserDetails(userData);
    }
  } catch (error) {
    console.error("Error fetching user details:", error.message);
  }
};

  // Fetch completed appointments
  const fetchCompletedAppointments = (uid) => {
    const appointmentsRef = ref(db, "appointments");
    onValue(appointmentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allAppointments = snapshot.val();
        let completedAppointments = [];
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

  // Insurance modal handlers
  const handleViewInsuranceDetails = (appointment) => {
    setInsuranceDetails(appointment.insuranceDetails);
    setShowInsuranceForm(true);
  };
  const handleInsuranceClose = () => {
    setShowInsuranceForm(false);
    setInsuranceDetails(null);
  };

  // Logout
  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate("/", { replace: true });
    });
  };

  // Group appointments by month and year, latest month on top, January at the bottom
  const groupedAppointments = {};
  appointments.forEach((appt) => {
    if (!appt.date) return;
    const dateObj = new Date(appt.date);
    const month = dateObj.toLocaleString("default", { month: "long" });
    const year = dateObj.getFullYear();
    const key = `${year}-${month}`;
    if (!groupedAppointments[key]) groupedAppointments[key] = [];
    groupedAppointments[key].push(appt);
  });

  // Sort months: latest first, January at the bottom
  const sortedMonthKeys = Object.keys(groupedAppointments).sort((a, b) => {
    const [yearA, monthA] = a.split("-");
    const [yearB, monthB] = b.split("-");
    const dateA = new Date(`${monthA} 1, ${yearA}`);
    const dateB = new Date(`${monthB} 1, ${yearB}`);
    return dateB - dateA;
  });

  // Add this helper function above your component definition or inside the component
function parseTimeToMinutes(time) {
  if (!time || typeof time !== "string" || !time.includes(":")) return null;
  const [hourStr, minuteStr] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (isNaN(hour) || isNaN(minute)) return null;
  return hour * 60 + minute;
}

function formatTime(minutes) {
  if (minutes === null || minutes === undefined) return "";
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const ampm = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;
  const formattedMinute = minute < 10 ? `0${minute}` : minute;
  return `${formattedHour}:${formattedMinute} ${ampm}`;
}

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
              <Link to="/treatment-history" style={{ textDecoration: "none", color: "#C7A76C", fontWeight: "bold" }}>
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
            Sign Out
          </button>
        </div>
      </div>

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
          <span style={{ fontWeight: 700, fontSize: "24px", color: "#3d342b", letterSpacing: 0.5 }}>Treatment History</span>
        </div>
        {/* Main Content Row (table and patient info) */}
        <div style={{
          display: "flex",
          gap: 16,
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "15px 0 0 0"
        }}>
           {/* Left: List of Treatments */}
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
            {sortedMonthKeys.length === 0 ? (
              <p style={{ textAlign: "center" }}>No treatment history found.</p>
            ) : (
              <div>
                {sortedMonthKeys.map((monthKey) => (
                  <div key={monthKey} style={{ marginBottom: "30px" }}>
                    <h2 style={{
                      borderBottom: "1px solid #ddd",
                      paddingBottom: "8px",
                      color: "#333",
                      textAlign: "left",
                      fontSize: "20px"
                    }}>
                      {monthKey}
                    </h2>
                    <div>
                    {groupedAppointments[monthKey]
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .map((appt) => {
    const isSelected = selectedTreatment === appt;
    return (
      <div
        key={appt.id}
        style={{
          border: "1px solid #e0e0e0",
          borderRadius: isSelected ? 12 : 8,
          padding: "16px",
          marginBottom: "16px",
          background: isSelected ? "#393737" : "#fff",
          color: isSelected ? "#fff" : "#222",
          fontWeight: isSelected ? 600 : 500,
          fontSize: "16px",
          cursor: "pointer",
          transition: "all 0.2s",
          boxShadow: isSelected
            ? "0 0 0 2px #393737"
            : "0 1px 2px rgba(0,0,0,0.03)",
          outline: isSelected ? "2px solid #393737" : "none",
        }}
        onClick={() => setSelectedTreatment(appt)}
      >
        <div style={{ fontWeight: 600, fontSize: "16px", marginBottom: "8px" }}>
          {appt.services || "Service"}
        </div>
        <div style={{ fontSize: "15px" }}>
          <div>
            <span style={{ fontWeight: 500 }}>Date:</span>{" "}
            {appt.date ? new Date(appt.date).toLocaleDateString() : "N/A"}
          </div>
          <div>
            <span style={{ fontWeight: 500 }}>Time:</span>{" "}
            {(() => {
              function parseTimeToMinutes(time) {
                if (!time || typeof time !== "string" || !time.includes(":")) return null;
                const [hourStr, minuteStr] = time.split(":");
                const hour = parseInt(hourStr, 10);
                const minute = parseInt(minuteStr, 10);
                if (isNaN(hour) || isNaN(minute)) return null;
                return hour * 60 + minute;
              }
              function formatTime(minutes) {
                if (minutes === null || minutes === undefined) return "";
                const hour = Math.floor(minutes / 60);
                const minute = minutes % 60;
                const ampm = hour >= 12 ? "PM" : "AM";
                const formattedHour = hour % 12 || 12;
                const formattedMinute = minute < 10 ? `0${minute}` : minute;
                return `${formattedHour}:${formattedMinute} ${ampm}`;
              }
              if (appt.startTime) {
                const start = parseTimeToMinutes(appt.startTime);
                const end = appt.endTime
                  ? parseTimeToMinutes(appt.endTime)
                  : appt.duration
                    ? start + Number(appt.duration)
                    : null;
                return end !== null
                  ? `${formatTime(start)} - ${formatTime(end)}`
                  : formatTime(start);
              } else if (appt.time) {
                const start = parseTimeToMinutes(appt.time);
                const end = appt.duration
                  ? start + Number(appt.duration)
                  : null;
                return end !== null
                  ? `${formatTime(start)} - ${formatTime(end)}`
                  : start !== null
                    ? formatTime(start)
                    : "N/A";
              } else {
                return "N/A";
              }
            })()}
          </div>
        </div>
      </div>
    );
  })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Treatment Details */}
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
            {selectedTreatment ? (
              <>
                {/* Remarks */}
<div style={{ marginBottom: "32px" }}>
  <span style={{ fontWeight: "bold", fontSize: "19px", color: "#333", display: "block", marginBottom: "15px"  }}>Remarks</span>
  <div style={{ marginTop: "8px", fontSize: "15px", color: "#333" }}>
    {selectedTreatment.remarks || "No remarks."}
  </div>
</div>
<hr style={{ border: "none", borderBottom: "1px solid #eee", margin: "0 0 32px 0" }} />

{/* Details */}
<div style={{ marginBottom: "32px" }}>
  <span style={{ fontWeight: "bold", fontSize: "19px", color: "#333", display: "block", marginBottom: "15px" }}>Details</span>
  <div>
    <div style={{ marginBottom: "10px" }}>
      <span style={{ fontWeight: "bold" }}>Service:</span> {selectedTreatment.services || "Service"}
    </div>
    <div style={{ marginBottom: "10px" }}>
      <span style={{ fontWeight: "bold" }}>Date:</span> {selectedTreatment.date ? new Date(selectedTreatment.date).toLocaleDateString() : "N/A"}
    </div>
    <div style={{ marginBottom: "10px" }}>
      <span style={{ fontWeight: "bold" }}>Time:</span>{" "}
      {(() => {
        // Prefer startTime/endTime, fallback to time/duration, else N/A
        if (selectedTreatment.startTime) {
          const start = parseTimeToMinutes(selectedTreatment.startTime);
          const end = selectedTreatment.endTime
            ? parseTimeToMinutes(selectedTreatment.endTime)
            : selectedTreatment.duration
              ? start + Number(selectedTreatment.duration)
              : null;
          return end !== null
            ? `${formatTime(start)} - ${formatTime(end)}`
            : formatTime(start);
        } else if (selectedTreatment.time) {
          const start = parseTimeToMinutes(selectedTreatment.time);
          const end = selectedTreatment.duration
            ? start + Number(selectedTreatment.duration)
            : null;
          return end !== null
            ? `${formatTime(start)} - ${formatTime(end)}`
            : start !== null
              ? formatTime(start)
              : "N/A";
        } else {
          return "N/A";
        }
      })()}
    </div>
    <div style={{ marginBottom: "10px" }}>
      <span style={{ fontWeight: "bold" }}>Dentist:</span> {selectedTreatment.dentist || "N/A"}
    </div>
  </div>
</div>
<hr style={{ border: "none", borderBottom: "1px solid #eee", margin: "0 0 32px 0" }} />

{/* Invoice */}
<div style={{ marginBottom: "32px" }}>
  <span style={{ fontWeight: "bold", fontSize: "19px", color: "#333", display: "block", marginBottom: "15px" }}>Invoice</span>
  <div>
    <div style={{ marginBottom: "10px" }}>
      <span style={{ fontWeight: "bold" }}>Bill:</span> {selectedTreatment.bill ? `₱${selectedTreatment.bill}` : "N/A"}
    </div>
    <div style={{ marginBottom: "10px" }}>
      <span style={{ fontWeight: "bold" }}>Payment Method:</span> {selectedTreatment.paymentMethod || "N/A"}
    </div>
  </div>
</div>
<hr style={{ border: "none", borderBottom: "1px solid #eee", margin: "0 0 32px 0" }} />
{/* Images (always visible for now) */}
<div style={{ marginBottom: "32px" }}>
  <span style={{ fontWeight: "bold", fontSize: "19px", color: "#333", display: "block", marginBottom: "15px" }}>Images</span>
  <div>
    <button
      style={{
        background: "#007BFF",
        color: "white",
        border: "none",
        padding: "8px 18px",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "15px",
        fontWeight: "bold"
      }}
      onClick={() => alert("View Image temporary rani")}
    >
      View Image
    </button>
  </div>
</div>
{selectedTreatment.insuranceDetails && (
  <>
    <hr style={{ border: "none", borderBottom: "1px solid #eee", margin: "0 0 32px 0" }} />
    {/* View Insurance */}
    <div style={{ marginBottom: "16px" }}>
      <span style={{ fontWeight: "bold", fontSize: "19px", color: "#333", display: "block", marginBottom: "15px" }}>Insurance</span>
      <div>
        <button
          onClick={() => handleViewInsuranceDetails(selectedTreatment)}
          style={{
            background: "#007BFF",
            color: "white",
            border: "none",
            padding: "8px 18px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: "bold"
          }}
        >
          View Insurance
        </button>
      </div>
    </div>
  </>
)}
              </>
            ) : (
              <div style={{ color: "#888", textAlign: "center", marginTop: "40px" }}>
                Select a treatment to view details.
              </div>
            )}
          </div>
        </div>
        </div>

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