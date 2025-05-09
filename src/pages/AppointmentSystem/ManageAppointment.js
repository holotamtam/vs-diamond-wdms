import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "../../backend/firebaseConfig";
import Calendar from "react-calendar";
import { ref, onValue, remove, update, push } from "firebase/database";
import Modal from "react-modal";
import ViewInsurance from "../../components/ViewInsurance";
import ServicesList from "../../components/ServicesList";

Modal.setAppElement("#root");

const ManageAppointment = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [insuranceDetails, setInsuranceDetails] = useState(null);
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({ services: [] });
  const navigate = useNavigate();
  const location = useLocation();
  const encodeEmail = (email) => email.replace(/\./g, ",");
  const decodeEmail = (encodedEmail) => encodedEmail.replace(/,/g, ".");

   // Retrieve userRole from navigation state
   const userRole = location.state?.userRole || "";

   const addNotification = async (email, message) => {
    const encodedEmail = encodeEmail(email); // Encode the email
    const notificationsRef = ref(db, `notifications/${encodedEmail}`); // Reference to the notifications node
    const newNotification = {
      message,
      timestamp: new Date().toISOString(),
      read: false,
    };
  
    try {
      const newNotificationRef = await push(notificationsRef, newNotification); // Push the notification to Firebase
      console.log("Notification added successfully with ID:", newNotificationRef.key);
    } catch (error) {
      console.error("Error adding notification:", error);
    }
  };


  // fetch appointments for the selected date
  useEffect(() => {
    if (!selectedDate) return;
    const formattedDate = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
    const appointmentsRef = ref(db, `appointments/${formattedDate}`);

    onValue(appointmentsRef, (snapshot) => {
      const data = snapshot.val();
      setAppointments(data ? Object.entries(data).map(([id, value]) => ({ id, ...value })) : []);
    });
  }, [selectedDate]);



  // handle date change
  const handleDateChange = (date) => setSelectedDate(date);

  // Handle appointment cancellation
  const handleCancelAppointment = async (id) => {
    if (!window.confirm("Do you want to cancel this appointment?")) return;
  
    const formattedDate = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
    const appointmentRef = ref(db, `appointments/${formattedDate}/${id}`);
  
    try {
      await remove(appointmentRef);
      setAppointments((prev) => prev.filter((appointment) => appointment.id !== id));
  
      // Add notification for the patient
      const appointment = appointments.find((appt) => appt.id === id);
  if (appointment) {
    const message = "Your appointment has been canceled.";
    addNotification(appointment.userId, message); // Add notification for the patient
  }
    } catch (error) {
      console.error("Error canceling appointment:", error);
    }
  };


  // Handle viewing insurance details
  const handleViewInsuranceDetails = (appointment) => {
    setInsuranceDetails(appointment.insuranceDetails);
    setShowInsuranceForm(true);
  };

  const handleInsuranceClose = () => {
    setShowInsuranceForm(false);
    setInsuranceDetails(null);
  };

  // Handle confirming the appointment
  const handleConfirmAppointment = async (id) => {
    const formattedDate = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
    const appointmentRef = ref(db, `appointments/${formattedDate}/${id}`);
  
    try {
      await update(appointmentRef, { status: "Confirmed" });
  
      // Add notification for the patient
      const appointment = appointments.find((appt) => appt.id === id);
      if (appointment) {
        const message = "Your appointment has been confirmed.";
        addNotification(appointment.userId, message); // Add notification for the patient
      }
    } catch (error) {
      console.error("Error confirming appointment:", error);
    }
  };

  // Handle completing the appointment
  const handleCompleteAppointment = async (id) => {
    const formattedDate = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
    const appointmentRef = ref(db, `appointments/${formattedDate}/${id}`);
  
    try {
      await update(appointmentRef, { status: "Completed" });
  
      // Add notification for the patient
      const appointment = appointments.find((appt) => appt.id === id);
  if (appointment) {
    const message = `Your appointment has been completed. Dentist remarks: '${appointment.dentistRemarks || "No remarks"}'`;
    addNotification(appointment.userId, message); // Add notification for the patient
  }
    } catch (error) {
      console.error("Error completing appointment:", error);
    }
  };

  // Handle opening the edit form
  const handleEditAppointment = (appointment) => {
    setEditFormData({ ...appointment, services: appointment.services || [] });
    setEditingAppointmentId(appointment.id);
    setShowEditForm(true);
  };

  // Handle edit form submission
  const handleEditFormSubmit = async (formData) => {
    if (editingAppointmentId) {
      const formattedDate = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];
      const appointmentRef = ref(db, `appointments/${formattedDate}/${editingAppointmentId}`);
  
      // Find the original appointment
      const originalAppointment = appointments.find((appt) => appt.id === editingAppointmentId);
  
      try {
        // Update the appointment in the database
        await update(appointmentRef, formData);
  
        // Calculate start and end times
        const startTimeMinutes =
          parseInt(originalAppointment.time.split(":")[0]) * 60 +
          parseInt(originalAppointment.time.split(":")[1]);
        const endTimeMinutes = startTimeMinutes + originalAppointment.duration;
        const formattedStartTime = formatTime(startTimeMinutes);
        const formattedEndTime = formatTime(endTimeMinutes);
  
        // Check if the status has changed
        if (originalAppointment && originalAppointment.status !== formData.status) {
          let message = "";
          if (formData.status === "Confirmed") {
            message = `Your appointment on ${formattedDate} from ${formattedStartTime} to ${formattedEndTime} has been confirmed.`;
          } else if (formData.status === "Completed") {
            message = `Your appointment on ${formattedDate} from ${formattedStartTime} to ${formattedEndTime} has been completed. Dentist remarks: '${formData.dentistRemarks || "No remarks"}'`;
          } else if (formData.status === "Pending") {
            message = `Your appointment on ${formattedDate} from ${formattedStartTime} to ${formattedEndTime} status has been updated to pending.`;
          }
  
          // Add a notification for the patient
          if (message) {
            addNotification(originalAppointment.userId, message);
          }
        }
  
        // Check if the dentist remarks have changed
        if (originalAppointment && originalAppointment.dentistRemarks !== formData.dentistRemarks) {
          const remarksMessage = `Your dentist has updated the remarks for your appointment on ${formattedDate} from ${formattedStartTime} to ${formattedEndTime}: '${formData.dentistRemarks || "No remarks"}'`;
          addNotification(originalAppointment.userId, remarksMessage);
        }
  
        // Update the local state
        setAppointments((prevAppointments) =>
          prevAppointments.map((appt) =>
            appt.id === editingAppointmentId ? { ...appt, ...formData } : appt
          )
        );
  
        setEditingAppointmentId(null);
        setEditFormData({ services: [] });
      } catch (error) {
        console.error("Error updating appointment:", error);
      }
    }
    setShowEditForm(false);
  };

  // Handle closing the edit form
  const handleEditClose = () => {
    setShowEditForm(false);
    setEditingAppointmentId(null);
    setEditFormData({ services: [] });
  };

  // Toggle service selection
  const toggleService = (service) => {
    setEditFormData((prevData) => ({
      ...prevData,
      services: prevData.services.includes(service)
        ? prevData.services.filter((s) => s !== service)
        : [...prevData.services, service],
    }));
  };

  // Format time in minutes to HH:MM AM/PM format
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = mins < 10 ? `0${mins}` : mins;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  const handleGoBack = () => {
    if (userRole === "DentistOwner") {
      navigate("/dashboard-dentistowner");
    } else if (userRole === "AssociateDentist") {
      navigate("/DashboardAssociateDentist");
    } else if (userRole === "ClinicStaff") {
      navigate("/DashboardClinicStaff");
    } else {
      alert("Unable to determine your role. Redirecting to the home page.");
      navigate("/"); // Default to home if role is not determined
    }
  };

  return (
    <div>
      <button onClick={handleGoBack}>Go Back to Dashboard</button>
      <div style={{ padding: "20px" }}>
        <h1>Manage Appointments</h1>
        <h2>Select Date:</h2>
        <Calendar onChange={handleDateChange} value={selectedDate} />

        <h2>Appointments for {selectedDate.toDateString()}</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid black", padding: "10px" }}>Time</th>
              <th style={{ border: "1px solid black", padding: "10px" }}>Patient</th>
              <th style={{ border: "1px solid black", padding: "10px" }}>Services</th>
              <th style={{ border: "1px solid black", padding: "10px" }}>Dentist</th>
              <th style={{ border: "1px solid black", padding: "10px" }}>Status</th>
              <th style={{ border: "1px solid black", padding: "10px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length > 0 ? (
              appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td style={{ border: "1px solid black", padding: "10px" }}>
                    {formatTime(
                      parseInt(appointment.time.split(":")[0]) * 60 +
                        parseInt(appointment.time.split(":")[1])
                    )}{" "}
                    -{" "}
                    {formatTime(
                      parseInt(appointment.time.split(":")[0]) * 60 +
                        parseInt(appointment.time.split(":")[1]) +
                        appointment.duration
                    )}
                  </td>
                  <td style={{ border: "1px solid black", padding: "10px" }}>{appointment.userId}</td>
                  <td style={{ border: "1px solid black", padding: "10px" }}>{appointment.services.join(", ")}</td>
                  <td style={{ border: "1px solid black", padding: "10px" }}>{appointment.dentist || "Not assigned"}</td>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "10px",
                      color:
                        appointment.status === "Confirmed"
                          ? "green"
                          : appointment.status === "Completed"
                          ? "blue"
                          : "orange",
                    }}
                  >
                    {appointment.status}
                  </td>
                  <td style={{ border: "1px solid black", padding: "10px", textAlign: "center" }}>
                    <button
                      onClick={() => handleEditAppointment(appointment)}
                      style={{
                        background: "orange",
                        color: "white",
                        border: "none",
                        padding: "5px 10px",
                        cursor: "pointer",
                        marginRight: "5px",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleCancelAppointment(appointment.id)}
                      style={{
                        background: "red",
                        color: "white",
                        border: "none",
                        padding: "5px 10px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    {appointment.insuranceDetails && (
                      <button
                        onClick={() => handleViewInsuranceDetails(appointment)}
                        style={{
                          background: "blue",
                          color: "white",
                          border: "none",
                          padding: "5px 10px",
                          cursor: "pointer",
                          marginLeft: "5px",
                        }}
                      >
                        Insurance Details
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "10px" }}>
                  No appointments found for this date.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Appointment Modal */}
      <Modal
        isOpen={showEditForm}
        onRequestClose={handleEditClose}
        contentLabel="Edit Appointment Modal"
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            height: "400px",
          },
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleEditFormSubmit(editFormData);
          }}
        >
          <h2>Edit Appointment</h2>
          <label>
            Date:
            <input
              type="date"
              value={editFormData.date || ""}
              onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
            />
          </label>
          <label>
            Time:
            <input
              type="time"
              value={editFormData.time || ""}
              onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
            />
          </label>
          <label>
            Status:
            <select
              value={editFormData.status || ""}
              onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
            >
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
            </select>
          </label>
          <label>
            Bill:
            <input
              type="number"
              value={editFormData.bill || ""}
              onChange={(e) => setEditFormData({ ...editFormData, bill: e.target.value })}
            />
          </label>
          <label>
            <br /> Services:
            <ServicesList
              selectedServices={editFormData.services}
              toggleService={toggleService}
            />
          </label>
          <label>
            Remarks:
            <input
              type="text"
              value={editFormData.dentistRemarks || ""}
              onChange={(e) => setEditFormData({ ...editFormData, dentistRemarks: e.target.value })}
            />
          </label>
          <button type="submit">Save</button>
          <button type="button" onClick={handleEditClose}>
            Cancel
          </button>
        </form>
      </Modal>

      {/* Insurance Details Modal */}
      <Modal
        isOpen={showInsuranceForm}
        onRequestClose={handleInsuranceClose}
        contentLabel="Insurance Details Modal"
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
          },
        }}
      >
        <ViewInsurance
          isOpen={showInsuranceForm}
          onClose={handleInsuranceClose}
          insuranceDetails={insuranceDetails}
        />
      </Modal>
    </div>
  );
};

export default ManageAppointment;