import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';

const DashboardPatient = () => {
  const navigate = useNavigate();
  const auth = getAuth();

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
          <h2>Dashboard</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/PatientRecord" style={{ textDecoration: 'none', color: '#333' }}>
                Treatment History
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/Services" style={{ textDecoration: 'none', color: '#333' }}>
                View Our Services
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/PatientAppointmentStatus" style={{ textDecoration: 'none', color: '#333' }}>
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
            background: '#f44336',
            color: 'white',
            border: 'none',
            padding: '10px',
            cursor: 'pointer',
            borderRadius: '5px',
          }}
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '20px' }}>
        <Link to="/PatientAppointmentBooking">
          <button
            style={{
              background: '#007BFF',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              cursor: 'pointer',
              borderRadius: '5px',
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