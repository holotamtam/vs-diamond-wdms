import React from "react";
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';

const DashboardClinicStaff = () => {
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
           <Link to=""><button>Manage Appointment</button></Link>
            <Link to=""><button>View Patient Record</button></Link>
            <Link to=""><button>Inventory</button></Link>
            <button onClick={handleLogout}>Logout</button>
        </div>
    )
}

export default DashboardClinicStaff;