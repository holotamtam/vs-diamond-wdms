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
import Services from './pages/otherpages/Services';
import Settings from './pages/otherpages/Settings';
import SettingsPersonnel from './pages/otherpages/SettingsPersonnel';

// Import NoPage or Error Page
import NoPage from './pages/NoPage/NoPage';

// Import User Account System Pages
import SignIn from './pages/UserAccountSystem/SignIn'; // READ
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

// Import Patient Record System Pages
import PatientRecord from './pages/PatientRecordSystem/PatientRecord'; // READ, WRITE or UPDATE
import PersonnelPatientRecord from './pages/PatientRecordSystem/PersonnelPatientRecord'; // READ, WRITE or UPDATE

// Import Inventory System Pages
import ManageInventory from './pages/InventorySystem/ManageInventory'; // WRITE or UPDATE

// Import Accounting System Pages
import Analytics from './pages/AccountingSystem/Analytics'; // WRITE or UPDATE

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          {/* Other Pages */}
          <Route path="/" element={<Index />} />
          <Route path="/services" element={<Services />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings-personnel" element={<SettingsPersonnel />} /> {/* READ, WRITE or UPDATE */}

          {/* User Account System Pages */}
          <Route path="/sign-in" element={<SignIn />} /> {/* READ */}
          <Route path="/sign-up-patient" element={<SignUpPatient />} /> {/* WRITE */}
          <Route path="/sign-up-dentistowner" element={<SignUpDentistOwner />} /> {/* WRITE */}
          <Route path="/sign-up-associatedentist" element={<SignUpAssociateDentist />} /> {/* WRITE */}
          <Route path="/sign-up-clinicstaff" element={<SignUpClinicStaff />} /> {/* WRITE */}
          <Route path="/manage-personnel" element={<ManagePersonnel />} /> {/* READ, WRITE or UPDATE */}

          {/* User Dashboards */}
          <Route path="/dashboard-patient" element={<DashboardPatient />} />
          <Route path="/dashboard-dentistowner" element={<DashboardDentistOwner />} />
          <Route path="/dashboard-associatedentist" element={<DashboardAssociateDentist />} />
          <Route path="/dashboard-clinicstaff" element={<DashboardClinicStaff />} />

          {/* Appointment System */}
          <Route path="/patient-appointment-booking" element={<PatientAppointmentBooking />} /> {/* READ or WRITE */}
          <Route path="/patient-appointment-status" element={<PatientAppointmentStatus />} /> {/* READ or WRITE */}
          <Route path="/manage-appointment" element={<ManageAppointment />} /> {/* READ, WRITE or UPDATE */}

          {/* Patient Record System */}
          <Route path="/treatment-history" element={<PatientRecord />} /> {/* READ, WRITE or UPDATE */}
          <Route path="/patient-record" element={<PersonnelPatientRecord />} /> {/* READ, WRITE or UPDATE */}

          {/* Inventory System */}
          <Route path="/inventory" element={<ManageInventory />} /> {/* WRITE or UPDATE */}

          {/* Accounting System */}
          <Route path="/analytics" element={<Analytics />} /> {/* WRITE or UPDATE */}


          {/* Error Page */}
          <Route path="*" element={<NoPage />} />

        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;