import React from "react";
import AppointmentStatus from "../../components/AppointmentStatus";

const PatientAppointmentStatus = () => {
  return (
    <div>
      <button>
        <a href="/dashboard-patient">Go Back to Dashboard</a>
      </button>
      <AppointmentStatus />
    </div>
  );
};

export default PatientAppointmentStatus;