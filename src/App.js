/*
-------------------------------------------------------------------------------------
Authors         : Alinsonorin, John Myl B., Awi, Joseph Kahl L., Gozon, Daniel Allan
Date Created    : February 11, 2025
File            : App.js
Description     : 
    This page allows the project to access and route all the pages.
Copyright © 2025. All rights reserved.

Last Modified By: Joseph Kahl L. Awi
Last Modified On: February 11, 2025
-------------------------------------------------------------------------------------
*/


/* 
npm install react-scripts
npm install react-calendars
npm install react-router-dom
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/index/Index';
import NoPage from './pages/NoPage/NoPage';
import SignIn from './pages/SignIn/SignIn';
import SignUp from './pages/SignUp/SignUp';
import SignUpPatient from './pages/SignUp/SignUpPatient';
import SignUpDentistOwner from './pages/SignUp/SignUpDentistOwner';
import SignUpAssociateDentist from './pages/SignUp/SignUpAssociateDentist';
import SignUpClinicStaff from './pages/SignUp/SignUpClinicStaff';
import DashboardPatient from './pages/dashboard/DashboardPatient';
import DashboardDentistOwner from './pages/dashboard/DashboardDentistOwner';
import DashboardAssociateDentist from './pages/dashboard/DashboardAssociateDentist';
import DashboardClinicStaff from './pages/dashboard/DashboardClinicStaff';
import PatientAppointmentBooking from './pages/AppointmentSystem/PatientAppointmentBooking';
import PatientAppointmentStatus from "./pages/AppointmentSystem/PatientAppointmentStatus";
import ManageAppointment from './pages/AppointmentSystem/ManageAppointment';
import PatientRecord from './pages/PatientRecordSystem/PatientRecord';
import PersonnelPatientRecord from './pages/PatientRecordSystem/PersonnelPatientRecord';
import ManageInventory from './pages/InventorySystem/ManageInventory';
import ManagePersonnel from './pages/ManagePersonnel/ManagePersonnel';
import Services from './pages/Services/Services';


function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Index />}/> {/* Home page for all users */}

          <Route path='*' element={<NoPage />}/>  {/* 404 page for all users */}

          <Route path='SignIn' element={<SignIn />}/> {/* SignIn page for all users - fetches data from Firebase to log in the user */}

          <Route path='SignUp' element={<SignUp />}/> {/* SignUp page selection for which type of user - Personnel | Patient */}
          <Route path='SignUpPatient' element={<SignUpPatient />}/> {/* SignUp page for Patients - writes and saves data to Firebase */}
          <Route path='SignUpDentistOwner' element={<SignUpDentistOwner />}/> {/* SignUp page for Dentists - writes and saves data to Firebase */}
          <Route path='SignUpAssociateDentist' element={<SignUpAssociateDentist />}/> {/* SignUp page for Associate Dentists - writes and saves data to Firebase */}
          <Route path='SignUpClinicStaff' element={<SignUpClinicStaff />}/> {/* SignUp page for clinic staffs - writes and saves data to Firebase */}

          <Route path='DashboardPatient' element={<DashboardPatient />}/> {/* Dashboard page for Patients - allows patients to book an appointment, view appointment status, view treatment history, and view services */}
          <Route path='DashboardDentistOwner' element={<DashboardDentistOwner />}/> {/* Dashboard page for Dentists - allows dentists to manage appointments, view patient records, manage inventory, view accounting, and manage personnel */}
          <Route path='DashboardAssociateDentist' element={<DashboardAssociateDentist />}/> {/* Dashboard page for Associate Dentists - allows associate dentists to manage appointments, view patient records, and view accounting */}
          <Route path='DashboardClinicStaff' element={<DashboardClinicStaff />}/> {/* Dashboard page for Clinic Staff - allows clinic staff to manage appointments, view patient records, manage inventory, view accounting */}

          <Route path='PatientAppointmentBooking' element={<PatientAppointmentBooking />}/> {/* Appointment booking page for patients – allows patients to book (write) an appointment and saves the data to Firebase */}
          <Route path='PatientAppointmentStatus' element={<PatientAppointmentStatus />}/> {/* Appointment status page for patients - allows patients to view (read) their appointment status */}
          <Route path='ManageAppointment' element={<ManageAppointment/>}/> {/* Appointment management page for dentists - allows dentists to manage (read, update, delete) appointments */}

          <Route path='PatientRecord' element={<PatientRecord />}/> {/* Patient record page for patients - allows patients to view (read) their treatment history */}
          <Route path='PersonnelPatientRecord' element={<PersonnelPatientRecord />}/> {/* Patient record page for the personnel - allows personnel to manage (read, update) patient records */}
          
          <Route path='ManageInventory' element={<ManageInventory />}/> {/* Inventory management page for personnel - allows personnel to manage (read, update, delete) inventory */}
          <Route path='ManagePersonnel' element={<ManagePersonnel />}/> {/* Personnel management page for Dentist (Owner) - allows dentists to manage (read, update, delete) personnel such as adding or removing clinic staff or dentist */}

          <Route path='Services' element={<Services />}/> {/* Services page for all users - allows the patient to view (read)) the services, while the personnel can manage (read, update, delete) the services offered by the clinic */}
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
