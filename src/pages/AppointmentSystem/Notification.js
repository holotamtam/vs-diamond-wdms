import React, { useState, useEffect } from "react";
import { db, auth } from "../../backend/firebaseConfig";
import { ref, onValue, remove } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const encodeEmail = (email) => email.replace(/\./g, ",");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user ? user : null);
    });
    return () => unsubscribe();
  }, []);

  const deleteNotification = async (notificationId) => {
    if (currentUser) {
      const encodedEmail = encodeEmail(currentUser.email); // Encode the email
      const notificationRef = ref(db, `notifications/${encodedEmail}/${notificationId}`); // Use the Firebase key for deletion
      console.log(`Deleting notification at path: notifications/${encodedEmail}/${notificationId}`); // Debugging
  
      try {
        await remove(notificationRef); // Remove the notification from Firebase
        setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId)); // Update local state
        console.log("Notification deleted successfully from Firebase.");
      } catch (error) {
        console.error("Error deleting notification from Firebase:", error);
      }
    }
  };

  useEffect(() => {
    if (currentUser) {
      const encodedEmail = encodeEmail(currentUser.email); // Encode the email
      const notificationsRef = ref(db, `notifications/${encodedEmail}`);
      onValue(notificationsRef, (snapshot) => {
        const data = snapshot.val();
        const fetchedNotifications = data
          ? Object.entries(data).map(([id, value]) => ({ id, ...value })) // Include the Firebase key as `id`
          : [];
        setNotifications(fetchedNotifications);
      });
    }
  }, [currentUser]);



  return (
    <div>
    <button>
            <a href="/DashboardPatient">Go Back to Dashboard</a>
    </button>
     <div>
    <h1>Notifications</h1>
    {notifications.length > 0 ? (
      <ul>
        {notifications.map((notification) => (
          <li
            key={notification.id}
            style={{
              marginBottom: "10px",
              border: "1px solid #ddd",
              padding: "10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p>{notification.message}</p>
              <small>{new Date(notification.timestamp).toLocaleString()}</small>
            </div>
            <button
              onClick={() => deleteNotification(notification.id)}
              style={{
                background: "red",
                color: "white",
                border: "none",
                padding: "5px 10px",
                cursor: "pointer",
                borderRadius: "5px",
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    ) : (
      <p>No notifications found.</p>
    )}
  </div>
  </div>
  );
};

export default Notification;