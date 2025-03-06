import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { db, auth } from "../../backend/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { ref, push, onValue, remove, update } from "firebase/database";
import PatientInsuranceForm from "../AppointmentSystem/PatientInsuranceForm";
import Modal from "react-modal";
import ServicesList, { servicesList } from "../../components/ServicesList"; // Import the ServicesList component and servicesList array

Modal.setAppElement("#root");

const PatientAppointmentBooking = () => {
   // State variables 
   const [currentUser, setCurrentUser] = useState(null);
   const [loading, setLoading] = useState(true);
   const [selectedDate, setSelectedDate] = useState(new Date());
   const [selectedServices, setSelectedServices] = useState([]);
   const [appointments, setAppointments] = useState([]);
   const [dropdownOpen, setDropdownOpen] = useState(false);
   const [bookingStatus, setBookingStatus] = useState("");
   const [insuranceAsked, setInsuranceAsked] = useState(false);
   const [hasInsurance, setHasInsurance] = useState(null);
   const [showInsuranceModal, setShowInsuranceModal] = useState(false);
   const [showInsuranceForm, setShowInsuranceForm] = useState(false);
   const [insuranceDetails, setInsuranceDetails] = useState(null);
   const [editingAppointmentId, setEditingAppointmentId] = useState(null);
 
 
   // Clinic office hours (in minutes)
   const officeStartTime = 9 * 60; // 9:00 AM
   const officeEndTime = 17 * 60;  // 5:00 PM
 
   // Listen for auth state changes
   useEffect(() => {
     const unsubscribe = onAuthStateChanged(auth, (user) => {
       setCurrentUser(user ? user : null);
       setLoading(false);
     });
     return () => unsubscribe();
   }, []);
 
   // Helper: fetch appointments for the selected date
   const fetchAppointmentsForDate = () => {
     const formattedDate = new Date(
       selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000
     )
       .toISOString()
       .split("T")[0];
     const appointmentsRef = ref(db, `appointments/${formattedDate}`);
     onValue(
       appointmentsRef,
       (snapshot) => {
         const data = snapshot.val();
         const fetched = data
           ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
           : [];
         setAppointments(fetched);
         console.log("Fetched appointments for", formattedDate, fetched);
       },
       { onlyOnce: true }
     );
   };
 
   // Fetch appointments when selectedDate changes
   useEffect(() => {
     if (!selectedDate) return;
     fetchAppointmentsForDate();
   }, [selectedDate]);
 
   // Handle date change
   const handleDateChange = (date) => setSelectedDate(date);
 
   // Toggle service selection
   const toggleService = (service) => {
     setSelectedServices((prevSelected) =>
       prevSelected.includes(service)
         ? prevSelected.filter((s) => s !== service)
         : [...prevSelected, service]
     );
   };
 
   // Calculate total duration based on selected services
   const calculateTotalDuration = () => {
     return selectedServices.reduce((total, service) => {
       const serviceObj = servicesList.find((s) => s.name === service);
       return total + (serviceObj ? serviceObj.time : 0);
     }, 0);
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
 
     // Generate available time slots based on current appointments
     const generateTimeSlots = () => {
     const totalDuration = calculateTotalDuration();
     const slots = [];
     let lastEndTime = officeStartTime;
 
     // Sort appointments by start time (converted to minutes)
     const sortedAppointments = [...appointments].sort((a, b) => {
       const aStart = parseInt(a.time.split(":")[0]) * 60 + parseInt(a.time.split(":")[1]);
       const bStart = parseInt(b.time.split(":")[0]) * 60 + parseInt(b.time.split(":")[1]);
       return aStart - bStart;
     });
 
     // Update lastEndTime based on existing appointments
     sortedAppointments.forEach((appointment) => {
       const appointmentStart = parseInt(appointment.time.split(":")[0]) * 60 + parseInt(appointment.time.split(":")[1]);
       const appointmentEnd = appointmentStart + appointment.duration;
       if (appointmentEnd > lastEndTime) {
         lastEndTime = appointmentEnd;
       }
     });
     console.log("Calculated lastEndTime:", lastEndTime);
 
     // Create slots from lastEndTime until officeEndTime
     for (let start = lastEndTime; start + totalDuration <= officeEndTime; start += 30) {
       const end = start + totalDuration;
       const slot = {
         start,
         end,
         display: `${formatTime(start)} - ${formatTime(end)}`,
       };
 
       // Check if the slot overlaps any existing appointment
       const overlaps = appointments.some((appointment) => {
         const appointmentStart = parseInt(appointment.time.split(":")[0]) * 60 + parseInt(appointment.time.split(":")[1]);
         const appointmentEnd = appointmentStart + appointment.duration;
         return (start < appointmentEnd && end > appointmentStart);
       });
 
       if (!overlaps) {
         slots.push(slot);
       }
     }
     console.log("Generated time slots:", slots);
     return slots;
   };
 
   // Handle appointment submission
   const handleAppointmentSubmit = async (insuranceData = null) => {
     if (loading) {
       alert("Please wait while we verify your login status.");
       return;
     }
     if (!selectedDate || selectedServices.length === 0) {
       setBookingStatus("Please select a date and at least one service.");
       return;
     }
     if (!currentUser || !currentUser.email) {
       alert("You need to be logged in to book an appointment.");
       return;
     }
 
     // Note: We now always want to ask for insurance on each new booking.
     // So we assume that when the Book Appointment button is clicked,
     // insuranceAsked is reset (see below).
 
     const totalDuration = calculateTotalDuration();
     const availableSlots = generateTimeSlots();
     if (availableSlots.length === 0) {
       setBookingStatus("No available time slots for the selected date.");
       return;
     }
 
     // Use the first available slot
     const selectedTime = availableSlots[0].start;
     const formattedDate = new Date(
       selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000
     )
       .toISOString()
       .split("T")[0];
 
     const appointmentData = {
       userId: currentUser.email,
       date: formattedDate,
       services: selectedServices,
       time: `${Math.floor(selectedTime / 60)}:${selectedTime % 60 === 0 ? "00" : selectedTime % 60}`,
       endTime: `${Math.floor((selectedTime + totalDuration) / 60)}:${(selectedTime + totalDuration) % 60 === 0 ? "00" : (selectedTime + totalDuration) % 60}`,
       duration: totalDuration,
       status: "Pending",
       insurance: hasInsurance ? "Yes" : "No",
     };
     if (insuranceData) {
       try {
         // Sanitize insurance data to remove non-serializable properties
         appointmentData.insuranceDetails = JSON.parse(JSON.stringify(insuranceData));
       } catch (err) {
         console.error("Failed to sanitize insurance data:", err);
       }
     }
     console.log("Booking appointment with data:", appointmentData);
     const appointmentRef = ref(db, `appointments/${formattedDate}`);
     try {
       await push(appointmentRef, appointmentData);
       setBookingStatus("Appointment booked successfully!");
       console.log("Appointment booked successfully!");
       setSelectedServices([]);
       // Reset insurance flags for the next booking attempt
       setInsuranceAsked(false);
       setShowInsuranceForm(false);
       // Re-fetch appointments to update local state with new appointment times
       fetchAppointmentsForDate();
       setTimeout(() => setBookingStatus(""), 3000);
     } catch (error) {
       console.error("Error booking appointment:", error);
       setBookingStatus("Error booking appointment.");
     }
   };
 
   // Handle appointment cancellation and adjust subsequent times
   const handleCancelAppointment = async (id) => {
     if (!window.confirm("Do you want to cancel your appointment?")) return;
 
     const formattedDate = new Date(
       selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000
     )
       .toISOString()
       .split("T")[0];
     const appointmentRef = ref(db, `appointments/${formattedDate}/${id}`);
 
     try {
       await remove(appointmentRef);
       console.log("Appointment removed:", id);
 
       // After removal, update times for remaining appointments
       const updatedRef = ref(db, `appointments/${formattedDate}`);
       onValue(
         updatedRef,
         async (snapshot) => {
           const data = snapshot.val();
           let updatedAppointments = data
             ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
             : [];
 
           // Sort appointments by current start time
           updatedAppointments.sort((a, b) => {
             const aStart = parseInt(a.time.split(":")[0]) * 60 + parseInt(a.time.split(":")[1]);
             const bStart = parseInt(b.time.split(":")[0]) * 60 + parseInt(b.time.split(":")[1]);
             return aStart - bStart;
           });
 
           let lastEndTime = officeStartTime;
           // Update each appointment's start and end times sequentially
           for (const appointment of updatedAppointments) {
             const newStartTime = lastEndTime;
             const newEndTime = newStartTime + appointment.duration;
             const newTimeStr = `${Math.floor(newStartTime / 60)}:${newStartTime % 60 === 0 ? "00" : newStartTime % 60}`;
             const newEndTimeStr = `${Math.floor(newEndTime / 60)}:${newEndTime % 60 === 0 ? "00" : newEndTime % 60}`;
             await update(ref(db, `appointments/${formattedDate}/${appointment.id}`), {
               time: newTimeStr,
               endTime: newEndTimeStr,
             });
             // Update the local appointment object
             appointment.time = newTimeStr;
             appointment.endTime = newEndTimeStr;
             lastEndTime = newEndTime;
           }
           // Re-fetch appointments to ensure local state is current
           fetchAppointmentsForDate();
           console.log("Updated appointments after cancellation:", updatedAppointments);
         },
         { onlyOnce: true }
       );
 
       setBookingStatus("Appointment canceled and times adjusted.");
       console.log("Cancellation complete and times adjusted.");
     } catch (error) {
       console.error("Error canceling appointment:", error);
       setBookingStatus("Error canceling appointment.");
     }
   };
 
   // Insurance handling functions
   const handleInsuranceConfirm = (hasInsurance) => {
     setHasInsurance(hasInsurance);
     setInsuranceAsked(true);
     setShowInsuranceModal(false);
     if (hasInsurance) {
       setShowInsuranceForm(true);
     } else {
       handleAppointmentSubmit();
     }
   };
 
   const handleInsuranceFormSubmit = async (formData) => {
     if (formData) {
       setHasInsurance(true);
     } else {
       setHasInsurance(false);
     }
     setInsuranceAsked(true);
     setShowInsuranceForm(false);
     if (editingAppointmentId) {
       const formattedDate = new Date(
         selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000
       )
         .toISOString()
         .split("T")[0];
       const appointmentRef = ref(db, `appointments/${formattedDate}/${editingAppointmentId}`);
       await update(appointmentRef, { insuranceDetails: formData });
       setEditingAppointmentId(null);
       setInsuranceDetails(null);
     } else {
       handleAppointmentSubmit(formData);
     }
   };
 
   const handleInsuranceClose = () => {
     setHasInsurance(false);
     setInsuranceAsked(true);
     setShowInsuranceForm(false);
     handleAppointmentSubmit();
   };
 
   const handleViewInsuranceDetails = (appointment) => {
     setInsuranceDetails(appointment.insuranceDetails);
     setEditingAppointmentId(appointment.id);
     setShowInsuranceForm(true);
   };

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "30px", padding: "20px" }}>
      <div style={{ width: "350px" }}>
        <h1>Make an Appointment</h1>
        <h2>Select Date:</h2>
        <Calendar onChange={handleDateChange} value={selectedDate} />

        <h2>Select Services:</h2>
        <div>
          <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{ width: "100%" }}>
            {selectedServices.length > 0 ? selectedServices.join(", ") : "Select Services"} {dropdownOpen ? "▲" : "▼"}
          </button>
          {dropdownOpen && (
            <ServicesList selectedServices={selectedServices} toggleService={toggleService} />
          )}
        </div>
        {/* Reset insuranceAsked and show modal on each new booking attempt */}
        <button
          onClick={() => {
            setInsuranceAsked(false);
            setShowInsuranceModal(true);
          }}
          style={{ marginTop: "10px", width: "100%" }}
        >
          Book Appointment
        </button>

        {bookingStatus && (
          <p style={{ textAlign: "center", color: bookingStatus.includes("success") ? "green" : "red" }}>
            {bookingStatus}
          </p>
        )}
      </div>

      <div style={{ width: "400px" }}>
        <h2>Appointments for {selectedDate.toDateString()}</h2>
        <ul style={{ padding: "0", listStyle: "none" }}>
          {appointments.length > 0 &&
            appointments.map((appointment) => (
              <li
                key={appointment.id}
                style={{
                  padding: "10px",
                  border: "1px solid #000",
                  marginBottom: "5px",
                  position: "relative",
                  backgroundColor: appointment.userId === currentUser?.email ? "#e0e0e0" : "transparent",
                }}
              >
                {appointment.userId === currentUser?.email && (
                  <>
                    <button
                      onClick={() => handleCancelAppointment(appointment.id)}
                      style={{
                        position: "absolute",
                        top: "5px",
                        right: "5px",
                        background: "red",
                        color: "white",
                        border: "none",
                        padding: "5px 10px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Cancel
                    </button>
                    {appointment.insuranceDetails && (
                      <button
                        onClick={() => handleViewInsuranceDetails(appointment)}
                        style={{
                          position: "absolute",
                          top: "5px",
                          right: "70px",
                          background: "blue",
                          color: "white",
                          border: "none",
                          padding: "5px 10px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        View Insurance Details
                      </button>
                    )}
                  </>
                )}
                <div>
                  <b>{appointment.date}</b>
                  <br /> {appointment.services.join(", ")}
                  <br />
                  <b>
                    Time:{" "}
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
                  </b>
                  <br />
                  <b>
                    Status:{" "}
                    <span style={{ color: appointment.status === "Confirmed" ? "green" : "orange" }}>
                      {appointment.status}
                    </span>
                  </b>
                  <br />
                  <b>Patient: {appointment.userId}</b>
                </div>
              </li>
            ))}
        </ul>
      </div>

      <Modal
        isOpen={showInsuranceModal}
        onRequestClose={() => setShowInsuranceModal(false)}
        contentLabel="Insurance Modal"
        style={{
          overlay: { backgroundColor: "rgba(0, 0, 0, 0.5)" },
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
        <h2>Do you have insurance?</h2>
        <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
          <button onClick={() => handleInsuranceConfirm(true)} style={{ marginRight: "10px" }}>
            Yes
          </button>
          <button onClick={() => handleInsuranceConfirm(false)}>No</button>
        </div>
      </Modal>

      <Modal
        isOpen={showInsuranceForm}
        onRequestClose={handleInsuranceClose}
        contentLabel="Insurance Form Modal"
        style={{
          overlay: { backgroundColor: "rgba(0, 0, 0, 0.5)" },
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
        <PatientInsuranceForm
          onSubmit={handleInsuranceFormSubmit}
          onClose={handleInsuranceClose}
          initialData={insuranceDetails || {}}
        />
      </Modal>
    </div>
  );
};

export default PatientAppointmentBooking;
