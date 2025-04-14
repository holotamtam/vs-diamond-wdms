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
import SignIn from './pages/UserAccountSystem/SignIn';
import SignUp from './pages/UserAccountSystem/SignUp';
import SignUpPatient from './pages/UserAccountSystem/SignUpPatient';
import SignUpDentistOwner from './pages/UserAccountSystem/SignUpDentistOwner';
import SignUpAssociateDentist from './pages/UserAccountSystem/SignUpAssociateDentist';
import SignUpClinicStaff from './pages/UserAccountSystem/SignUpClinicStaff';
import ManagePersonnel from './pages/UserAccountSystem/ManagePersonnel';

// Import Dashboards
import DashboardPatient from './pages/dashboard/DashboardPatient';
import DashboardDentistOwner from './pages/dashboard/DashboardDentistOwner';
import DashboardAssociateDentist from './pages/dashboard/DashboardAssociateDentist';
import DashboardClinicStaff from './pages/dashboard/DashboardClinicStaff';

// Import Appointment System Pages
import PatientAppointmentBooking from './pages/AppointmentSystem/PatientAppointmentBooking';
import PatientAppointmentStatus from './pages/AppointmentSystem/PatientAppointmentStatus';
import ManageAppointment from './pages/AppointmentSystem/ManageAppointment';
import Notification from './pages/AppointmentSystem/Notification';

// Import Patient Record System Pages
import PatientRecord from './pages/PatientRecordSystem/PatientRecord';
import PersonnelPatientRecord from './pages/PatientRecordSystem/PersonnelPatientRecord';

// Import Inventory System Pages
import ManageInventory from './pages/InventorySystem/ManageInventory';


function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          {/* Index and Error Pages */}
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NoPage />} />

          {/* User Account System Pages */}
          <Route path="SignIn" element={<SignIn />} /> {/* User Account System Pages */}
          <Route path="SignUp" element={<SignUp />} />
          <Route path="SignUpPatient" element={<SignUpPatient />} />
          <Route path="SignUpDentistOwner" element={<SignUpDentistOwner />} />
          <Route path="SignUpAssociateDentist" element={<SignUpAssociateDentist />} />
          <Route path="SignUpClinicStaff" element={<SignUpClinicStaff />} />
          <Route path="ManagePersonnel" element={<ManagePersonnel />} />

          {/* User Dashboards */}
          <Route path="DashboardPatient" element={<DashboardPatient />} />
          <Route path="DashboardDentistOwner" element={<DashboardDentistOwner />} />
          <Route path="DashboardAssociateDentist" element={<DashboardAssociateDentist />} />
          <Route path="DashboardClinicStaff" element={<DashboardClinicStaff />} />

          {/* Appointment System */}
          <Route path="PatientAppointmentBooking" element={<PatientAppointmentBooking />} />
          <Route path="PatientAppointmentStatus" element={<PatientAppointmentStatus />} />
          <Route path="ManageAppointment" element={<ManageAppointment />} />
          <Route path="Notifications" element={<Notification />} />

          {/* Patient Record System */}
          <Route path="PatientRecord" element={<PatientRecord />} />
          <Route path="PersonnelPatientRecord" element={<PersonnelPatientRecord />} />

          {/* Inventory System */}
          <Route path="ManageInventory" element={<ManageInventory />} />

          {/* Other Pages */}
          <Route path="Services" element={<Services />} />

        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;