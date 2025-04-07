import React from "react";

const TreatmentHistory = ({ appointments, handleViewInsuranceDetails }) => {
  // Function to format time in 12-hour format
  const formatTime = (minutes) => {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    const formattedMinute = minute < 10 ? `0${minute}` : minute;
    return `${formattedHour}:${formattedMinute} ${ampm}`;
  };
  
  // Function to parse time string (HH:MM) to total minutes
  const parseTimeToMinutes = (time) => {
    if (!time || typeof time !== "string" || !time.includes(":")) return null;
    const [hourStr, minuteStr] = time.split(":");
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (isNaN(hour) || isNaN(minute)) return null;
    return hour * 60 + minute;
  };

  return (
    <div>
      <h2>Treatment History</h2>
      {appointments.length === 0 ? (
        <p>No completed appointments.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {appointments.map((appointment) => {
            const startMinutes = parseTimeToMinutes(appointment.time);
            const duration = appointment.duration || 0;
            const endMinutes = startMinutes !== null ? startMinutes + duration : null;

            return (
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
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <p><strong>Date:</strong> {appointment.date}</p>
                  <p>
                    <strong>Time:</strong>{" "}
                    {startMinutes !== null ? formatTime(startMinutes) : "N/A"} -{" "}
                    {endMinutes !== null ? formatTime(endMinutes) : "N/A"}
                  </p>
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TreatmentHistory;
