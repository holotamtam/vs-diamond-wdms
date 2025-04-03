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
import SignUpDentist from './pages/SignUp/SignUpDentist';
import DashboardPatient from './pages/dashboard/DashboardPatient';
import DashboardDentist from './pages/dashboard/DashboardDentist';
import PatientAppointmentBooking from './pages/AppointmentSystem/PatientAppointmentBooking';
import PatientAppointmentStatus from "./pages/AppointmentSystem/PatientAppointmentStatus";
import DentistManageAppointment from './pages/AppointmentSystem/DentistManageAppointment';
import PatientRecord from './pages/PatientRecordSystem/PatientRecord';
import DentistPatientRecord from './pages/PatientRecordSystem/DentistPatientRecord';
import Services from './pages/Services/Services';
import DentistManageInventory from './pages/InventorySystem/DentistManageInventory';
import SignUpClinicStaff from './pages/SignUp/SignUpClinicStaff';
import ManagePersonnel from './pages/ManagePersonnel/ManagePersonnel';
import DashboardClinicStaff from './pages/dashboard/DashboardClinicStaff';
import ClinicStaffManageAppointment from './pages/AppointmentSystem/ClinicStaffManageAppointment';
import ClinicStaffPatientRecord from './pages/PatientRecordSystem/ClinicStaffPatientRecord';
import ClinicStaffManageInventory from './pages/InventorySystem/ClinicStaffManageInventory';

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Index />}/>
          <Route path='*' element={<NoPage />}/>
          <Route path='SignIn' element={<SignIn />}/>
          <Route path='SignUp' element={<SignUp />}/>
          <Route path='SignUpPatient' element={<SignUpPatient />}/>
          <Route path='SignUpDentist' element={<SignUpDentist />}/>
          <Route path='DashboardPatient' element={<DashboardPatient />}/>
          <Route path='DashboardDentist' element={<DashboardDentist />}/>
          <Route path='DentistManageAppointment' element={<DentistManageAppointment/>}/>
          <Route path='PatientAppointmentBooking' element={<PatientAppointmentBooking />}/>
          <Route path='PatientAppointmentStatus' element={<PatientAppointmentStatus />}/>
          <Route path='PatientRecord' element={<PatientRecord />}/>
          <Route path='DentistPatientRecord' element={<DentistPatientRecord />}/>
          <Route path='Services' element={<Services />}/>
          <Route path='DentistManageInventory' element={<DentistManageInventory />}/>
          <Route path='SignUpClinicStaff' element={<SignUpClinicStaff />}/>
          <Route path='ManagePersonnel' element={<ManagePersonnel />}/>
          <Route path='DashboardClinicStaff' element={<DashboardClinicStaff />}/>
          <Route path='ClinicStaffManageAppointment' element={<ClinicStaffManageAppointment />}/>
          <Route path='ClinicStaffPatientRecord' element={<ClinicStaffPatientRecord />}/>
          <Route path='ClinicStaffManageInventory' element={<ClinicStaffManageInventory />}/>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
