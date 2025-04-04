import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { db, auth } from "../../backend/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { ref, push, onValue } from "firebase/database";
import Modal from "react-modal";
import ServicesList from "../../components/ServicesList";
import PatientInsuranceForm from "./PatientInsuranceForm";

Modal.setAppElement("#root");

const PatientAppointmentBooking = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedServices, setSelectedServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bookingStatus, setBookingStatus] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [dentists, setDentists] = useState([]);
  const [selectedDentist, setSelectedDentist] = useState("");
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user ? user : null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    fetchAppointmentsForDate();
  }, [selectedDate]);

  useEffect(() => {
    fetchDentists();
  }, []);

  const fetchAppointmentsForDate = () => {
    const formattedDate = new Date(
      selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000
    )
      .toISOString()
      .split("T")[0];
    const appointmentsRef = ref(db, `appointments/${formattedDate}`);
    onValue(appointmentsRef, (snapshot) => {
      const data = snapshot.val();
      const fetched = data
        ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
        : [];
      setAppointments(fetched);
    });
  };

  const fetchDentists = () => {
    const dentistsRef = ref(db, "users/Personnel/Dentist");
    onValue(dentistsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const dentistList = Object.entries(data).map(([id, value]) => ({
          id,
          name: `Dr. ${value.firstName} ${value.lastName}`,
        }));
        setDentists(dentistList);
      }
    });
  };

  const toggleService = (service) => {
    setSelectedServices((prevSelected) =>
      prevSelected.includes(service)
        ? prevSelected.filter((s) => s !== service)
        : [...prevSelected, service]
    );
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = mins < 10 ? `0${mins}` : mins;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  const generateTimeSlots = () => {
    const officeStartTime = 9 * 60; // 9:00 AM in minutes
    const officeEndTime = 17 * 60; // 5:00 PM in minutes
    const totalDuration = 60; // Fixed duration of 1 hour for all services
    const slots = [];

    for (let start = officeStartTime; start + totalDuration <= officeEndTime; start += 30) {
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
        return start < appointmentEnd && end > appointmentStart;
      });

      if (!overlaps) {
        slots.push(slot);
      }
    }
    return slots;
  };

  const handleAppointmentSubmit = () => {
    if (!selectedDate || selectedServices.length === 0 || !selectedTimeSlot || !selectedDentist) {
      setBookingStatus("Please select a date, services, time slot, and dentist.");
      return;
    }

    setShowInsuranceModal(true);
  };

  const confirmInsuranceAndSubmit = (insuranceStatus) => {
    setShowInsuranceModal(false);

    if (insuranceStatus) {
      setShowInsuranceForm(true);
    } else {
      submitAppointment(false);
    }
  };

  const handleInsuranceFormSubmit = (insuranceDetails) => {
    setShowInsuranceForm(false);
    submitAppointment(true, insuranceDetails);
  };

  const submitAppointment = async (hasInsurance, insuranceDetails = null) => {
    const formattedDate = new Date(
      selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000
    )
      .toISOString()
      .split("T")[0];

    const appointmentData = {
      userId: currentUser.email,
      date: formattedDate,
      services: selectedServices,
      time: `${Math.floor(selectedTimeSlot.start / 60)}:${selectedTimeSlot.start % 60 === 0 ? "00" : selectedTimeSlot.start % 60}`,
      duration: 60,
      dentist: selectedDentist,
      status: "Pending",
      insuranceDetails: hasInsurance ? insuranceDetails : "No",
    };

    const appointmentRef = ref(db, `appointments/${formattedDate}`);
    try {
      await push(appointmentRef, appointmentData);
      setBookingStatus("Appointment booked successfully!");
      setSelectedServices([]);
      setSelectedTimeSlot(null);
      setSelectedDentist("");
      fetchAppointmentsForDate();
    } catch (error) {
      console.error("Error booking appointment:", error);
      setBookingStatus("Error booking appointment.");
    }
  };

  return (
    <div>
      <button>
        <a href="/DashboardPatient">Go Back to Dashboard</a>
      </button>
      <div style={{ display: "flex", justifyContent: "center", gap: "30px", padding: "20px" }}>
        <div style={{ width: "350px" }}>
          <h1>Make an Appointment</h1>
          <h2>Select Date:</h2>
          <Calendar onChange={setSelectedDate} value={selectedDate} />

          <h2>Select Services:</h2>
          <div>
            <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{ width: "100%" }}>
              {selectedServices.length > 0 ? selectedServices.join(", ") : "Select Services"} {dropdownOpen ? "▲" : "▼"}
            </button>
            {dropdownOpen && (
              <ServicesList selectedServices={selectedServices} toggleService={toggleService} />
            )}
          </div>

          <h2>Select Dentist:</h2>
          <select
            value={selectedDentist}
            onChange={(e) => setSelectedDentist(e.target.value)}
            style={{ width: "100%", padding: "10px", marginTop: "10px" }}
          >
            <option value="">Select a Dentist</option>
            {dentists.map((dentist) => (
              <option key={dentist.id} value={dentist.name}>
                {dentist.name}
              </option>
            ))}
          </select>

          <div style={{ border: "1px solid #ddd", padding: "10px", borderRadius: "5px", marginTop: "20px" }}>
            <h2>Appointment Summary</h2>
            <p><strong>Date:</strong> {selectedDate ? selectedDate.toDateString() : "Not selected"}</p>
            <p><strong>Services:</strong> {selectedServices.length > 0 ? selectedServices.join(", ") : "Not selected"}</p>
            <p><strong>Time Slot:</strong> {selectedTimeSlot ? selectedTimeSlot.display : "Not selected"}</p>
            <p><strong>Dentist:</strong> {selectedDentist || "Not selected"}</p>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h2>Available Time Slots:</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid black", padding: "10px" }}>Time Slot</th>
                <th style={{ border: "1px solid black", padding: "10px" }}>Select</th>
              </tr>
            </thead>
            <tbody>
              {generateTimeSlots().map((slot, index) => (
                <tr key={index}>
                  <td style={{ border: "1px solid black", padding: "10px" }}>{slot.display}</td>
                  <td style={{ border: "1px solid black", padding: "10px", textAlign: "center" }}>
                    <button
                      onClick={() => setSelectedTimeSlot(slot)}
                      style={{
                        background: selectedTimeSlot === slot ? "#4CAF50" : "#007BFF",
                        color: "white",
                        border: "none",
                        padding: "5px 10px",
                        cursor: "pointer",
                        borderRadius: "5px",
                      }}
                    >
                      {selectedTimeSlot === slot ? "Selected" : "Select"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={handleAppointmentSubmit}
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
      </div>

      <Modal
        isOpen={showInsuranceModal}
        onRequestClose={() => setShowInsuranceModal(false)}
        contentLabel="Insurance Confirmation Modal"
        style={{
          overlay: { backgroundColor: "rgba(0, 0, 0, 0.5)" },
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            padding: "20px",
            borderRadius: "10px",
          },
        }}
      >
        <h2>Do you have insurance?</h2>
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: "20px" }}>
          <button
            onClick={() => confirmInsuranceAndSubmit(true)}
            style={{
              background: "#4CAF50",
              color: "white",
              border: "none",
              padding: "10px 20px",
              cursor: "pointer",
              borderRadius: "5px",
            }}
          >
            Yes
          </button>
          <button
            onClick={() => confirmInsuranceAndSubmit(false)}
            style={{
              background: "#F44336",
              color: "white",
              border: "none",
              padding: "10px 20px",
              cursor: "pointer",
              borderRadius: "5px",
            }}
          >
            No
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showInsuranceForm}
        onRequestClose={() => setShowInsuranceForm(false)}
        contentLabel="Patient Insurance Form"
        style={{
          overlay: { backgroundColor: "rgba(0, 0, 0, 0.5)" },
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            padding: "20px",
            borderRadius: "10px",
          },
        }}
      >
        <PatientInsuranceForm
          onSubmit={handleInsuranceFormSubmit}
          onClose={() => setShowInsuranceForm(false)}
        />
      </Modal>
    </div>
  );
};

export default PatientAppointmentBooking;