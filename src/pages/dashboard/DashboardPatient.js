import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { db } from "../../backend/firebaseConfig";
import { ref, onValue } from "firebase/database";
import {
  markNotificationAsRead,
  deleteNotification,
  encodeEmail, // Import reusable encodeEmail function
} from "../../components/NotifyComp";

const DashboardPatient = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);


  // Get notifs
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const encodedEmail = encodeEmail(user.email);
        const notificationsRef = ref(db, `notifications/${encodedEmail}`);
        onValue(notificationsRef, (snapshot) => {
          const data = snapshot.val();
          const fetchedNotifications = data
            ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
            : [];
          setNotifications(fetchedNotifications);
          setLoading(false); // Set loading to false after fetching
        });
      } else {
        setLoading(false); // Stop loading if no user is authenticated
      }
    });

    return () => unsubscribe();
  }, []);
 
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
      <div style={{ flex: 1, padding: "20px", position: "relative" }}>
        {/* Notifications Icon */}
        <div style={{ position: "absolute", top: "20px", right: "20px" }}>
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
      </div>
    </div>
  );
};

export default DashboardPatient;