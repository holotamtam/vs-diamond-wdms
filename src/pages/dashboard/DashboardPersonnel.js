import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';

const DashboardPersonnel = () => {

  const navigate = useNavigate();
  const auth = getAuth();
  
  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate('/', { replace: true });
    });
  };

    
    
    return (
    
    <div>
        <Link to="/ManageAppointment"><button>Manage Appointment</button></Link>
        <Link to="/PersonnelPatientRecord"><button>View Patient Record</button></Link>
        <button onClick={handleLogout}>Logout</button>
    </div>

)
  };
  
  export default DashboardPersonnel;
  