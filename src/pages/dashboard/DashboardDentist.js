import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';

const DashboardDentist = () => {

  const navigate = useNavigate();
  const auth = getAuth();
  
  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate('/', { replace: true });
    });
  };
  
  return (
    
    <div>
        <Link to="/DentistManageAppointment"><button>Manage Appointment</button></Link>
        <Link to="/DentistPatientRecord"><button>View Patient Record</button></Link>
        <Link to="/DentistManageInventory"><button>Inventory</button></Link>
        <Link to="/ManagePersonnel"><button>ManagePersonnel</button></Link>
        <button onClick={handleLogout}>Logout</button>
    </div>
  )
};
  
  export default DashboardDentist;
  