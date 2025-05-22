import React, { useState, useEffect } from "react";
import { db } from "../../backend/firebaseConfig";
import { ref, onValue } from "firebase/database";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged} from "firebase/auth";

const ReportRevenue = () => {
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [pendingThirtyDayCount, setPendingThirtyDayCount] = useState(0);
  const [userDetails, setUserDetails] = useState(null);

  const navigate = useNavigate();
  const auth = getAuth();

  // Logout handler
  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate("/", { replace: true });
    });
  };

  useEffect(() => {
    const now = new Date();
    const formattedToday = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];

    // Fetch today's appointments: appointments/formatteddate/user.uid
    const todayRef = ref(db, `appointments/${formattedToday}`);
    onValue(todayRef, (snapshot) => {
      const data = snapshot.val();
      const list = [];
      if (data) {
        Object.values(data).forEach((appt) => {
          list.push(appt);
        });
      }
      setTodayAppointments(list);
    });

    // Fetch all appointments for the past month (for week/month calculations)
    const appointmentsRef = ref(db, "appointments");
    onValue(appointmentsRef, (snapshot) => {
      const data = snapshot.val();
      const list = [];
      if (data) {
        Object.entries(data).forEach(([dateKey, dateGroup]) => {
          const dateObj = new Date(dateKey);
          const now = new Date();
          const monthAgo = new Date(now);
          monthAgo.setMonth(now.getMonth() - 1);
          if (dateObj >= monthAgo && dateObj <= now) {
            Object.values(dateGroup).forEach((appt) => {
              list.push({ ...appt, _dateKey: dateKey });
            });
          }
        });
      }
      setAllAppointments(list);

      // Pending appointments within the next 30 days
      const pendingList = [];
      if (data) {
        Object.entries(data).forEach(([dateKey, dateGroup]) => {
          const dateObj = new Date(dateKey);
          const now = new Date();
          const thirtyDaysLater = new Date(now);
          thirtyDaysLater.setDate(now.getDate() + 30);
          if (dateObj >= now && dateObj <= thirtyDaysLater) {
            Object.values(dateGroup).forEach((appt) => {
              if (appt.status === "Pending") {
                pendingList.push(appt);
              }
            });
          }
        });
      }
      setPendingThirtyDayCount(pendingList.length);
    });
  }, []);

  useEffect(() => {
    // Completed today
    setTodayCount(
      todayAppointments.filter(
        (appt) => appt.status === "Completed"
      ).length
    );

    // Completed past week and month
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 6); // includes today (7 days)
    const monthAgo = new Date(now);
    monthAgo.setMonth(now.getMonth() - 1);

    setWeekCount(
      allAppointments.filter((appt) => {
        if (appt.status === "Completed" && appt._dateKey) {
          const apptDate = new Date(appt._dateKey);
          return apptDate >= weekAgo && apptDate <= now;
        }
        return false;
      }).length
    );

    setMonthCount(
      allAppointments.filter((appt) => {
        if (appt.status === "Completed" && appt._dateKey) {
          const apptDate = new Date(appt._dateKey);
          return apptDate >= monthAgo && apptDate <= now;
        }
        return false;
      }).length
    );
  }, [todayAppointments, allAppointments]);

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
              <Link to="/dashboard-dentistowner" state={{ userRole: "DentistOwner" }} style={{ textDecoration: "none", color: "#333" }}>
                Dashboard
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/patient-record" state={{ userRole: "DentistOwner" }} style={{ textDecoration: 'none', color: '#333' }}>
                Patient Record
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/inventory" state={{ userRole: "DentistOwner" }} style={{ textDecoration: 'none', color: '#333' }}>
                Inventory
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/revenue" state={{ userRole: "DentistOwner" }} style={{ textDecoration: 'none', color: '#333', fontWeight: "bold" }}>
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
      <div style={{ flex: 1, padding: 32 }}>
        <h2>Completed Appointments Report</h2>
        <div style={{ fontSize: 20, marginBottom: 12 }}>
          <strong>Completed appointments today: </strong>
          {todayCount}
        </div>
        <div style={{ fontSize: 20, marginBottom: 12 }}>
          <strong>Completed appointments in the past week: </strong>
          {weekCount}
        </div>
        <div style={{ fontSize: 20, marginBottom: 12 }}>
          <strong>Completed appointments in the past month: </strong>
          {monthCount}
        </div>
        <div style={{ fontSize: 20 }}>
          <strong>Pending appointments in the next 30 days: </strong>
          {pendingThirtyDayCount}
        </div>
      </div>
    </div>
  );
};

export default ReportRevenue;