/*
-------------------------------------------------------------------------------------
Authors         : Alinsonorin, John Myl B., Awi, Joseph Kahl L., Gozon, Daniel Allan
Date Created    : February 11, 2025
File            : App.js
Description     : 
    This file serves as the main entry point for routing all the pages in the project.
Copyright © 2025. All rights reserved.

Last Modified By: Joseph Kahl L. Awi
Last Modified On: February 11, 2025
-------------------------------------------------------------------------------------
*/

/* 
Dependencies:
- npm install react-scripts
- npm install react-calendar
- npm install react-router-dom
*/

import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import Other Pages
import Index from './pages/index/Index';
import Services from './pages/Services/Services';

// Import NoPage or Error Page
import NoPage from './pages/NoPage/NoPage';

// Import User Account System Pages
import SignIn from './pages/UserAccountSystem/SignIn'; // READ
import SignUp from './pages/UserAccountSystem/SignUp'; 
import SignUpPatient from './pages/UserAccountSystem/SignUpPatient'; // WRITE
import SignUpDentistOwner from './pages/UserAccountSystem/SignUpDentistOwner'; // WRITE
import SignUpAssociateDentist from './pages/UserAccountSystem/SignUpAssociateDentist'; // WRITE
import SignUpClinicStaff from './pages/UserAccountSystem/SignUpClinicStaff'; // WRITE
import ManagePersonnel from './pages/UserAccountSystem/ManagePersonnel'; // READ, WRITE or UPDATE

// Import Dashboards
import DashboardPatient from './pages/dashboard/DashboardPatient';
import DashboardDentistOwner from './pages/dashboard/DashboardDentistOwner';
import DashboardAssociateDentist from './pages/dashboard/DashboardAssociateDentist';
import DashboardClinicStaff from './pages/dashboard/DashboardClinicStaff';

// Import Appointment System Pages
import PatientAppointmentBooking from './pages/AppointmentSystem/PatientAppointmentBooking'; // READ OR WRITE
import PatientAppointmentStatus from './pages/AppointmentSystem/PatientAppointmentStatus'; // READ OR WRITE
import ManageAppointment from './pages/AppointmentSystem/ManageAppointment'; // READ, WRITE or UPDATE
import Notification from './pages/AppointmentSystem/Notification'; // READ OR WRITE

// Import Patient Record System Pages
import PatientRecord from './pages/PatientRecordSystem/PatientRecord'; // READ, WRITE or UPDATE
import PersonnelPatientRecord from './pages/PatientRecordSystem/PersonnelPatientRecord'; // READ, WRITE or UPDATE

// Import Inventory System Pages
import ManageInventory from './pages/InventorySystem/ManageInventory'; // WRITE or UPDATE


function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          {/* Other Pages */}
          <Route path="/" element={<Index />} />
          <Route path="Services" element={<Services />} />

          {/* User Account System Pages */}
          <Route path="SignIn" element={<SignIn />} /> {/* READ */}
          <Route path="SignUp" element={<SignUp />} /> {/* WRITE */}
          <Route path="SignUpPatient" element={<SignUpPatient />} /> {/* WRITE */}
          <Route path="SignUpDentistOwner" element={<SignUpDentistOwner />} /> {/* WRITE */}
          <Route path="SignUpAssociateDentist" element={<SignUpAssociateDentist />} /> {/* WRITE */}
          <Route path="SignUpClinicStaff" element={<SignUpClinicStaff />} /> {/* WRITE */}
          <Route path="ManagePersonnel" element={<ManagePersonnel />} /> {/* READ, WRITE or UPDATE */}

          {/* User Dashboards */}
          <Route path="DashboardPatient" element={<DashboardPatient />} />
          <Route path="DashboardDentistOwner" element={<DashboardDentistOwner />} />
          <Route path="DashboardAssociateDentist" element={<DashboardAssociateDentist />} />
          <Route path="DashboardClinicStaff" element={<DashboardClinicStaff />} />

          {/* Appointment System */}
          <Route path="PatientAppointmentBooking" element={<PatientAppointmentBooking />} /> {/* READ or WRITE */}
          <Route path="PatientAppointmentStatus" element={<PatientAppointmentStatus />} /> {/* READ or WRITE */}
          <Route path="ManageAppointment" element={<ManageAppointment />} /> {/* READ, WRITE or UPDATE */}
          <Route path="Notifications" element={<Notification />} /> {/* READ or WRITE */}

          {/* Patient Record System */}
          <Route path="PatientRecord" element={<PatientRecord />} /> {/* READ, WRITE or UPDATE */}
          <Route path="PersonnelPatientRecord" element={<PersonnelPatientRecord />} /> {/* READ, WRITE or UPDATE */}

          {/* Inventory System */}
          <Route path="ManageInventory" element={<ManageInventory />} /> {/* WRITE or UPDATE */}

          {/* Error Page */}
          <Route path="*" element={<NoPage />} />

        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;