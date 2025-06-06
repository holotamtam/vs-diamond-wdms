import React, { useState, useEffect } from "react";
import { db } from "../../backend/firebaseConfig";
import { ref, onValue } from "firebase/database";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";

const ReportRevenue = () => {
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [pendingThirtyDayCount, setPendingThirtyDayCount] = useState(0);
  const [userDetails, setUserDetails] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [serviceTally, setServiceTally] = useState({});
  const [selectedMonth, setSelectedMonth] = useState("");
  const [availableMonths, setAvailableMonths] = useState([]);

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

  // Fetch today's appointments
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
    const monthsSet = new Set();
    if (data) {
      Object.entries(data).forEach(([dateKey, dateGroup]) => {
        // For available months dropdown
        const [year, month] = dateKey.split("-");
        if (year && month) {
          monthsSet.add(`${year}-${month}`);
        }

        // For week/month calculations
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

    // Set available months for dropdown (sorted, latest first)
    setAvailableMonths(Array.from(monthsSet).sort((a, b) => b.localeCompare(a)));

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

  // Service tally logic
   useEffect(() => {
    let filtered = [];
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 6);
    const monthAgo = new Date(now);
    monthAgo.setMonth(now.getMonth() - 1);

    if (selectedPeriod === "today") {
      filtered = todayAppointments.filter((appt) => appt.status === "Completed");
    } else if (selectedPeriod === "week") {
      filtered = allAppointments.filter((appt) => {
        if (appt.status === "Completed" && appt._dateKey) {
          const apptDate = new Date(appt._dateKey);
          return apptDate >= weekAgo && apptDate <= now;
        }
        return false;
      });
    } else if (selectedPeriod === "month" && !selectedMonth) {
      filtered = allAppointments.filter((appt) => {
        if (appt.status === "Completed" && appt._dateKey) {
          const apptDate = new Date(appt._dateKey);
          return apptDate >= monthAgo && apptDate <= now;
        }
        return false;
      });
    } else if (selectedPeriod === "month" && selectedMonth) {
      // Filter by selectedMonth (format: YYYY-MM)
      filtered = allAppointments.filter((appt) => {
        if (appt.status === "Completed" && appt._dateKey) {
          return appt._dateKey.startsWith(selectedMonth);
        }
        return false;
      });
    }

    // Tally services
    const tally = {};
    filtered.forEach((appt) => {
      if (Array.isArray(appt.services)) {
        appt.services.forEach((service) => {
          tally[service] = (tally[service] || 0) + 1;
        });
      } else if (typeof appt.services === "string") {
        appt.services.split(",").map(s => s.trim()).forEach((service) => {
          if (service) tally[service] = (tally[service] || 0) + 1;
        });
      }
    });
    setServiceTally(tally);
  }, [selectedPeriod, selectedMonth, todayAppointments, allAppointments]);

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
        {/* Dropdown for period selection */}
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
          <label htmlFor="period-select" style={{ fontWeight: "bold", marginRight: 10 }}>Show for:</label>
          <select
            id="period-select"
            value={selectedPeriod}
            onChange={e => {
              setSelectedPeriod(e.target.value);
              if (e.target.value !== "month") setSelectedMonth("");
            }}
            style={{ padding: "5px 10px", fontSize: 16 }}
          >
            <option value="today">Today</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
          {/* Month dropdown only if "Month" is selected */}
          {selectedPeriod === "month" && (
            <>
              <label htmlFor="month-select" style={{ fontWeight: "bold" }}>Select Month:</label>
              <select
                id="month-select"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                style={{ padding: "5px 10px", fontSize: 16 }}
              >
                <option value="">Last 30 Days</option>
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {new Date(month + "-01").toLocaleString("default", { month: "long", year: "numeric" })}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
        {/* Counts */}
        <div style={{ fontSize: 20, marginBottom: 12 }}>
          <strong>Completed appointments: </strong>
          {selectedPeriod === "today"
            ? todayCount
            : selectedPeriod === "week"
            ? weekCount
            : selectedPeriod === "month" && selectedMonth
            ? allAppointments.filter(appt => appt.status === "Completed" && appt._dateKey && appt._dateKey.startsWith(selectedMonth)).length
            : monthCount}
        </div>
        <div style={{ fontSize: 20, marginBottom: 12 }}>
          <strong>Pending appointments in the next 30 days: </strong>
          {pendingThirtyDayCount}
        </div>
        {/* Service Tally Table */}
        <div style={{ marginTop: 30 }}>
          <h3>
            Service Tally (
            {selectedPeriod === "today"
              ? "Today"
              : selectedPeriod === "week"
              ? "Last 7 Days"
              : selectedPeriod === "month" && selectedMonth
              ? new Date(selectedMonth + "-01").toLocaleString("default", { month: "long", year: "numeric" })
              : "Last 30 Days"}
            )
          </h3>
          {Object.keys(serviceTally).length === 0 ? (
            <p>No completed appointments for this period.</p>
          ) : (
            <table style={{ borderCollapse: "collapse", width: "100%", marginTop: 10 }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid #ccc", padding: "8px" }}>Service</th>
                  <th style={{ border: "1px solid #ccc", padding: "8px" }}>Count</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(serviceTally).map(([service, count]) => (
                  <tr key={service}>
                    <td style={{ border: "1px solid #ccc", padding: "8px" }}>{service}</td>
                    <td style={{ border: "1px solid #ccc", padding: "8px" }}>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportRevenue;