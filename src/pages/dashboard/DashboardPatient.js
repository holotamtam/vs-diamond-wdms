import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { db } from "../../backend/firebaseConfig";
import { ref, onValue } from "firebase/database";
import {
  markNotificationAsRead,
  deleteNotification,
  encodeEmail,
} from "../../components/NotifyComp";

const DashboardPatient = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [treatmentHistory, setTreatmentHistory] = useState([]);
  const [nextAppointment, setNextAppointment] = useState(null);

  // Fetch notifications and treatment history
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const encodedEmail = encodeEmail(user.email);

        // Fetch notifications
        const notificationsRef = ref(db, `notifications/${encodedEmail}`);
        onValue(notificationsRef, (snapshot) => {
          const data = snapshot.val();
          const fetchedNotifications = data
            ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
            : [];
          setNotifications(fetchedNotifications);
          setLoading(false);
        });

        // Fetch treatment history and next appointment
        fetchCompletedAppointments(user.email);
        fetchNextAppointment(user.email);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Function to fetch completed appointments (treatment history)
  const fetchCompletedAppointments = (email) => {
    const appointmentsRef = ref(db, "appointments");

    onValue(appointmentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allAppointments = snapshot.val();
        let completedAppointments = [];

        // Iterate through all appointments and filter completed ones
        Object.entries(allAppointments).forEach(([date, dateAppointments]) => {
          Object.entries(dateAppointments).forEach(([id, appointment]) => {
            if (appointment.userId === email && appointment.status === "Completed") {
              completedAppointments.push({ id, ...appointment });
            }
          });
        });

        // Sort by date and limit to the latest 3
        const sortedAppointments = completedAppointments.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setTreatmentHistory(sortedAppointments.slice(0, 3));
      }
    });
  };

  // Function to fetch the next appointment
  const fetchNextAppointment = (email) => {
    const appointmentsRef = ref(db, "appointments");

    onValue(appointmentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allAppointments = snapshot.val();
        let upcomingAppointments = [];

        // Iterate through all appointments and filter upcoming ones
        Object.entries(allAppointments).forEach(([date, dateAppointments]) => {
          Object.entries(dateAppointments).forEach(([id, appointment]) => {
            if (
              appointment.userId === email &&
              (appointment.status === "Pending" || appointment.status === "Approved")
            ) {
              upcomingAppointments.push({ id, ...appointment });
            }
          });
        });

        // Sort by date and get the next appointment
        const sortedAppointments = upcomingAppointments.sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );
        setNextAppointment(sortedAppointments[0] || null);
      }
    });
  };

  // Handle logout
  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate("/", { replace: true });
    });
  };

  // Calculate unread notifications count
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  // Mark notification as read
  const handleMarkAsRead = (notificationId) => {
    markNotificationAsRead(auth.currentUser, notificationId);
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      )
    );
  };

  // Function to format time in 12-hour format
  const formatTime = (minutes) => {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    const formattedMinute = minute < 10 ? `0${minute}` : minute;
    return `${formattedHour}:${formattedMinute} ${ampm}`;
  };
  
  // Function to parse time string (HH:MM) to total minutes
  const parseTimeToMinutes = (time) => {
    if (!time || typeof time !== "string" || !time.includes(":")) return null;
    const [hourStr, minuteStr] = time.split(":");
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (isNaN(hour) || isNaN(minute)) return null;
    return hour * 60 + minute;
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
          <h2>Dashboard</h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li style={{ marginBottom: "10px" }}>
              <Link to="/PatientRecord" style={{ textDecoration: "none", color: "#333" }}>
                Treatment History
              </Link>
            </li>
            <li style={{ marginBottom: "10px" }}>
              <Link to="/Services" style={{ textDecoration: "none", color: "#333" }}>
                View Our Services
              </Link>
            </li>
            <li style={{ marginBottom: "10px" }}>
              <Link to="/PatientAppointmentStatus" style={{ textDecoration: "none", color: "#333" }}>
                Appointment Status
              </Link>
            </li>
            <li style={{ marginBottom: "10px" }}>
              <Link to="/Notifications" style={{ textDecoration: "none", color: "#333" }}>
                Notifications
              </Link>
            </li>
          </ul>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: "#f44336",
            color: "white",
            border: "none",
            padding: "10px",
            cursor: "pointer",
            borderRadius: "5px",
          }}
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Top Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/PatientAppointmentBooking">
            <button
              style={{
                background: "#007BFF",
                color: "white",
                border: "none",
                padding: "10px 20px",
                cursor: "pointer",
                borderRadius: "5px",
              }}
            >
              Book Appointment
            </button>
          </Link>

          {/* Notifications Icon */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <span
                style={{
                  fontSize: "24px",
                  color: "#333",
                  position: "relative",
                }}
              >
                🔔
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-5px",
                    background: "red",
                    color: "white",
                    borderRadius: "50%",
                    padding: "5px 8px",
                    fontSize: "12px",
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div
                style={{
                  position: "absolute",
                  top: "40px",
                  right: "0",
                  background: "white",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  width: "300px",
                  zIndex: 1000,
                }}
              >
                <h4 style={{ margin: "10px", fontSize: "16px" }}>Notifications</h4>
                <ul style={{ listStyle: "none", padding: "10px", margin: 0 }}>
                  {notifications.map((notification) => (
                    <li
                      key={notification.id}
                      style={{
                        marginBottom: "10px",
                        padding: "10px",
                        borderBottom: "1px solid #ddd",
                        background: notification.read ? "#f9f9f9" : "#e6f7ff",
                        cursor: "pointer",
                      }}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <p style={{ margin: 0 }}>{notification.message}</p>
                      <small style={{ color: "#666" }}>
                        {new Date(notification.timestamp).toLocaleString()}
                      </small>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering `markAsRead`
                          deleteNotification(auth.currentUser, notification.id, setNotifications);
                        }}
                        style={{
                          background: "red",
                          color: "white",
                          border: "none",
                          padding: "5px 10px",
                          cursor: "pointer",
                          borderRadius: "5px",
                          marginTop: "5px",
                        }}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Top Widgets */}
        <div style={{ display: "flex", gap: "20px" }}>
          {/* Next Appointment Date */}
          <div
            style={{
              flex: 1,
              background: "#f9f9f9",
              border: "1px solid #ddd",
              borderRadius: "5px",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <h3>Next Appointment Date</h3>
            <p>{nextAppointment ? nextAppointment.date : "No upcoming appointments"}</p>
          </div>

          {/* Appointment Duration */}
          <div
            style={{
              flex: 1,
              background: "#f9f9f9",
              border: "1px solid #ddd",
              borderRadius: "5px",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <h3>Appointment Duration</h3>
            <p>{nextAppointment ? `${nextAppointment.duration} minutes` : "No upcoming appointments"}</p>
          </div>

          {/* Appointment Status */}
          <div
            style={{
              flex: 1,
              background: "#f9f9f9",
              border: "1px solid #ddd",
              borderRadius: "5px",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <h3>Appointment Status</h3>
            <p>{nextAppointment ? nextAppointment.status : "No upcoming appointments"}</p>
          </div>
        </div>

        {/* Widgets Row */}
        <div style={{ display: "flex", gap: "20px", flex: 1 }}>
          {/* Treatment History Widget */}
          <div style={{ flex: 1 }}>
          <h2>Treatment History</h2>
{treatmentHistory.length === 0 ? (
  <p>No treatment history available.</p>
) : (
  <ul style={{ listStyle: "none", padding: 0 }}>
    {treatmentHistory.map((appointment) => {
      const startMinutes = parseTimeToMinutes(appointment.time);
      const duration = appointment.duration || 0;
      const endMinutes = startMinutes !== null ? startMinutes + duration : null;

      return (
        <li
          key={appointment.id}
          style={{
            marginBottom: "10px",
            padding: "10px",
            border: "1px solid #ddd",
            borderRadius: "5px",
            background: "#f9f9f9",
          }}
        >
          <p><strong>Date:</strong> {appointment.date}</p>
          <p>
            <strong>Time:</strong>{" "}
            {startMinutes !== null ? formatTime(startMinutes) : "N/A"} -{" "}
            {endMinutes !== null ? formatTime(endMinutes) : "N/A"}
          </p>
          <p><strong>Services:</strong> {appointment.services.join(", ")}</p>
        </li>
      );
    })}
  </ul>
)}
          </div>

          {/* Placeholder for Another Widget */}
          <div
            style={{
              flex: 1,
              background: "#f9f9f9",
              border: "1px solid #ddd",
              borderRadius: "5px",
              padding: "20px",
            }}
          >
            <h2>Another Widget</h2>
            <p>This is a placeholder for another widget.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPatient;