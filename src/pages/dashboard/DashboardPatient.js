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
    <div>
      <Link to="/PatientAppointmentBooking"><button>Book Appointment</button></Link>
      <Link to="/PatientRecord"><button>Treatment History</button></Link>
      <Link to="/Services"><button>View Our Services</button></Link>
      <Link to="/PatientAppointmentStatus">
        <button>Appointment Status</button>
      </Link>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default DashboardPatient;