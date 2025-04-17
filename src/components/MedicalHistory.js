import React, { useState, useEffect } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "../backend/firebaseConfig";

const MedicalHistory = ({ patientId }) => {

// State variables
const [medicalData, setMedicalData] = useState({
allergies: "",
medications: "",
pastIllnesses: "",
others: "",
});

const [editing, setEditing] = useState(false);

// Fetching medical history from Firebase
useEffect(() => {
    if (patientId) {
        const historyRef = ref(db, `users/Patient/${patientId}/medicalHistory`);
        onValue(historyRef, (snapshot) => {
            if (snapshot.exists()) {
                setMedicalData(snapshot.val());
            }
        });
    }
}, [patientId]);

// Handling input changes
const handleChange = (e) => {
    const { name, value } = e.target;
    setMedicalData((prev) => ({
        ...prev,
        [name]: value,
    }));
};

// Saving medical history to Firebase
const handleSave = async () => {
try {
    await set(ref(db, `users/Patient/${patientId}/medicalHistory`), medicalData);
    alert("Medical history saved successfully!");
    setEditing(false);
} catch (error) {
    console.error("Error saving medical history:", error);
    alert("Failed to save medical history.");
}
};

  return (
    <div>
      {editing ? (
        <div>
          <div>
            <label><strong>Allergies:</strong></label><br />
            <textarea name="allergies" value={medicalData.allergies} onChange={handleChange} />
          </div>
          <div>
            <label><strong>Medications:</strong></label><br />
            <textarea name="medications" value={medicalData.medications} onChange={handleChange} />
          </div>
          <div>
            <label><strong>Past Illnesses:</strong></label><br />
            <textarea name="pastIllnesses" value={medicalData.pastIllnesses} onChange={handleChange} />
          </div>
          <div>
            <label><strong>Others:</strong></label><br />
            <textarea name="others" value={medicalData.others} onChange={handleChange} />
          </div>
          <button onClick={handleSave} style={{ marginTop: "10px" }}>Save</button>
        </div>
      ) : (
        <div>
          <p><strong>Allergies:</strong> {medicalData.allergies || "None"}</p>
          <p><strong>Medications:</strong> {medicalData.medications || "None"}</p>
          <p><strong>Past Illnesses:</strong> {medicalData.pastIllnesses || "None"}</p>
          <p><strong>Others:</strong> {medicalData.others || "None"}</p>
          <button onClick={() => setEditing(true)} style={{ marginTop: "10px" }}>Edit</button>
        </div>
      )}
    </div>
  );
};

export default MedicalHistory;