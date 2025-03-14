import React from "react";

const TreatmentHistory = ({ appointments, handleViewInsuranceDetails }) => {
  const formatTime = (time) => {
    const [hour, minute] = time.split(":").map(Number);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    const formattedMinute = minute < 10 ? `0${minute}` : minute;
    return `${formattedHour}:${formattedMinute} ${ampm}`;
  };

  return (
    <div>
      <h2>Treatment History</h2>
      {appointments.length === 0 ? (
        <p>No completed appointments.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                background: "#f9f9f9",
              }}
            >
              {/* First Row: Horizontal Layout */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <p><strong>Date:</strong> {appointment.date}</p>
                <p><strong>Time:</strong> {formatTime(appointment.time)} - {formatTime(appointment.endTime)}</p>
                <p><strong>Services:</strong> {appointment.services.join(", ")}</p>
                <p><strong>Bill:</strong> {appointment.bill}</p>
                <button
                  onClick={() => handleViewInsuranceDetails(appointment)}
                  style={{
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
              </div>

              {/* Second Row: Dentist Remarks Below */}
              <div style={{ marginTop: "-4px", padding: "0" }}>
                <p style={{ margin: "0", marginBottom: "16px", padding: "0", lineHeight: "1" }}>
                  <strong>Dentist Remarks:</strong> {appointment.dentistRemarks}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TreatmentHistory;