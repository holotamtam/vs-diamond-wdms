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
  const [dentists, setDentists] = useState([]);
  const [selectedDentist, setSelectedDentist] = useState("");
  const [pendingCounts, setPendingCounts] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = location.state?.userRole || "";

  const addNotification = async (uid, message) => {
    const notificationsRef = ref(db, `notifications/${uid}`);
    const newNotification = {
      message,
      timestamp: new Date().toISOString(),
      read: false,
    };

    try {
      const newNotificationRef = await push(notificationsRef, newNotification);
      console.log("Notification added successfully with ID:", newNotificationRef.key);
    } catch (error) {
      console.error("Error adding notification:", error);
    }
  };

  // Fetch dentists from Firebase (Personnel/DentistOwner and Personnel/AssociateDentist)
  useEffect(() => {
    const dentistOwnerRef = ref(db, "users/Personnel/DentistOwner");
    const associateDentistRef = ref(db, "users/Personnel/AssociateDentist");

    Promise.all([
      new Promise((resolve) => {
        onValue(dentistOwnerRef, (snapshot) => {
          const data = snapshot.val();
          const dentistOwners = data
            ? Object.entries(data).map(([id, value]) => ({
                uid: id,
                firstName: value.firstName,
                lastName: value.lastName,
                role: "DentistOwner",
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
                uid: id,
                firstName: value.firstName,
                lastName: value.lastName,
                role: "AssociateDentist",
              }))
            : [];
          resolve(associateDentists);
        });
      }),
    ]).then(([dentistOwners, associateDentists]) => {
      setDentists([...dentistOwners, ...associateDentists]);
    });
  }, []);

  // fetch appointments for the selected date and count pending per dentist
  useEffect(() => {
    if (!selectedDate) return;
    const formattedDate = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
    const appointmentsRef = ref(db, `appointments/${formattedDate}`);

    onValue(appointmentsRef, (snapshot) => {
      const data = snapshot.val();
      const allAppointments = data ? Object.entries(data).map(([id, value]) => ({ id, ...value })) : [];
      setAppointments(allAppointments);

      // Count pending per dentist
      const counts = {};
      allAppointments.forEach((appt) => {
        if (appt.status === "Pending" || appt.status === "New") {
          counts[appt.dentist] = (counts[appt.dentist] || 0) + 1;
        }
      });
      setPendingCounts(counts);
    });
  }, [selectedDate]);

  // Helper to get dentist display name
  const getDentistDisplayName = (dentist) => {
    if (!dentist) return "";
    return `Dr. ${dentist.firstName} ${dentist.lastName}${dentist.role === "DentistOwner" ? " (Owner)" : " (Associate)"}`;
  };

  // Filter appointments by selected dentist
  const filteredAppointments = selectedDentist
    ? appointments.filter((appt) => appt.dentist === selectedDentist)
    : [];

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
      if (appointment && appointment.uid) {
        const message = "Your appointment has been canceled.";
        addNotification(appointment.uid, message);
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
      if (appointment && appointment.uid) {
        const message = "Your appointment has been confirmed.";
        addNotification(appointment.uid, message);
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
      if (appointment && appointment.uid) {
        const message = `Your appointment has been completed. Dentist remarks: '${appointment.dentistRemarks || "No remarks"}'`;
        addNotification(appointment.uid, message);
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

          // Use uid for notification
          if (message && originalAppointment.uid) {
            addNotification(originalAppointment.uid, message);
          }
        }

        if (originalAppointment && originalAppointment.dentistRemarks !== formData.dentistRemarks) {
          const remarksMessage = `Your dentist has updated the remarks for your appointment on ${formattedDate} from ${formattedStartTime} to ${formattedEndTime}: '${formData.dentistRemarks || "No remarks"}'`;
          if (originalAppointment.uid) {
            addNotification(originalAppointment.uid, remarksMessage);
          }
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
      navigate("/dashboard-associatedentist");
    } else if (userRole === "ClinicStaff") {
      navigate("/dashboard-clinicstaff");
    } else {
      alert("Unable to determine your role. Redirecting to the home page.");
      navigate("/");
    }
  };

  // Check if any dentist has pending/new appointments
  const anyDentistHasPending = Object.values(pendingCounts).some((count) => count > 0);

  // Get symbol for the selected dentist if they have pending/new appointments
  const selectedDentistHasPending = pendingCounts[selectedDentist] > 0;

  return (
    <div>
      <button onClick={handleGoBack}>Go Back to Dashboard</button>
      <div style={{ padding: "20px" }}>
        <h1>Manage Appointments</h1>
        <h2>Select Date:</h2>
        <Calendar onChange={handleDateChange} value={selectedDate} />

        <h2>
          Select Dentist:
        </h2>
        <select
          value={selectedDentist}
          onChange={(e) => setSelectedDentist(e.target.value)}
          style={{
            borderColor: selectedDentistHasPending ? "red" : undefined,
            fontWeight: selectedDentistHasPending ? "bold" : undefined,
            //color: selectedDentistHasPending ? "red" : undefined,
          }}
        >
          <option value="">
            -- Select Dentist --
            {anyDentistHasPending ? " 🔴" : ""}
          </option>
          {dentists.map((dentist) => {
            const displayName = getDentistDisplayName(dentist);
            const hasPending = pendingCounts[displayName] > 0;
            return (
              <option
                key={dentist.uid}
                value={displayName}
                style={{
                  color: hasPending ? "red" : undefined,
                  fontWeight: hasPending ? "bold" : undefined,
                }}
              >
                {displayName}
                {hasPending ? " 🔴" : ""}
              </option>
            );
          })}
        </select>

        <h2>
          Appointments for {selectedDate.toDateString()}
          {selectedDentist && ` - ${selectedDentist}`}
        </h2>
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
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment) => (
                <tr
                  key={appointment.id}
                  style={{
                    background:
                      appointment.status === "Pending" || appointment.status === "New"
                        ? "#fff3cd"
                        : "transparent",
                  }}
                >
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
                  <td style={{ border: "1px solid black", padding: "10px" }}>{appointment.services && Array.isArray(appointment.services) ? appointment.services.join(", ") : ""}</td>
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
                          : appointment.status === "Pending" || appointment.status === "New"
                          ? "#b8860b"
                          : "orange",
                      fontWeight:
                        appointment.status === "Pending" || appointment.status === "New"
                          ? "bold"
                          : undefined,
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
                  No appointments found for this dentist on this date.
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