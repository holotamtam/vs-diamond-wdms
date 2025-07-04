import React, { useState } from "react";
import { ref, set } from "firebase/database";
import { db } from "../backend/firebaseConfig";

const parseTimeToMinutes = (time) => {
  if (!time || typeof time !== "string" || !time.includes(":")) return null;
  const [hourStr, minuteStr] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (isNaN(hour) || isNaN(minute)) return null;
  return hour * 60 + minute;
};
const formatTime = (minutes) => {
  if (minutes === null || minutes === undefined) return "";
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const ampm = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;
  const formattedMinute = minute < 10 ? `0${minute}` : minute;
  return `${formattedHour}:${formattedMinute} ${ampm}`;
};

const PersonnelTreatmentHistoryModal = ({ appointments, onClose, handleViewInsuranceDetails, patientName, patientUid, onRemarksSaved }) => {
  // Group appointments by month and year
  const groupedAppointments = {};
  appointments.forEach((appt) => {
    if (!appt.date) return;
    const dateObj = new Date(appt.date);
    const month = dateObj.toLocaleString("default", { month: "long" });
    const year = dateObj.getFullYear();
    const key = `${year}-${month}`;
    if (!groupedAppointments[key]) groupedAppointments[key] = [];
    groupedAppointments[key].push(appt);
  });
  // Sort months: latest first
  const sortedMonthKeys = Object.keys(groupedAppointments).sort((a, b) => {
    const [yearA, monthA] = a.split("-");
    const [yearB, monthB] = b.split("-");
    const dateA = new Date(`${monthA} 1, ${yearA}`);
    const dateB = new Date(`${monthB} 1, ${yearB}`);
    return dateB - dateA;
  });

  const [selectedTreatment, setSelectedTreatment] = useState(
    appointments.length > 0 ? appointments[0] : null
  );
  const [remarks, setRemarks] = useState(selectedTreatment?.remarks || selectedTreatment?.dentistRemarks || "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const isSavingRef = React.useRef(false);

  // Update remarks when selected treatment changes
  React.useEffect(() => {
    setRemarks(selectedTreatment?.remarks || selectedTreatment?.dentistRemarks || "");
    // Only clear message if we're not in the middle of a save operation
    if (!isSavingRef.current) {
      setSaveMsg("");
    }
  }, [selectedTreatment]);

  // Save remarks to Firebase
  const handleSaveRemarks = async () => {
    if (!selectedTreatment || !patientUid) return;
    setSaving(true);
    isSavingRef.current = true;
    try {
      // Find the appointment in Firebase by date and id
      const apptDate = selectedTreatment.date;
      const apptId = selectedTreatment.id;
      const apptRef = ref(db, `appointments/${apptDate}/${apptId}/remarks`);
      await set(apptRef, remarks);
      setSaveMsg("Remarks saved!");
      setTimeout(() => {
        setSaveMsg("");
        isSavingRef.current = false;
      }, 2500);
      // Notify parent to update local state
      if (onRemarksSaved) {
        onRemarksSaved({ id: apptId, date: apptDate, remarks });
      }
      setSelectedTreatment({ ...selectedTreatment, remarks });
    } catch (error) {
      console.error('Error saving remarks:', error); // Debug log
      setSaveMsg("Failed to save remarks.");
      isSavingRef.current = false;
    }
    setSaving(false);
  };

  return (
    <div style={{ maxHeight: '80vh', overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky Header Row */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #eee',
        padding: '12px 16px 12px 16px',
        minHeight: 36,
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        marginBottom: 18,
      }}>
        <button onClick={onClose} style={{ background: '#f44336', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 600, fontSize: 15, cursor: 'pointer', zIndex: 10 }}>Close</button>
        <h3 style={{ margin: 0, fontWeight: 700, fontSize: 19, color: '#3d342b', letterSpacing: 0.5, flex: 1, textAlign: 'center' }}>
          Treatment History for {patientName}
        </h3>
        <div style={{ width: 70 }} /> {/* Spacer to balance close button */}
      </div>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", alignItems: "flex-start", padding: "0", minHeight: 500 }}>
        {/* Left: List of Treatments */}
        <div style={{
          flex: 2,
          minWidth: 0,
          background: "#f5f2ed",
          borderRadius: 24,
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          padding: "32px 32px 32px 32px",
          marginLeft: 20,
          marginRight: 0,
          overflow: "hidden",
          border: "1px solid #ede7df"
        }}>
          {sortedMonthKeys.length === 0 ? (
            <p style={{ textAlign: "center" }}>No treatment history found.</p>
          ) : (
            <div>
              {sortedMonthKeys.map((monthKey) => (
                <div key={monthKey} style={{ marginBottom: "30px" }}>
                  <h2 style={{
                    borderBottom: "1px solid #ddd",
                    paddingBottom: "8px",
                    color: "#333",
                    textAlign: "left",
                    fontSize: "20px"
                  }}>
                    {monthKey}
                  </h2>
                  <div>
                    {groupedAppointments[monthKey]
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((appt) => {
                        const isSelected = selectedTreatment === appt;
                        return (
                          <div
                            key={appt.id}
                            style={{
                              border: "1px solid #e0e0e0",
                              borderRadius: isSelected ? 12 : 8,
                              padding: "16px",
                              marginBottom: "16px",
                              background: isSelected ? "#393737" : "#f9f6f2",
                              color: isSelected ? "#fff" : "#222",
                              fontWeight: isSelected ? 600 : 500,
                              fontSize: "16px",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              boxShadow: isSelected
                                ? "0 0 0 2px #393737"
                                : "0 1px 2px rgba(0,0,0,0.03)",
                              outline: isSelected ? "2px solid #393737" : "none",
                            }}
                            onClick={() => setSelectedTreatment(appt)}
                          >
                            <div style={{ fontWeight: 600, fontSize: "16px", marginBottom: "8px" }}>
                              {appt.services || "Service"}
                            </div>
                            <div style={{ fontSize: "15px" }}>
                              <div>
                                <span style={{ fontWeight: 500 }}>Date:</span>{" "}
                                {appt.date ? new Date(appt.date).toLocaleDateString() : "N/A"}
                              </div>
                              <div>
                                <span style={{ fontWeight: 500 }}>Time:</span>{" "}
                                {(() => {
                                  if (appt.startTime) {
                                    const start = parseTimeToMinutes(appt.startTime);
                                    const end = appt.endTime
                                      ? parseTimeToMinutes(appt.endTime)
                                      : appt.duration
                                        ? start + Number(appt.duration)
                                        : null;
                                    return end !== null
                                      ? `${formatTime(start)} - ${formatTime(end)}`
                                      : formatTime(start);
                                  } else if (appt.time) {
                                    const start = parseTimeToMinutes(appt.time);
                                    const end = appt.duration
                                      ? start + Number(appt.duration)
                                      : null;
                                    return end !== null
                                      ? `${formatTime(start)} - ${formatTime(end)}`
                                      : start !== null
                                        ? formatTime(start)
                                        : "N/A";
                                  } else {
                                    return "N/A";
                                  }
                                })()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Right: Treatment Details */}
        <div style={{
          flex: 1,
          minWidth: 380,
          maxWidth: 440,
          padding: "0",
          background: "transparent",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          marginRight: 20
        }}>
          <div style={{
            width: 420,
            background: "#f9f6f2",
            borderRadius: 22,
            boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
            padding: 32,
            marginTop: 0,
            border: '1px solid #ede7df',
            minHeight: 420
          }}>
            {selectedTreatment ? (
              <>
                {/* Editable Remarks */}
                <div style={{ marginBottom: "32px" }}>
                  <span style={{ fontWeight: "bold", fontSize: "19px", color: "#333", display: "block", marginBottom: "15px" }}>Remarks</span>
                  <textarea
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    rows={3}
                    style={{ width: "100%", fontSize: 15, padding: 8, borderRadius: 6, border: '1px solid #ccc', resize: 'vertical' }}
                    placeholder="Enter remarks..."
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                    <button
                      onClick={handleSaveRemarks}
                      disabled={saving}
                      style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
                    >
                      {saving ? 'Saving...' : 'Save Remarks'}
                    </button>
                    {saveMsg && (
                      <div style={{
                        background: saveMsg === 'Remarks saved!' ? '#4caf50' : '#f44336',
                        color: '#fff',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontWeight: 600,
                        fontSize: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        minWidth: 120,
                        maxWidth: 200,
                      }}>
                        {saveMsg}
                        <button 
                          onClick={() => {
                            setSaveMsg("");
                            isSavingRef.current = false;
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#fff',
                            fontSize: 14,
                            cursor: 'pointer',
                            padding: '0 4px',
                            borderRadius: '50%',
                            width: 16,
                            height: 16,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            marginLeft: 'auto'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <hr style={{ border: 'none', borderBottom: '1px solid #eee', margin: '0 0 32px 0' }} />
                {/* Details */}
                <div style={{ marginBottom: "32px" }}>
                  <span style={{ fontWeight: "bold", fontSize: "19px", color: "#333", display: "block", marginBottom: "15px" }}>Details</span>
                  <div>
                    <div style={{ marginBottom: "10px" }}>
                      <span style={{ fontWeight: "bold" }}>Service:</span> {selectedTreatment.services || "Service"}
                    </div>
                    <div style={{ marginBottom: "10px" }}>
                      <span style={{ fontWeight: "bold" }}>Date:</span> {selectedTreatment.date ? new Date(selectedTreatment.date).toLocaleDateString() : "N/A"}
                    </div>
                    <div style={{ marginBottom: "10px" }}>
                      <span style={{ fontWeight: "bold" }}>Time:</span>{" "}
                      {(() => {
                        if (selectedTreatment.startTime) {
                          const start = parseTimeToMinutes(selectedTreatment.startTime);
                          const end = selectedTreatment.endTime
                            ? parseTimeToMinutes(selectedTreatment.endTime)
                            : selectedTreatment.duration
                              ? start + Number(selectedTreatment.duration)
                              : null;
                          return end !== null
                            ? `${formatTime(start)} - ${formatTime(end)}`
                            : formatTime(start);
                        } else if (selectedTreatment.time) {
                          const start = parseTimeToMinutes(selectedTreatment.time);
                          const end = selectedTreatment.duration
                            ? start + Number(selectedTreatment.duration)
                            : null;
                          return end !== null
                            ? `${formatTime(start)} - ${formatTime(end)}`
                            : start !== null
                              ? formatTime(start)
                              : "N/A";
                        } else {
                          return "N/A";
                        }
                      })()}
                    </div>
                    <div style={{ marginBottom: "10px" }}>
                      <span style={{ fontWeight: "bold" }}>Dentist:</span> {selectedTreatment.dentist || "N/A"}
                    </div>
                  </div>
                </div>
                <hr style={{ border: 'none', borderBottom: '1px solid #eee', margin: '0 0 32px 0' }} />
                {/* Invoice */}
                <div style={{ marginBottom: "32px" }}>
                  <span style={{ fontWeight: "bold", fontSize: "19px", color: "#333", display: "block", marginBottom: "15px" }}>Invoice</span>
                  <div>
                    <div style={{ marginBottom: "10px" }}>
                      <span style={{ fontWeight: "bold" }}>Bill:</span> {selectedTreatment.bill ? `₱${selectedTreatment.bill}` : "N/A"}
                    </div>
                    <div style={{ marginBottom: "10px" }}>
                      <span style={{ fontWeight: "bold" }}>Payment Method:</span> {selectedTreatment.paymentMethod || "N/A"}
                    </div>
                  </div>
                </div>
                <hr style={{ border: 'none', borderBottom: '1px solid #eee', margin: '0 0 32px 0' }} />
                {/* Images (placeholder) */}
                <div style={{ marginBottom: "32px" }}>
                  <span style={{ fontWeight: "bold", fontSize: "19px", color: "#333", display: "block", marginBottom: "15px" }}>Images</span>
                  <div>
                    <button
                      style={{
                        background: "#007BFF",
                        color: "white",
                        border: "none",
                        padding: "8px 18px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "15px",
                        fontWeight: "bold"
                      }}
                      onClick={() => alert("View Image temporary rani")}
                    >
                      View Image
                    </button>
                  </div>
                </div>
                {selectedTreatment.insuranceDetails && (
                  <>
                    <hr style={{ border: 'none', borderBottom: '1px solid #eee', margin: '0 0 32px 0' }} />
                    {/* View Insurance */}
                    <div style={{ marginBottom: "16px" }}>
                      <span style={{ fontWeight: "bold", fontSize: "19px", color: "#333", display: "block", marginBottom: "15px" }}>Insurance</span>
                      <div>
                        <button
                          onClick={() => handleViewInsuranceDetails(selectedTreatment)}
                          style={{
                            background: "#007BFF",
                            color: "white",
                            border: "none",
                            padding: "8px 18px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "15px",
                            fontWeight: "bold"
                          }}
                        >
                          View Insurance
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div style={{ color: "#888", textAlign: "center", marginTop: "40px" }}>
                Select a treatment to view details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonnelTreatmentHistoryModal; 