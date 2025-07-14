import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, get, onValue } from 'firebase/database';

const DashboardAssociateDentist = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();
  const [userDetails, setUserDetails] = useState(null);
  const [userRole, setUserRole] = useState('AssociateDentist');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch user details and role for sidebar profile and navigation
  useEffect(() => {
    const personnelTypes = ["DentistOwner", "AssociateDentist", "ClinicStaff"];
    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        for (const type of personnelTypes) {
          const userRef = ref(getDatabase(), `users/Personnel/${type}/${user.uid}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            setUserDetails(snapshot.val());
            // Always set userRole to AssociateDentist for this dashboard
            setUserRole("AssociateDentist");
            break;
          }
        }
      }
    });
    return () => {
      authUnsubscribe();
    };
  }, [auth]);

  // Fetch notifications for the current user
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const notificationsRef = ref(getDatabase(), `notifications/${user.uid}`);
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      const fetchedNotifications = data
        ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
        : [];
      setNotifications(fetchedNotifications);
    });
    return () => unsubscribe();
  }, [auth.currentUser]);

  // Calculate unread notifications count
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  // Function to handle logout
  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate('/', { replace: true });
    });
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
              <Link to="/dashboard-associatedentist" state={{ userRole: "AssociateDentist" }} style={{ textDecoration: "none", color: "#C7A76C", fontWeight: "bold" }}>
                Dashboard
              </Link>
            </li>

            <li style={{ marginBottom: '10px' }}>
              <Link to="/patient-record" state={{ userRole: "AssociateDentist" }} style={{ textDecoration: 'none', color: '#333' }}>
                Patient Record
              </Link>
            </li>

            <li style={{ marginBottom: '10px' }}>
              <Link to="/inventory" state={{ userRole: "AssociateDentist" }} style={{ textDecoration: 'none', color: '#333' }} >
                Inventory
              </Link>
            </li>


            <li style={{ marginBottom: "10px" }}>
              <Link to="/settings-personnel" state={{ userRole: "AssociateDentist" }} style={{ textDecoration: "none", color: "#333" }}>
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
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
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
          zIndex: 10
        }}>
          <h1 style={{ margin: 0, fontSize: "24px", color: "#333" }}>Dashboard</h1>
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
                        >
                          <span>{notification.message}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>
            {/* Manage Appointment Button */}
            <Link to="/manage-appointment" state={{ userRole: userRole }}>
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
        {/* Main Content Area */}
        <div style={{ flex: 1, padding: '20px' }}>
          {/* Dashboard widgets or content here */}
        </div>
      </div>
    </div>
  );
};

export default DashboardAssociateDentist;