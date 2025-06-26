import React, { useState, useEffect } from "react";
import { db } from "../../backend/firebaseConfig";
import { ref, onValue, get } from "firebase/database";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";

// Utility: format currency
const formatCurrency = (amount) =>
  "₱" + (amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 0 });

const Analytics = () => {
  // ...existing state...
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
  const [revenueTrend, setRevenueTrend] = useState([]); // For chart

  const navigate = useNavigate();
  const auth = getAuth();

  const PERIOD_OPTIONS = [
  { key: "today", label: "Today" },
  { key: "month", label: "1 Month" },
  { key: "6months", label: "6 Months" },
  { key: "year", label: "1 Year" },
  { key: "all", label: "All Time" },
];

  // Logout handler
  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate("/", { replace: true });
    });
  };

  // Fetch appointments and build revenue trend
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
      const trend = [];
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

          // Revenue trend: sum revenue for each day
          let dailyRevenue = 0;
          Object.values(dateGroup).forEach((appt) => {
            if (appt.status === "Completed" && appt.totalFee) {
              dailyRevenue += Number(appt.totalFee) || 0;
            }
          });
          trend.push({
            date: dateKey,
            revenue: dailyRevenue,
          });
        });
      }
      setAllAppointments(list);

      // Set available months for dropdown (sorted, latest first)
      setAvailableMonths(Array.from(monthsSet).sort((a, b) => b.localeCompare(a)));

      // Revenue trend sorted by date
      setRevenueTrend(
        trend
          .filter((d) => d.revenue > 0)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
      );

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

  // Completed counts
  useEffect(() => {
    setTodayCount(
      todayAppointments.filter((appt) => appt.status === "Completed").length
    );

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

 // Service tally logic and filtering
useEffect(() => {
  let filtered = [];
  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setMonth(now.getMonth() - 1);
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(now.getMonth() - 6);
  const yearAgo = new Date(now);
  yearAgo.setFullYear(now.getFullYear() - 1);

  if (selectedPeriod === "today") {
    filtered = todayAppointments.filter((appt) => appt.status === "Completed");
  } else if (selectedPeriod === "month") {
    filtered = allAppointments.filter((appt) => {
      if (appt.status === "Completed" && appt._dateKey) {
        const apptDate = new Date(appt._dateKey);
        return apptDate >= monthAgo && apptDate <= now;
      }
      return false;
    });
  } else if (selectedPeriod === "6months") {
    filtered = allAppointments.filter((appt) => {
      if (appt.status === "Completed" && appt._dateKey) {
        const apptDate = new Date(appt._dateKey);
        return apptDate >= sixMonthsAgo && apptDate <= now;
      }
      return false;
    });
  } else if (selectedPeriod === "year") {
    filtered = allAppointments.filter((appt) => {
      if (appt.status === "Completed" && appt._dateKey) {
        const apptDate = new Date(appt._dateKey);
        return apptDate >= yearAgo && apptDate <= now;
      }
      return false;
    });
  } else if (selectedPeriod === "all") {
    filtered = allAppointments.filter((appt) => appt.status === "Completed");
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
}, [selectedPeriod, todayAppointments, allAppointments]);

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

  // Calculate total revenue for the selected period
const getTotalRevenue = () => {
  let filtered = [];
  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setMonth(now.getMonth() - 1);
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(now.getMonth() - 6);
  const yearAgo = new Date(now);
  yearAgo.setFullYear(now.getFullYear() - 1);

  if (selectedPeriod === "today") {
    filtered = todayAppointments.filter((appt) => appt.status === "Completed");
  } else if (selectedPeriod === "month") {
    filtered = allAppointments.filter((appt) => {
      if (appt.status === "Completed" && appt._dateKey) {
        const apptDate = new Date(appt._dateKey);
        return apptDate >= monthAgo && apptDate <= now;
      }
      return false;
    });
  } else if (selectedPeriod === "6months") {
    filtered = allAppointments.filter((appt) => {
      if (appt.status === "Completed" && appt._dateKey) {
        const apptDate = new Date(appt._dateKey);
        return apptDate >= sixMonthsAgo && apptDate <= now;
      }
      return false;
    });
  } else if (selectedPeriod === "year") {
    filtered = allAppointments.filter((appt) => {
      if (appt.status === "Completed" && appt._dateKey) {
        const apptDate = new Date(appt._dateKey);
        return apptDate >= yearAgo && apptDate <= now;
      }
      return false;
    });
  } else if (selectedPeriod === "all") {
    filtered = allAppointments.filter((appt) => appt.status === "Completed");
  }
  return filtered.reduce((sum, appt) => sum + (Number(appt.totalFee) || 0), 0);
};

  // --- UI ---
  return (
    <div style={{ display: "flex", height: "100vh", background: "#FAF7F3" }}>
      {/* Sidebar */}
      <div
        style={{
          width: '250px',
          background: '#f4f4f4',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid #ddd',
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
              <Link to="/analytics" state={{ userRole: "DentistOwner" }} style={{ textDecoration: 'none', color: '#C7A76C', fontWeight: "bold" }}>
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
                <span style={{ fontWeight: "bold", fontSize: "15px", textAlign: "left", color: "#333" }}>
                  {userDetails.firstName} {userDetails.middleName} {userDetails.lastName}
                </span>
                <span style={{ fontSize: "13px", color: "#555", textAlign: "left"  }}>
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
    <div style={{ flex: 1, padding: 0, background: "#FAF7F3" }}>
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
    height: "35.333px",
    flex: 1
  }}>
    <span style={{ fontSize: "24px", fontWeight: 700, color: "#23201A" }}>
      Analytics
    </span>
  </div>

  {/* Main Content Container with padding */}
  <div style={{ padding: 40 }}>
    {/* Period Selection */}
    <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
      {PERIOD_OPTIONS.map(opt => (
        <button
          key={opt.key}
          onClick={() => setSelectedPeriod(opt.key)}
          style={{
            padding: "15px 28px",
            borderRadius: 24,
            border: "none",
            fontWeight: 600,
            fontSize: 16,
            background: selectedPeriod === opt.key ? "#C7A76C" : "#fff",
            color: selectedPeriod === opt.key ? "#fff" : "#23201A",
            boxShadow: selectedPeriod === opt.key ? "0 2px 8px #c7a76c33" : "none",
            cursor: "pointer"
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>

        {/* Summary Cards */}
        <div style={{ display: "flex", gap: 24, marginBottom: 32 }}>
          <div style={{
            flex: 1,
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 2px 8px #00000010",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
            <div style={{ fontSize: 18, color: "#888" }}>Completed Appointments</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#23201A" }}>
              {selectedPeriod === "today"
                ? todayCount
                : selectedPeriod === "week"
                ? weekCount
                : selectedPeriod === "month" && selectedMonth
                ? allAppointments.filter(appt => appt.status === "Completed" && appt._dateKey && appt._dateKey.startsWith(selectedMonth)).length
                : monthCount}
            </div>
          </div>
          <div style={{
            flex: 1,
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 2px 8px #00000010",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
            <div style={{ fontSize: 18, color: "#888" }}>Total Revenue</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#23201A" }}>
              {formatCurrency(getTotalRevenue())}
            </div>
          </div>
          <div style={{
            flex: 1,
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 2px 8px #00000010",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
            <div style={{ fontSize: 18, color: "#888" }}>Pending (Next 30 Days)</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#23201A" }}>
              {pendingThirtyDayCount}
            </div>
          </div>
        </div>

        {/* Revenue Trend Chart (simple dots, no chart lib) */}
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 2px 8px #00000010",
          marginBottom: 32
        }}>
          <h3 style={{ marginBottom: 16 }}>Revenue Trend</h3>
          <div style={{ width: "100%", height: 220, position: "relative" }}>
            {/* Simple SVG chart for demonstration */}
            <svg width="100%" height="200" viewBox="0 0 700 200">
              {/* Axes */}
              <line x1="40" y1="10" x2="40" y2="180" stroke="#ccc" />
              <line x1="40" y1="180" x2="680" y2="180" stroke="#ccc" />
              {/* Dots */}
              {revenueTrend.length > 0 && (() => {
                const maxRevenue = Math.max(...revenueTrend.map(d => d.revenue), 1);
                const minDate = new Date(revenueTrend[0].date);
                const maxDate = new Date(revenueTrend[revenueTrend.length - 1].date);
                const dateRange = maxDate - minDate || 1;
                return revenueTrend.map((d, i) => {
                  const x = 40 + ((new Date(d.date) - minDate) / dateRange) * (640);
                  const y = 180 - (d.revenue / maxRevenue) * 160;
                  return (
                    <g key={d.date}>
                      <circle cx={x} cy={y} r={6} fill="#C7A76C" />
                      <text x={x} y={y - 12} fontSize="12" fill="#23201A" textAnchor="middle">
                        {formatCurrency(d.revenue)}
                      </text>
                      <text x={x} y={190} fontSize="12" fill="#888" textAnchor="middle">
                        {new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </text>
                    </g>
                  );
                });
              })()}
            </svg>
          </div>
        </div>

        {/* Service Tally Table */}
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 2px 8px #00000010"
        }}>
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
    </div>
  );
};

export default Analytics;