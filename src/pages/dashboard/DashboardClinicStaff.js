import React from "react";
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';



const DashboardClinicStaff = () => {

   const navigate = useNavigate();
     const auth = getAuth();
     
     const handleLogout = () => {
       signOut(auth).then(() => {
         navigate('/', { replace: true });
       });
     };

    return (
        <div>
           <Link to="/ClinicStaffManageAppointment"><button>Manage Appointment</button></Link>
            <Link to="/ClinicStaffPatientRecord"><button>View Patient Record</button></Link>
            <Link to="/ClinicStaffManageInventory"><button>Inventory</button></Link>
            <button onClick={handleLogout}>Logout</button>
        </div>
    )
}

export default DashboardClinicStaff;