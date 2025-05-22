// ...existing imports...
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { db } from "../../backend/firebaseConfig";
import { ref, onValue } from "firebase/database";

const DashboardDentistOwner = () => {
  const navigate = useNavigate();
  const auth = getAuth();

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // User profile state
  const [userDetails, setUserDetails] = useState(null);

  // Fetch notifications for the current user (DentistOwner)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const notificationsRef = ref(db, `notifications/${user.uid}`);
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      const fetchedNotifications = data
        ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
        : [];
      setNotifications(fetchedNotifications);
    });
    return () => unsubscribe();
  }, [auth.currentUser]);

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
              // Unsubscribe from other listeners
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

  // Calculate unread notifications count
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  // Function to handle logout
  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate('/', { replace: true });
    });
  };

  // Mark notification as read (optional, implement if needed)
  const handleMarkAsRead = (notificationId) => {
    // Implement mark as read logic if you want
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
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
              <Link to="/dashboard-dentistowner" state={{ userRole: "DentistOwner" }} style={{ textDecoration: "none", color: "#333", fontWeight: "bold" }}>
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
              <Link to="/revenue" state={{ userRole: "DentistOwner" }} style={{ textDecoration: 'none', color: '#333' }}>
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
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              background: '#f44336',
              color: 'white',
              border: 'none',
              padding: '10px',
              cursor: 'pointer',
              borderRadius: '5px',
              width: "100%",
            }}
          >
            Logout
          </button>
        </div>
      </div>
      {/* Main Content */}
      <div style={{ flex: 1, padding: "32px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Top Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
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
                    padding: 0,
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
                          {/* Optionally add a delete button here */}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>
            {/* Manage Appointment Button */}
            <Link to="/manage-appointment" state={{ userRole: "DentistOwner" }}>
              <button
                style={{
                  background: "#007BFF",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  cursor: "pointer",
                  borderRadius: "5px",
                  fontWeight: "bold",
                }}
              >
                Manage Appointment
              </button>
            </Link>
          </div>
        </div>
        {/* ...rest of your dashboard content... */}
      </div>
    </div>
  );
};

export default DashboardDentistOwner;