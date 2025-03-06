import React, { useState, useEffect } from "react";
import { db } from "../../backend/firebaseConfig";
import Calendar from "react-calendar";
import { ref, onValue, remove, update } from "firebase/database";
import Modal from "react-modal";
import PatientInsuranceForm from "./PatientInsuranceForm";
import ServicesList from "../../components/ServicesList"; // Import the ServicesList component

Modal.setAppElement("#root");

const ManageAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [insuranceDetails, setInsuranceDetails] = useState(null);
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({ services: [] });

  // Fetch appointments for the selected date
  useEffect(() => {
    if (!selectedDate) return;
    const formattedDate = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    const appointmentsRef = ref(db, `appointments/${formattedDate}`);

    onValue(appointmentsRef, (snapshot) => {
      const data = snapshot.val();
      setAppointments(data ? Object.entries(data).map(([id, value]) => ({ id, ...value })) : []);
    });
  }, [selectedDate]);

  // Handle date change
  const handleDateChange = (date) => setSelectedDate(date);

  // Handle appointment cancellation
  const handleCancelAppointment = async (id) => {
    if (!window.confirm("Do you want to cancel this appointment?")) return;

    const formattedDate = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    const appointmentRef = ref(db, `appointments/${formattedDate}/${id}`);

    try {
      await remove(appointmentRef);
      setAppointments((prev) => prev.filter((appointment) => appointment.id !== id));
    } catch (error) {
      console.error("Error canceling appointment:", error);
    }
  };

  // Handle viewing insurance details
  const handleViewInsuranceDetails = (appointment) => {
    setInsuranceDetails(appointment.insuranceDetails);
    setEditingAppointmentId(appointment.id);
    setShowInsuranceForm(true);
  };

  // Handle insurance form submission
  const handleInsuranceFormSubmit = async (formData) => {
    if (editingAppointmentId) {
      const formattedDate = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().split("T")[0];
      const appointmentRef = ref(db, `appointments/${formattedDate}/${editingAppointmentId}`);
      await update(appointmentRef, { insuranceDetails: formData });
      setEditingAppointmentId(null);
      setInsuranceDetails(null);
    }
    setShowInsuranceForm(false);
  };

  // Handle closing the insurance form
  const handleInsuranceClose = () => {
    setShowInsuranceForm(false);
    setEditingAppointmentId(null);
    setInsuranceDetails(null);
  };

  // Handle confirming the appointment
  const handleConfirmAppointment = async (id) => {
    const formattedDate = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    const appointmentRef = ref(db, `appointments/${formattedDate}/${id}`);

    try {
      await update(appointmentRef, { status: "Confirmed" });
      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === id ? { ...appointment, status: "Confirmed" } : appointment
        )
      );
    } catch (error) {
      console.error("Error confirming appointment:", error);
    }
  };

  // Handle completing the appointment
  const handleCompleteAppointment = async (id) => {
    const formattedDate = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    const appointmentRef = ref(db, `appointments/${formattedDate}/${id}`);

    try {
      await update(appointmentRef, { status: "Completed" });
      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === id ? { ...appointment, status: "Completed" } : appointment
        )
      );
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
      const formattedDate = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().split("T")[0];
      const appointmentRef = ref(db, `appointments/${formattedDate}/${editingAppointmentId}`);
      await update(appointmentRef, formData);
      setEditingAppointmentId(null);
      setEditFormData({ services: [] });
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

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "30px", padding: "20px" }}>
      <div style={{ width: "350px" }}>
        <h1>Manage Appointments</h1>
        <h2>Select Date:</h2>
        <Calendar onChange={handleDateChange} value={selectedDate} />

        <div style={{ width: "400px" }}>
          <h2>Appointments for {selectedDate.toDateString()}</h2>
          <ul style={{ padding: "0", listStyle: "none" }}>
            {appointments.length > 0 && appointments.map((appointment) => (
              <li key={appointment.id} style={{ padding: "10px", border: "1px solid #000", marginBottom: "5px", position: "relative", backgroundColor: "#e0e0e0" }}>
                <button onClick={() => handleCancelAppointment(appointment.id)} style={{ position: "absolute", top: "5px", right: "5px", background: "red", color: "white", border: "none", padding: "5px 10px", cursor: "pointer", fontSize: "12px" }}>Cancel</button>
                {appointment.insuranceDetails && (
                  <button onClick={() => handleViewInsuranceDetails(appointment)} style={{ position: "absolute", top: "5px", right: "120px", background: "blue", color: "white", border: "none", padding: "5px 10px", cursor: "pointer", fontSize: "12px" }}>Insurance Details</button>
                )}
                <button onClick={() => handleEditAppointment(appointment)} style={{ position: "absolute", top: "5px", right: "70px", background: "orange", color: "white", border: "none", padding: "5px 10px", cursor: "pointer", fontSize: "12px" }}>Edit</button>
                <div>
                  <b>{appointment.date}</b>
                  <br /> {appointment.services.join(", ")}
                  <br /> <b>Time: {formatTime(parseInt(appointment.time.split(":")[0]) * 60 + parseInt(appointment.time.split(":")[1]))} - {formatTime(parseInt(appointment.time.split(":")[0]) * 60 + parseInt(appointment.time.split(":")[1]) + appointment.duration)}</b>
                  <br /> <b>Status: <span style={{ color: appointment.status === "Confirmed" ? "green" : appointment.status === "Completed" ? "blue" : "orange" }}>{appointment.status}</span></b>
                  <br /> <b>Patient: {appointment.userId}</b>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Modal
        isOpen={showInsuranceForm}
        onRequestClose={handleInsuranceClose}
        contentLabel="Insurance Form Modal"
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
          },
        }}
      >
        <PatientInsuranceForm
          onSubmit={handleInsuranceFormSubmit}
          onClose={handleInsuranceClose}
          initialData={insuranceDetails || {}}
        />
      </Modal>

      <Modal
        isOpen={showEditForm}
        onRequestClose={handleEditClose}
        contentLabel="Edit Appointment Modal"
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            height: '400px',
          },
        }}
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          handleEditFormSubmit(editFormData);
        }}>
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
            Dentist Remarks:
            <input
              type="text"
            />
          </label>
          <button type="submit">Save</button>
          <button type="button" onClick={handleEditClose}>Cancel</button>
        </form>
      </Modal>
    </div>
  );
};

export default ManageAppointments;