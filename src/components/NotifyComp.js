import React, { useState, useEffect } from "react";
import { db, auth } from "../backend/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue, remove, update } from "firebase/database";

// Fetch notifications
export const fetchNotifications = (currentUser, callback) => {
  if (currentUser) {
    const notificationsRef = ref(db, `notifications/${currentUser.uid}`);
    onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      const fetchedNotifications = data
        ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
        : [];
      callback(fetchedNotifications);
    });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (currentUser, notificationId) => {
  if (currentUser) {
    //const encodedEmail = encodeEmail(currentUser.email);
    const notificationRef = ref(db, `notifications/${currentUser.uid}/${notificationId}`);
    try {
      await update(notificationRef, { read: true });
      console.log(`Notification ${notificationId} marked as read.`);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }
};

// Delete notification
export const deleteNotification = async (currentUser, notificationId, callback) => {
  if (currentUser) {
    //const encodedEmail = encodeEmail(currentUser.email);
    const notificationRef = ref(db, `notifications/${currentUser.uid}/${notificationId}`);
    try {
      await remove(notificationRef);
      callback((prev) => prev.filter((notif) => notif.id !== notificationId));
      console.log(`Notification ${notificationId} deleted successfully.`);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }
};

// NotifyComp Component
const NotifyComp = ({ currentUser }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications(currentUser, setNotifications);
  }, [currentUser]);

  return (
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
                onClick={() =>
                  deleteNotification(currentUser, notification.id, setNotifications)
                }
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
  );
};

export default NotifyComp;