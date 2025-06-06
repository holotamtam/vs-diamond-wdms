import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { db, auth } from "../../backend/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, set, onValue } from "firebase/database";
import Modal from "react-modal";
import { Link, useNavigate } from "react-router-dom";
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
  const [userDetails, setUserDetails] = useState(null);
  const navigate = useNavigate();

  // Check if user is authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user ? user : null);
    });
    return () => unsubscribe();
  }, []);

  // Fetch appointments for the selected date
  useEffect(() => {
    if (!selectedDate) return;
    fetchAppointmentsForDate();
  }, [selectedDate]);

  // Fetch dentists
  useEffect(() => {
    fetchDentists();
  }, []);

  // Fetch appointments for the selected date
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

  // Fetch user details for sidebar profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const usersRef = ref(db, "users/Patient");
        onValue(usersRef, (snapshot) => {
          if (snapshot.exists()) {
            const users = snapshot.val();
            const userData = Object.values(users).find((u) => u.uid === user.uid);
            if (userData) setUserDetails(userData);
          }
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch dentists from Firebase
  const fetchDentists = () => {
    const dentistOwnerRef = ref(db, "users/Personnel/DentistOwner");
    const associateDentistRef = ref(db, "users/Personnel/AssociateDentist");

    Promise.all([
      new Promise((resolve) => {
        onValue(dentistOwnerRef, (snapshot) => {
          const data = snapshot.val();
          const dentistOwners = data
            ? Object.entries(data).map(([id, value]) => ({
                id,
                name: `Dr. ${value.firstName} ${value.lastName} (Owner)`,
              }))
            : [];
          resolve(dentistOwners);
        });
      }),
      new Promise((resolve) => {
        onValue(associateDentistRef, (snapshot) => {
          const data = snapshot.val();
          const associateDentists = data
            ? Object.entries(data).map(([id, value]) => ({
                id,
                name: `Dr. ${value.firstName} ${value.lastName} (Associate)`,
              }))
            : [];
          resolve(associateDentists);
        });
      }),
    ]).then(([dentistOwners, associateDentists]) => {
      setDentists([...dentistOwners, ...associateDentists]);
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

  // Updated: Time slot logic to allow selection if any dentist is available
  const generateTimeSlots = () => {
    const officeStartTime = 9 * 60; // 9:00 AM in minutes
    const officeEndTime = 17 * 60; // 5:00 PM in minutes
    const totalDuration = 60; // fixed duration of 1 hour for all services (temporary)
    const slots = [];

    for (let start = officeStartTime; start + totalDuration <= officeEndTime; start += 30) {
      const end = start + totalDuration;

      // Check if current user already has an appointment at this time
      const userHasAppointment = appointments.some((appointment) => {
        if (!currentUser) return false;
        if (appointment.uid !== currentUser.uid) return false;
        const appointmentStart =
          parseInt(appointment.time.split(":")[0]) * 60 +
          parseInt(appointment.time.split(":")[1]);
        const appointmentEnd = appointmentStart + appointment.duration;
        return start < appointmentEnd && end > appointmentStart;
      });

      // Find dentists who are available for this slot
      const availableDentists = dentists.filter((dentist) => {
        const dentistAppointments = appointments.filter(
          (appointment) => appointment.dentist === dentist.name
        );
        const hasOverlap = dentistAppointments.some((appointment) => {
          const appointmentStart =
            parseInt(appointment.time.split(":")[0]) * 60 +
            parseInt(appointment.time.split(":")[1]);
          const appointmentEnd = appointmentStart + appointment.duration;
          return start < appointmentEnd && end > appointmentStart;
        });
        return !hasOverlap;
      });

      let isAvailable = false;
      let slotStatus = "available";
      if (userHasAppointment) {
        isAvailable = false;
        slotStatus = "your";
      } else if (selectedDentist) {
        isAvailable = availableDentists.some((dentist) => dentist.name === selectedDentist);
        if (!isAvailable) slotStatus = "reserved";
      } else {
        isAvailable = availableDentists.length > 0;
        if (!isAvailable) slotStatus = "reserved";
      }

      slots.push({
        start,
        end,
        display: `${formatTime(start)} - ${formatTime(end)}`,
        isAvailable,
        availableDentists,
        slotStatus, // "available", "your", or "reserved"
      });
    }
    return slots;
  };

  // Updated: Allow booking if a slot is available, even if no dentist is selected
  const handleAppointmentSubmit = () => {
    if (!selectedDate || selectedServices.length === 0 || !selectedTimeSlot) {
      setBookingStatus("Please select a date, services, and time slot.");
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

  // Updated: Assign a random available dentist if none selected
  const submitAppointment = async (hasInsurance, insuranceDetails = null) => {
    const formattedDate = new Date(
      selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000
    )
      .toISOString()
      .split("T")[0];

    const appointmentId = `${currentUser.uid}_${Date.now()}`;

    let assignedDentist = selectedDentist;
    if (!assignedDentist) {
      const slot = generateTimeSlots().find(
        (slot) => slot.start === selectedTimeSlot.start && slot.end === selectedTimeSlot.end
      );
      if (slot && slot.availableDentists.length > 0) {
        const randomIndex = Math.floor(Math.random() * slot.availableDentists.length);
        assignedDentist = slot.availableDentists[randomIndex].name;
      } else {
        setBookingStatus("No available dentist for the selected time slot.");
        return;
      }
    }

    const appointmentData = {
      email: currentUser.email,
      uid: currentUser.uid,
      date: formattedDate,
      services: selectedServices,
      time: `${Math.floor(selectedTimeSlot.start / 60)}:${selectedTimeSlot.start % 60 === 0 ? "00" : selectedTimeSlot.start % 60}`,
      duration: 60,
      dentist: assignedDentist,
      status: "Pending",
      insuranceDetails: hasInsurance ? insuranceDetails : "No",
      id: appointmentId,
    };

    const appointmentRef = ref(db, `appointments/${formattedDate}/${appointmentId}`);
    try {
      await set(appointmentRef, appointmentData);
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

  // Handle logout
  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate("/", { replace: true });
    });
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div
        style={{
          width: "250px",
          background: "#f4f4f4",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          borderRight: "1px solid #ddd",
        }}
      >
        <div>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li style={{ marginBottom: "20px" }}>
              <Link
                to="/dashboard-patient"
                style={{
                  textDecoration: "none",
                  color: "#333",
                }}
              >
                Dashboard
              </Link>
            </li>
            <li style={{ marginBottom: "20px" }}>
              <Link to="/treatment-history" style={{ textDecoration: "none", color: "#333" }}>
                Treatment History
              </Link>
            </li>
            <li style={{ marginBottom: "20px" }}>
              <Link to="/settings" style={{ textDecoration: "none", color: "#333" }}>
                Settings
              </Link>
            </li>
          </ul>
        </div>
        <div>
          {userDetails && (
            <div style={{ display: "flex", alignItems: "center", marginBottom: "30px" }}>
              <img
                src={userDetails.profilePictureUrl || "https://via.placeholder.com/50"}
                alt="Profile"
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #ddd",
                  marginRight: "10px",
                }}
              />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span style={{ fontWeight: "bold", fontSize: "15px", textAlign: "left" }}>
                  {userDetails.firstName} {userDetails.middleName} {userDetails.lastName}
                </span>
                <span style={{ fontSize: "13px", color: "#555", textAlign: "left" }}>
                  {userDetails.email}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              background: "#f44336",
              color: "white",
              border: "none",
              padding: "10px",
              cursor: "pointer",
              borderRadius: "5px",
              width: "100%",
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "row", gap: "40px" }}>
        {/* Left column: appointment form and summary */}
        <div style={{ width: "350px", minWidth: "300px" }}>
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
            onChange={(e) => {
              setSelectedDentist(e.target.value);
              setSelectedTimeSlot(null); // Reset time slot when dentist changes
            }}
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
            <p><strong>Dentist:</strong> {selectedDentist || (selectedTimeSlot && !selectedDentist ? "Auto-assign" : "Not selected")}</p>
          </div>
        </div>

        {/* Right column: table */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2>Available Time Slots:</h2>
          <div style={{ width: "100%", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid black", padding: "10px" }}>Time Slot</th>
                  <th style={{ border: "1px solid black", padding: "10px" }}>Select</th>
                </tr>
              </thead>
              <tbody>
                {generateTimeSlots().map((slot, index) => (
                  <tr
                    key={index}
                    style={{
                      background: selectedTimeSlot === slot ? "#e0f7fa" : "transparent",
                    }}
                  >
                    <td style={{ border: "1px solid black", padding: "10px" }}>{slot.display}</td>
                    <td style={{ border: "1px solid black", padding: "10px", textAlign: "center" }}>
                      {slot.isAvailable ? (
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
                      ) : slot.slotStatus === "your" ? (
                        <span style={{ color: "#2196F3", fontWeight: "bold" }}>Your Appointment</span>
                      ) : (
                        <span style={{ color: "#888" }}>Reserved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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