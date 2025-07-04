import React, { useState, useEffect, use } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { db } from "../../backend/firebaseConfig";
import { ref, onValue, get, update } from "firebase/database";
import {
  markNotificationAsRead,
  deleteNotification,
  //encodeEmail,
} from "../../components/NotifyComp";
import Modal from "react-modal";

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
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [hasInsurance, setHasInsurance] = useState(false);
  const [insuranceDetails, setInsuranceDetails] = useState({
    provider: '',
    policyNumber: '',
    groupNumber: '',
    relationship: ''
  });
  const [insuranceMessage, setInsuranceMessage] = useState("");

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
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Fetch user details from your database
      const usersRef = ref(db, "users/Patient");
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        const users = snapshot.val();
        const userData = Object.values(users).find((u) => u.uid === user.uid);
        if (userData) setUserDetails(userData);
      }
    }
  });
  return () => unsubscribe();
}, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.dropdown-container')) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

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
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

        // Iterate through all appointments and filter upcoming ones
        Object.entries(allAppointments).forEach(([date, dateAppointments]) => {
          Object.entries(dateAppointments).forEach(([id, appointment]) => {
            const appointmentDate = new Date(appointment.date);
            appointmentDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
            
            if (
              appointment.uid === uid &&
              (appointment.status === "Pending" || appointment.status === "Approved") &&
              appointmentDate >= today // Only include future or today's appointments
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
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

        // Filter and collect appointments for the user
        Object.entries(allAppointments).forEach(([date, dateAppointments]) => {
          Object.entries(dateAppointments).forEach(([id, appointment]) => {
            const appointmentDate = new Date(appointment.date);
            appointmentDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
            
            if (
              appointment.uid === uid &&
              (appointment.status === "Pending" || appointment.status === "Approved") &&
              appointmentDate >= today // Only include future or today's appointments
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

  // Function to handle appointment actions
  const handleAppointmentAction = (appointment, action) => {
    setSelectedAppointment(appointment);
    setDropdownOpen(null);
    
    if (action === 'view') {
      setHasInsurance(false);
      setInsuranceDetails(appointment.insuranceDetails || {
        name: '', companyName: '', contactNumber: '', hmoCard: '', hmoAccountNumber: '', validGovernmentID: '', validGovernmentIDNumber: '', birthdate: '', relationship: ''
      });
      setShowAppointmentModal(true);
    }
  };

  // Function to update appointment insurance information
  const updateAppointmentInsurance = async (updatedDetails) => {
    if (!selectedAppointment) return;

    try {
      const appointmentRef = ref(db, `appointments/${selectedAppointment.date}/${selectedAppointment.id}`);
      const updateData = {
        hasInsurance: updatedDetails?.hasInsurance || false,
        insuranceDetails: updatedDetails?.hasInsurance ? updatedDetails : null
      };

      await update(appointmentRef, updateData);
      // Do NOT close the modal or clear selectedAppointment here
      // setShowAppointmentModal(false);
      // setSelectedAppointment(null);
      // UI update and message logic remains
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment. Please try again.');
    }
  };

  // Function to toggle dropdown
  const toggleDropdown = (appointmentId) => {
    setDropdownOpen(dropdownOpen === appointmentId ? null : appointmentId);
  };

  return (
  <div style={{ display: "flex", height: "100vh", background: "#f8f5ef" }}>
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
                color: "#C7A76C",
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
        <span style={{ fontSize: "24px", fontWeight: 700, color: "#23201A" }}>
          Dashboard
        </span>
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
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        setShowNotificationsModal(true);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#007BFF",
                        cursor: "pointer",
                        fontSize: "15px",
                        textDecoration: "underline",
                        padding: 0,
                      }}
                    >
                      View Notifications
                    </button>
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

      {/* Notifications Modal */}
        <Modal
          isOpen={showNotificationsModal}
          onRequestClose={() => setShowNotificationsModal(false)}
          contentLabel="All Notifications"
          style={{
            overlay: { backgroundColor: "rgba(0, 0, 0, 0.5)" },
            content: {
              top: "50%",
              left: "50%",
              right: "auto",
              bottom: "auto",
              marginRight: "-50%",
              transform: "translate(-50%, -50%)",
              padding: "20px",
              borderRadius: "10px",
              width: "600px",
              maxHeight: "80vh",
              overflowY: "auto",
            },
          }}
        >
          <h2 style={{ marginTop: 0 }}>All Notifications</h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
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
                      deleteNotification(auth.currentUser, notification.id, setNotifications);
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
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button
              onClick={() => setShowNotificationsModal(false)}
              style={{
                background: "#007BFF",
                color: "white",
                border: "none",
                padding: "8px 18px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: "bold"
              }}
            >
              Close
            </button>
          </div>
        </Modal>

        {/* Appointment Details Modal */}
        <Modal
          isOpen={showAppointmentModal}
          onRequestClose={() => setShowAppointmentModal(false)}
          contentLabel="Appointment Details"
          style={{
            overlay: { backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 3000 },
            content: {
              top: "50%",
              left: "50%",
              right: "auto",
              bottom: "auto",
              marginRight: "-50%",
              transform: "translate(-50%, -50%)",
              padding: "20px",
              borderRadius: "10px",
              width: "500px",
              maxHeight: "80vh",
              overflowY: "auto",
              zIndex: 3001
            },
          }}
        >
          {selectedAppointment && (
            <div>
              <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Appointment Details</h2>
              
              {/* Appointment Details */}
              <div style={{ marginBottom: "20px" }}>
                <p><strong>Date:</strong> {selectedAppointment.date}</p>
                <p><strong>Time:</strong> {selectedAppointment.time ? formatTime(parseTimeToMinutes(selectedAppointment.time)) : "N/A"}</p>
                <p><strong>Services:</strong> {selectedAppointment.services.join(", ")}</p>
                <p><strong>Dentist:</strong> {selectedAppointment.dentist}</p>
                <p><strong>Status:</strong> {selectedAppointment.status}</p>
                <p><strong>Duration:</strong> {selectedAppointment.duration ? `${selectedAppointment.duration} minutes` : "N/A"}</p>
              </div>

              {/* Insurance Information */}
              <div style={{ marginBottom: "20px" }}>
                <h3>Insurance Information</h3>
                {selectedAppointment.hasInsurance ? (
                  // Show existing insurance details with option to modify
                  <div>
                    <div style={{ marginBottom: "15px" }}>
                      <p><strong>Name:</strong> {selectedAppointment.insuranceDetails?.name || "Not specified"}</p>
                      <p><strong>Company Name:</strong> {selectedAppointment.insuranceDetails?.companyName || "Not specified"}</p>
                      <p><strong>Contact Number:</strong> {selectedAppointment.insuranceDetails?.contactNumber || "Not specified"}</p>
                      <p><strong>HMO Card:</strong> {selectedAppointment.insuranceDetails?.hmoCard || "Not specified"}</p>
                      <p><strong>HMO Account Number:</strong> {selectedAppointment.insuranceDetails?.hmoAccountNumber || "Not specified"}</p>
                      <p><strong>Valid Government ID:</strong> {selectedAppointment.insuranceDetails?.validGovernmentID || "Not specified"}</p>
                      <p><strong>Valid Government ID Number:</strong> {selectedAppointment.insuranceDetails?.validGovernmentIDNumber || "Not specified"}</p>
                      <p><strong>Birthdate:</strong> {selectedAppointment.insuranceDetails?.birthdate || "Not specified"}</p>
                      <p><strong>Relationship:</strong> {selectedAppointment.insuranceDetails?.relationship || "Not specified"}</p>
                    </div>
                    {!hasInsurance && (
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <button
                          onClick={() => {
                            setHasInsurance(true);
                            setInsuranceDetails(selectedAppointment.insuranceDetails || {
                              name: '', companyName: '', contactNumber: '', hmoCard: '', hmoAccountNumber: '', validGovernmentID: '', validGovernmentIDNumber: '', birthdate: '', relationship: ''
                            });
                          }}
                          style={{
                            background: "#007BFF",
                            color: "white",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "4px",
                            cursor: "pointer"
                          }}
                        >
                          Modify Insurance
                        </button>
                        <button
                          onClick={async () => {
                            // Remove insurance from database
                            const appointmentRef = ref(db, `appointments/${selectedAppointment.date}/${selectedAppointment.id}`);
                            await update(appointmentRef, { hasInsurance: false, insuranceDetails: null });
                            setHasInsurance(false);
                            setInsuranceDetails({
                              name: '', companyName: '', contactNumber: '', hmoCard: '', hmoAccountNumber: '', validGovernmentID: '', validGovernmentIDNumber: '', birthdate: '', relationship: ''
                            });
                            setSelectedAppointment(prev => ({ ...prev, hasInsurance: false, insuranceDetails: null }));
                            setInsuranceMessage("Insurance Removed Successfully");
                            setTimeout(() => setInsuranceMessage(""), 3000);
                          }}
                          style={{
                            background: "#dc3545",
                            color: "white",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "4px",
                            cursor: "pointer"
                          }}
                        >
                          Remove Insurance
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Show "No Insurance Provided" with option to add (inline)
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <span style={{ color: "#666", fontStyle: "italic" }}>
                      No Insurance Provided
                    </span>
                    {!hasInsurance && (
                      <button
                        onClick={() => setHasInsurance(true)}
                        style={{
                          background: "#28a745",
                          color: "white",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      >
                        Add Insurance
                      </button>
                    )}
                  </div>
                )}

                {insuranceMessage && (
                  <div style={{ color: '#28a745', marginTop: '10px', fontWeight: 'bold' }}>{insuranceMessage}</div>
                )}

                {/* Insurance Form (shown only when adding or modifying) */}
                {hasInsurance && (
                  <form onSubmit={e => {
                    e.preventDefault();
                    updateAppointmentInsurance({ ...insuranceDetails, hasInsurance: true });
                    setHasInsurance(false);
                    setSelectedAppointment(prev => ({ ...prev, hasInsurance: true, insuranceDetails: { ...insuranceDetails } }));
                    setInsuranceMessage("Insurance Added Successfully");
                    setTimeout(() => setInsuranceMessage(""), 3000);
                  }} style={{
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    padding: "15px",
                    backgroundColor: "#f9f9f9",
                    marginTop: "10px"
                  }}>
                    <div style={{ marginBottom: "10px" }}>
                      <input
                        placeholder="Name"
                        type="text"
                        required
                        value={insuranceDetails.name || ''}
                        maxLength="100"
                        onChange={e => {
                          const value = e.target.value;
                          if (/^[a-zA-Z\s]*$/.test(value)) {
                            setInsuranceDetails(details => ({ ...details, name: value.replace(/\b\w/g, char => char.toUpperCase()) }));
                          }
                        }}
                        style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <input
                        placeholder="Company Name"
                        type="text"
                        required
                        value={insuranceDetails.companyName || ''}
                        maxLength="50"
                        onChange={e => {
                          const value = e.target.value;
                          const regex = /^[a-zA-Z0-9\s\-&.',]+$/;
                          if (value === '' || regex.test(value)) {
                            setInsuranceDetails(details => ({ ...details, companyName: value }));
                          }
                        }}
                        style={{ flex: 1, padding: '8px' }}
                      />
                      <input
                        placeholder="Contact Number"
                        type="text"
                        required
                        maxLength="11"
                        value={insuranceDetails.contactNumber || ''}
                        onChange={e => {
                          const value = e.target.value;
                          if (/^\d*$/.test(value)) {
                            setInsuranceDetails(details => ({ ...details, contactNumber: value }));
                          }
                        }}
                        style={{ flex: 1, padding: '8px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <input
                        placeholder="HMO Card"
                        type="text"
                        required
                        value={insuranceDetails.hmoCard || ''}
                        maxLength="15"
                        onChange={e => {
                          const value = e.target.value;
                          const regex = /^[a-zA-Z0-9-]+$/;
                          if (value === '' || regex.test(value)) {
                            setInsuranceDetails(details => ({ ...details, hmoCard: value }));
                          }
                        }}
                        style={{ flex: 1, padding: '8px' }}
                      />
                      <input
                        placeholder="HMO Account Number"
                        type="text"
                        required
                        value={insuranceDetails.hmoAccountNumber || ''}
                        maxLength="15"
                        onChange={e => {
                          const value = e.target.value;
                          const regex = /^[0-9-]+$/;
                          if (value === '' || regex.test(value)) {
                            setInsuranceDetails(details => ({ ...details, hmoAccountNumber: value }));
                          }
                        }}
                        style={{ flex: 1, padding: '8px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <input
                        placeholder="Valid Government ID"
                        type="text"
                        required
                        value={insuranceDetails.validGovernmentID || ''}
                        onChange={e => {
                          const value = e.target.value;
                          const regex = /^[a-zA-Z0-9-\s]+$/;
                          if (value === '' || regex.test(value)) {
                            setInsuranceDetails(details => ({ ...details, validGovernmentID: value }));
                          }
                        }}
                        style={{ flex: 1, padding: '8px' }}
                      />
                      <input
                        placeholder="Valid Government ID Number"
                        type="text"
                        required
                        value={insuranceDetails.validGovernmentIDNumber || ''}
                        onChange={e => {
                          const value = e.target.value;
                          const regex = /^[a-zA-Z0-9-\s]+$/;
                          if (value === '' || regex.test(value)) {
                            setInsuranceDetails(details => ({ ...details, validGovernmentIDNumber: value }));
                          }
                        }}
                        style={{ flex: 1, padding: '8px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                      <input
                        placeholder="Birthdate"
                        type="date"
                        required
                        value={insuranceDetails.birthdate || ''}
                        onChange={e => setInsuranceDetails(details => ({ ...details, birthdate: e.target.value }))}
                        style={{ flex: 1, padding: '8px' }}
                      />
                      <select
                        required
                        value={insuranceDetails.relationship || ''}
                        onChange={e => setInsuranceDetails(details => ({ ...details, relationship: e.target.value }))}
                        style={{ flex: 1, padding: '8px' }}
                      >
                        <option value="">Select</option>
                        <option value="Principal">Principal</option>
                        <option value="Dependent">Dependent</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setHasInsurance(false);
                          setInsuranceDetails(selectedAppointment.insuranceDetails || {
                            name: '', companyName: '', contactNumber: '', hmoCard: '', hmoAccountNumber: '', validGovernmentID: '', validGovernmentIDNumber: '', birthdate: '', relationship: ''
                          });
                        }}
                        style={{
                          background: "#6c757d",
                          color: "white",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        style={{
                          background: "#007BFF",
                          color: "white",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowAppointmentModal(false)}
                  style={{
                    background: "#6c757d",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                {hasInsurance && (
                  <button
                    onClick={() => updateAppointmentInsurance()}
                    style={{
                      background: "#007BFF",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Save
                  </button>
                )}
              </div>
            </div>
          )}
        </Modal>
       <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
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
            position: "relative",
          }}
        >
          <h3>Next Appointment</h3>
          <p>{nextAppointment ? nextAppointment.date : "No upcoming appointments"}</p>
          {nextAppointment && (
            <div style={{ position: "absolute", top: "10px", right: "10px" }} className="dropdown-container">
              <button
                onClick={() => toggleDropdown(`next-${nextAppointment.id}`)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "18px",
                  padding: "5px",
                }}
              >
                ⋮
              </button>
              {dropdownOpen === `next-${nextAppointment.id}` && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: "0",
                    background: "white",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
                    zIndex: 1000,
                    minWidth: "150px",
                  }}
                >
                  <button
                    onClick={() => handleAppointmentAction(nextAppointment, 'view')}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "14px",
                    }}
                    onMouseEnter={(e) => e.target.style.background = "#f5f5f5"}
                    onMouseLeave={(e) => e.target.style.background = "transparent"}
                  >
                    View Details
                  </button>
                </div>
              )}
            </div>
          )}
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
          position: "relative",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <p><strong>{appointment.services.join(", ")}</strong></p>
            <p>{appointment.dentist}</p>
            <p>{appointment.date}</p>
            <p>{startMinutes !== null ? formatTime(startMinutes) : "N/A"}</p>
          </div>
          <div style={{ position: "relative" }} className="dropdown-container">
            <button
              onClick={() => toggleDropdown(appointment.id)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "18px",
                padding: "5px",
              }}
            >
              ⋮
            </button>
            {dropdownOpen === appointment.id && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: "0",
                  background: "white",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
                  zIndex: 1000,
                  minWidth: "150px",
                }}
              >
                <button
                  onClick={() => handleAppointmentAction(appointment, 'view')}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "14px",
                  }}
                  onMouseEnter={(e) => e.target.style.background = "#f5f5f5"}
                  onMouseLeave={(e) => e.target.style.background = "transparent"}
                >
                  View Details
                </button>
              </div>
            )}
          </div>
        </div>
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
  </div>
);
};

export default DashboardPatient;