import React, { useState, useEffect, use } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { db } from "../../backend/firebaseConfig";
import { ref, onValue } from "firebase/database";
import {
  markNotificationAsRead,
  deleteNotification,
  //encodeEmail,
} from "../../components/NotifyComp";

const DashboardPatient = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [treatmentHistory, setTreatmentHistory] = useState([]);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [latestAppointments, setLatestAppointments] = useState([]);
  const [userDetails, setUserDetails] = useState(null);



  // Fetch notifications and treatment history
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        //const encodedEmail = encodeEmail(user.email);

        // Fetch notifications
        const notificationsRef = ref(db, `notifications/${user.uid}`);
        onValue(notificationsRef, (snapshot) => {
          const data = snapshot.val();
          const fetchedNotifications = data
            ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
            : [];
          setNotifications(fetchedNotifications);
          setLoading(false);
        });

        // Fetch treatment history and next appointment
        fetchCompletedAppointments(user.uid);
        fetchNextAppointment(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch user details for sidebar profile
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      // Fetch user details from your database
      const usersRef = ref(db, "users/Patient");
      onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
          const users = snapshot.val();
          const userData = Object.values(users).find((u) => u.uid === user.uid);
          if (userData) setUserDetails(userData);
        }
      });
    }
  });
  return () => unsubscribe();
}, []);

  // Function to fetch completed appointments (treatment history)
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

        // Sort by date and limit to the latest 3
        const sortedAppointments = completedAppointments.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setTreatmentHistory(sortedAppointments.slice(0, 3));
      }
    });
  };

  // Function to fetch the next appointment
  const fetchNextAppointment = (uid) => {
    const appointmentsRef = ref(db, "appointments");

    onValue(appointmentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allAppointments = snapshot.val();
        let upcomingAppointments = [];

        // Iterate through all appointments and filter upcoming ones
        Object.entries(allAppointments).forEach(([date, dateAppointments]) => {
          Object.entries(dateAppointments).forEach(([id, appointment]) => {
            if (
              appointment.uid === uid &&
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

   // Fetch latest appointments
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchLatestAppointments(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchLatestAppointments = (uid) => {
    const appointmentsRef = ref(db, "appointments");

    onValue(appointmentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allAppointments = snapshot.val();
        let upcomingAppointments = [];

        // Filter and collect appointments for the user
        Object.entries(allAppointments).forEach(([date, dateAppointments]) => {
          Object.entries(dateAppointments).forEach(([id, appointment]) => {
            if (
              appointment.uid === uid &&
              (appointment.status === "Pending" || appointment.status === "Approved")
            ) {
              upcomingAppointments.push({ id, ...appointment });
            }
          });
        });

        // Sort by date and limit to the top 3
        const sortedAppointments = upcomingAppointments
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 3);

        setLatestAppointments(sortedAppointments);
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
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li style={{ marginBottom: "20px" }}>
            <Link
              to="/dashboard-patient"
              style={{
                textDecoration: "none",
                color: "#333",
                fontWeight: "bold",
              }}
            >
              Dashboard
            </Link>
          </li>
          <li style={{ marginBottom: "20px" }}>
            <Link to="/treatment-history" style={{ textDecoration: "none", color: "#333" }}>
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
    <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {/* Dashboard Title */}
        <h1 style={{ margin: 0, fontSize: "24px", color: "#333" }}>Dashboard</h1>

        {/* Right Side Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* Notification Icon */}
          <div style={{ position: "relative" }}>
            <button
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "20px",
              }}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              🔔
            </button>
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-5px",
                  background: "red",
                  color: "white",
                  borderRadius: "50%",
                  padding: "5px 10px",
                  fontSize: "10px",
                }}
              >
                {unreadCount}
              </span>
            )}
            {showNotifications && (
  <div
    style={{
      position: "absolute",
      top: "40px",
      right: "0",
      background: "white",
      border: "1px solid #ddd",
      borderRadius: "5px",
      boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
      width: "300px",
      zIndex: 1000,
      padding: 0, // Remove extra padding here
    }}
  >
    <h4 style={{ padding: "10px", borderBottom: "1px solid #ddd", margin: 0 }}>Notifications</h4>
    <ul style={{ listStyle: "none", padding: "0 10px", margin: 0, maxHeight: "300px", overflowY: "auto" }}>
      {notifications.length === 0 ? (
        <li style={{ padding: "10px", textAlign: "center", color: "#888" }}>No notifications</li>
      ) : (
        notifications.map((notification) => (
          <li
            key={notification.id}
            style={{
              padding: "10px 0",
              borderBottom: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
            }}
            onClick={() => handleMarkAsRead(notification.id)}
          >
            <span>{notification.message}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNotification(auth.currentUser, notification.id);
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "red",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              ✖
            </button>
          </li>
        ))
      )}
    </ul>
    <div style={{ textAlign: "center", padding: "10px", borderTop: "1px solid #ddd" }}>
      <Link to="/notifications" style={{ textDecoration: "none", color: "#007BFF" }}>
        View Notifications
      </Link>
    </div>
  </div>
)}
          </div>

          {/* Schedule Appointment Button */}
          <Link to="/patient-appointment-booking">
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
              Schedule Appointment
            </button>
          </Link>
        </div>
      </div>

      {/* Top Widgets */}
      <div style={{ display: "flex", gap: "20px" }}>
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
          <h3>Next Appointment</h3>
          <p>{nextAppointment ? nextAppointment.date : "No upcoming appointments"}</p>
        </div>
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
          <h3>Treatment Duration</h3>
          <p>
            {nextAppointment && nextAppointment.duration
              ? `${nextAppointment.duration} minutes`
              : "No duration available"}
          </p>
        </div>
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
          <h3>Treatment Status</h3>
          <p>{nextAppointment ? nextAppointment.status : "No status available"}</p>
        </div>
      </div>

      {/* Widgets Row */}
      <div style={{ display: "flex", gap: "20px", flex: 1 }}>
        {/* Latest Appointments Widget */}
        <div
          style={{
            flex: 1,
            background: "#f9f9f9",
            border: "1px solid #ddd",
            borderRadius: "5px",
            padding: "20px",
          }}
        >
          <h2>Upcoming Appointments</h2>
            {latestAppointments.length === 0 ? (
              <p>No recent appointments available.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0 }}>
  {latestAppointments.map((appointment) => {
    const startMinutes = parseTimeToMinutes(appointment.time);
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
        <p><strong>{appointment.services.join(", ")}</strong></p>
        <p>{appointment.dentist}</p>
        <p>{appointment.date}</p>
        <p>{startMinutes !== null ? formatTime(startMinutes) : "N/A"}</p>
      </li>
    );
  })}
</ul>
          )}
        </div>

        {/* Treatment History Widget */}
        <div
          style={{
            flex: 1,
            background: "#f9f9f9",
            border: "1px solid #ddd",
            borderRadius: "5px",
            padding: "20px",
          }}
        >
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
                    <p><strong>{appointment.services.join(", ")}</strong></p>
                    <p>{appointment.dentist}</p>
                    <p>
                      {" "}
                      {startMinutes !== null ? formatTime(startMinutes) : "N/A"} -{" "}
                      {endMinutes !== null ? formatTime(endMinutes) : "N/A"}
                    </p>
                    <p>{appointment.status}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  </div>
);
};

export default DashboardPatient;