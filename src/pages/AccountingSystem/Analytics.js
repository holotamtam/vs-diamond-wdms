import React, { useState, useEffect } from "react";
import { db } from "../../backend/firebaseConfig";
import { ref, onValue, get } from "firebase/database";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import useUserRole from "../../hooks/useUserRole";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { PieChart, Pie, Cell, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";


// Utility: format currency
const formatCurrency = (amount) =>
  "₱" + (amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 0 });

const WEEKDAYS = ["Sunday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PIE_COLORS = ["#C7A76C", "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#a4de6c"];

const Analytics = () => {
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [pendingThirtyDayCount, setPendingThirtyDayCount] = useState(0);
  const [userDetails, setUserDetails] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [serviceTally, setServiceTally] = useState({});
  const [selectedMonth, setSelectedMonth] = useState("");
  const [availableMonths, setAvailableMonths] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]); // For chart
  const [customDate, setCustomDate] = useState(null);

  // New states for new widgets
  const [patientRevenueDetails, setPatientRevenueDetails] = useState({});
  const [newPatients, setNewPatients] = useState(0);
  const [returningPatients, setReturningPatients] = useState(0);
  const [pieData, setPieData] = useState([
    { name: "Tuesday", value: 0 },
    { name: "Wednesday", value: 0 },
    { name: "Thursday", value: 0 },
    { name: "Friday", value: 0 },
    { name: "Saturday", value: 0 },
  ]);

  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();

  const userRoleFromHook = useUserRole();
  const userRole = location.state?.userRole || userRoleFromHook || "DentistOwner";

  const PERIOD_OPTIONS = [
    { key: "today", label: "Today" },
    { key: "week", label: "1 Week" },
    { key: "month", label: "1 Month" },
    { key: "6months", label: "6 Months" },
    { key: "year", label: "1 Year" },
    { key: "all", label: "All Time" },
    { key: "custom", label: "Custom Date" },
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
          if (appt.status === "Completed") {
            // Use bill/totalBill if present, fallback to totalFee
            if (appt.totalBill !== undefined) dailyRevenue += Number(appt.totalBill) || 0;
            else if (appt.bill !== undefined) dailyRevenue += Number(appt.bill) || 0;
            else if (appt.totalFee) dailyRevenue += Number(appt.totalFee) || 0;
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

    // Revenue trend sorted by date (include all days, even if revenue is 0)
    setRevenueTrend(
      trend.sort((a, b) => new Date(a.date) - new Date(b.date))
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

  // Helper: Get last 4 Saturdays for the selected month
const getMonthSaturdays = (trend, selectedMonth) => {
  // selectedMonth format: "YYYY-MM"
  const saturdays = trend.filter(item => {
    const dateObj = new Date(item.date);
    const monthStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
    return dateObj.getDay() === 6 && monthStr === selectedMonth;
  });
  // Get last 4 (latest first)
  return saturdays.slice(-4).map(item => ({
    ...item,
    label: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }));
};

const getSaturdaysInRange = (trend, startDate, endDate) => {
  return trend
    .filter(item => {
      const dateObj = new Date(item.date);
      return dateObj.getDay() === 6 && dateObj >= startDate && dateObj <= endDate;
    })
    .map(item => ({
      ...item,
      label: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: item.revenue
    }));
};

  // Helper: Get last 4 Saturdays from revenueTrend
const getLastFourSaturdays = (trend) => {
  const saturdays = [];
  for (let i = trend.length - 1; i >= 0 && saturdays.length < 4; i--) {
    const date = new Date(trend[i].date);
    if (date.getDay() === 6) { // Saturday
      saturdays.unshift(trend[i]);
    }
  }
  // If not enough, fill with most recent days
  if (saturdays.length < 4) {
    const needed = 4 - saturdays.length;
    const extras = trend.slice(-needed);
    saturdays.unshift(...extras);
  }
  return saturdays;
};

const saturdaysTrend = getLastFourSaturdays(revenueTrend).map(item => ({
  ...item,
  label: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}));

// Helper: Get last 7 days (Tue-Sun) for "week"
const getWeekTrend = (trend) => {
  const now = new Date();
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    weekDays.push(d.toISOString().split("T")[0]);
  }
  // Map trend data to these dates
  return weekDays.map(dateStr => {
    const found = trend.find(t => t.date === dateStr);
    return {
      date: dateStr,
      label: new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      revenue: found ? found.revenue : 0
    };
  });
};

// Prepare chart data based on selectedPeriod
let chartData = [];
if (selectedPeriod === "week") {
  chartData = getWeekTrend(revenueTrend);
} else if (selectedPeriod === "month" && selectedMonth) {
  // Show all Saturdays in the selected month
  const [year, month] = selectedMonth.split("-");
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // last day of month
  chartData = getSaturdaysInRange(revenueTrend, startDate, endDate);
} else if (selectedPeriod === "6months") {
  // Show all Saturdays in the last 6 months
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(now.getMonth() - 6);
  chartData = getSaturdaysInRange(revenueTrend, sixMonthsAgo, now);
} else {
  chartData = getLastFourSaturdays(revenueTrend).map(item => ({
    ...item,
    label: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    revenue: item.revenue
  }));
}


  // Centralized filtered appointments for all widgets
  const getFilteredAppointments = () => {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);
  const monthAgo = new Date(now);
  monthAgo.setMonth(now.getMonth() - 1);
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(now.getMonth() - 6);
  const yearAgo = new Date(now);
  yearAgo.setFullYear(now.getFullYear() - 1);

  if (selectedPeriod === "today") {
    return todayAppointments.filter((appt) => appt.status === "Completed");
  } else if (selectedPeriod === "week") {
    return allAppointments.filter((appt) => {
      if (appt.status === "Completed" && appt._dateKey) {
        const apptDate = new Date(appt._dateKey);
        return apptDate >= weekAgo && apptDate <= now;
      }
      return false;
    });
  } else if (selectedPeriod === "month") {
    return allAppointments.filter((appt) => {
      if (appt.status === "Completed" && appt._dateKey) {
        const apptDate = new Date(appt._dateKey);
        return apptDate >= monthAgo && apptDate <= now;
      }
      return false;
    });
  } else if (selectedPeriod === "6months") {
    return allAppointments.filter((appt) => {
      if (appt.status === "Completed" && appt._dateKey) {
        const apptDate = new Date(appt._dateKey);
        return apptDate >= sixMonthsAgo && apptDate <= now;
      }
      return false;
    });
  } else if (selectedPeriod === "year") {
    return allAppointments.filter((appt) => {
      if (appt.status === "Completed" && appt._dateKey) {
        const apptDate = new Date(appt._dateKey);
        return apptDate >= yearAgo && apptDate <= now;
      }
      return false;
    });
  } else if (selectedPeriod === "all") {
    return allAppointments.filter((appt) => appt.status === "Completed");
  } else if (selectedPeriod === "custom" && customDate) {
    const formattedDate = customDate.toISOString().split("T")[0];
    return allAppointments.filter((appt) => appt._dateKey === formattedDate && appt.status === "Completed");
  }
  return [];
};

  const filteredAppointments = getFilteredAppointments();

// --- Revenue Calculation: Use bill/totalBill if present, fallback to totalFee ---
const getAppointmentRevenue = (appt) => {
  if (appt.totalBill !== undefined) return Number(appt.totalBill) || 0;
  if (appt.bill !== undefined) return Number(appt.bill) || 0;
  return Number(appt.totalFee) || 0;
};

// Total Revenue for selected period
const totalRevenue = filteredAppointments.reduce((sum, appt) => sum + getAppointmentRevenue(appt), 0);


  // Patient Revenue Details
  const patientRevenue = {};
filteredAppointments.forEach((appt) => {
  if (appt.patientId) {
    if (!patientRevenue[appt.patientId]) {
      patientRevenue[appt.patientId] = { total: 0, count: 0, name: appt.patientName || "Unknown" };
    }
    patientRevenue[appt.patientId].total += getAppointmentRevenue(appt);
    patientRevenue[appt.patientId].count += 1;
  }
});

  // New vs Returning Patients
  let newCount = 0, returningCount = 0;
  filteredAppointments.forEach((appt) => {
    if (appt.isNewPatient === true || appt.isNewPatient === "true") newCount++;
    else returningCount++;
  });

  // Pie Data: Daily Bookings
  const pie = { Sunday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 };
filteredAppointments.forEach((appt) => {
  if (appt._dateKey) {
    const dateObj = new Date(appt._dateKey);
    const day = dateObj.toLocaleDateString("en-US", { weekday: "long" });
    if (pie[day] !== undefined) pie[day]++;
  }
});
const pieDataPeriod = WEEKDAYS.map(day => ({ name: day, value: pie[day] }));

  // Service tally for the selected period
  useEffect(() => {
    const tally = {};
    filteredAppointments.forEach((appt) => {
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
    setPatientRevenueDetails(patientRevenue);
    setNewPatients(newCount);
    setReturningPatients(returningCount);
    setPieData(pieDataPeriod);
  // eslint-disable-next-line
  }, [selectedPeriod, todayAppointments, allAppointments, customDate]);

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
          position: 'fixed',
          top: 0,
          left: 0,
          height: '96vh',
          zIndex: 100,
        }}
      >
        <div>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: "10px" }}>
              <Link to={userRole === "ClinicStaff" ? "/dashboard-clinicstaff" : userRole === "AssociateDentist" ? "/dashboard-associatedentist" : "/dashboard-dentistowner"} state={{ userRole: userRole }} style={{ textDecoration: "none", color: "#333"}}>
                Dashboard
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/patient-record" state={{ userRole: userRole }} style={{ textDecoration: 'none', color: '#333' }}>
                Patient Record
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/inventory" state={{ userRole: userRole }} style={{ textDecoration: 'none', color: '#333' }}>
                Inventory
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/analytics" state={{ userRole: userRole }} style={{ textDecoration: 'none', color: '#C7A76C', fontWeight: "bold" }}>
                Analytics
              </Link>
            </li>
            {userRole === "DentistOwner" && (
              <li style={{ marginBottom: '10px' }}>
                <Link to="/manage-personnel" state={{ userRole: userRole }} style={{ textDecoration: 'none', color: '#333' }}>
                  Manage Personnel
                </Link>
              </li>
            )}
            <li style={{ marginBottom: "10px" }}>
              <Link to="/settings-personnel" state={{ userRole: userRole }} style={{ textDecoration: "none", color: "#333" }}>
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
      <div style={{ flex: 1, padding: 0, background: "#FAF7F3", marginLeft: 290 }}>
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
          <div style={{ display: "flex", gap: 16, marginBottom: 32, alignItems: "center" }}>
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
            {/* Show calendar if custom is selected */}
            {selectedPeriod === "custom" && (
              <div style={{ marginLeft: 16 }}>
                <DatePicker
                  selected={customDate}
                  onChange={date => setCustomDate(date)}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select date"
                  maxDate={new Date()}
                  isClearable
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>
            )}
          </div>

          {/* --- 3 Column Widgets Layout --- */}
          <div style={{ display: "flex", gap: 24, marginBottom: 32 }}>
            {/* Left Column: 2 widgets */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
  <div style={{
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 2px 8px #00000010",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  }}>
    <div style={{ fontSize: 18, color: "#888" }}>Total Appointments</div>
    <div style={{ fontSize: 32, fontWeight: 700, color: "#23201A" }}>
      {filteredAppointments.length}
    </div>
  </div>
  <div style={{
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
      {formatCurrency(totalRevenue)}
    </div>
  </div>
</div>
            {/* Middle Column: Patient Revenue Details, New/Returning Patients */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{
                background: "#fff",
                borderRadius: 16,
                padding: 24,
                boxShadow: "0 2px 8px #00000010",
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}>
                <div style={{ fontSize: 18, color: "#888", marginBottom: 8 }}>Patient Revenue Details</div>
                <div style={{ maxHeight: 120, overflowY: "auto", width: "100%" }}>
                  <table style={{ width: "100%", fontSize: 15 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", color: "#888" }}>Patient</th>
                        <th style={{ textAlign: "right", color: "#888" }}>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(patientRevenue)
                        .sort((a, b) => b[1].total - a[1].total)
                        .slice(0, 5)
                        .map(([id, info]) => (
                          <tr key={id}>
                            <td style={{ textAlign: "left" }}>{info.name}</td>
                            <td style={{ textAlign: "right" }}>{formatCurrency(info.total)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div style={{
                background: "#fff",
                borderRadius: 16,
                padding: 24,
                boxShadow: "0 2px 8px #00000010",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div>
                  <div style={{ fontSize: 18, color: "#888" }}>New Patients</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#23201A" }}>{newCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: 18, color: "#888" }}>Returning Patients</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#23201A" }}>{returningCount}</div>
                </div>
              </div>
            </div>
            {/* Right Column: Daily Patient Bookings Pie */}
            <div style={{
  background: "#fff",
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 2px 8px #00000010",
  display: "flex",
  flexDirection: "column",
  alignItems: "center"
}}>
  <div style={{ fontSize: 18, color: "#888", marginBottom: 8 }}>Daily Patient Bookings (Tue-Sat)</div>
  {/* Use flex row for chart and legend, prevent overlap */}
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
    <PieChart width={220} height={220}>
      <Pie
        data={pieDataPeriod}
        cx="50%"
        cy="50%"
        innerRadius={50}
        outerRadius={90}
        fill="#8884d8"
        paddingAngle={2}
        dataKey="value"
        label={({ name, percent }) =>
          `${name} (${(percent * 100).toFixed(0)}%)`
        }
      >
        {pieDataPeriod.map((entry, idx) => (
          <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
    {/* Custom legend, right side, well spaced */}
    <div style={{
      marginLeft: 32,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      minWidth: 120
    }}>
      {pieDataPeriod.map((item, idx) => (
        <div key={item.name} style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <span style={{
            display: "inline-block",
            width: 16,
            height: 16,
            background: PIE_COLORS[idx % PIE_COLORS.length],
            marginRight: 8,
            borderRadius: 4,
            border: "1px solid #ddd"
          }} />
          <span style={{ fontSize: 15, color: "#23201A" }}>{item.name}</span>
        </div>
      ))}
    </div>
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
  <h3 style={{ marginBottom: 16 }}>
    Revenue Trend (
    {selectedPeriod === "week"
      ? "Tue-Sun"
      : "Last 4 Saturdays"}
    )
  </h3>
  <ResponsiveContainer width="100%" height={220}>
    <LineChart
      data={chartData}
      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
    >
      <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
      <XAxis dataKey="label" tick={{ fontSize: 13 }} />
      <YAxis
        tickFormatter={value => formatCurrency(value)}
        tick={{ fontSize: 13 }}
        width={80}
      />
      <Tooltip formatter={value => formatCurrency(value)} />
      <Line
        type="monotone"
        dataKey="revenue"
        stroke="#C7A76C"
        strokeWidth={3}
        dot={{ r: 7, stroke: "#C7A76C", strokeWidth: 2, fill: "#fff" }}
        activeDot={{ r: 9, fill: "#C7A76C" }}
      />
    </LineChart>
  </ResponsiveContainer>
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