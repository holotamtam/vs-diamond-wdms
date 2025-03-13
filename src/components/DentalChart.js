import React, { useState, useEffect } from "react";
import { db } from "../backend/firebaseConfig"; // Updated import path
import { ref, set, onValue } from "firebase/database";
import { ReactComponent as ToothChart } from "../images/ToothChart.svg";

const teeth = Array.from({ length: 32 }, (_, i) => i + 1);

const DentalChart = ({ uid }) => {
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [toothStatus, setToothStatus] = useState({});

  useEffect(() => {
    if (uid) {
      const toothStatusRef = ref(db, `users/Patient/${uid}/toothStatus`);
      onValue(toothStatusRef, (snapshot) => {
        if (snapshot.exists()) {
          setToothStatus(snapshot.val());
        }
      });
    }
  }, [uid]);

  const handleToothClick = (tooth) => {
    setSelectedTooth(tooth);
  };

  const handleStatusChange = async (event) => {
    const status = event.target.value;
    setToothStatus({
      ...toothStatus,
      [selectedTooth]: status,
    });

    // Save the status to the database
    try {
      await set(ref(db, `users/Patient/${uid}/toothStatus/${selectedTooth}`), status);
      console.log(`Tooth ${selectedTooth} status saved: ${status}`);
    } catch (error) {
      console.error('Error saving tooth status:', error);
    }
  };

  return (
    <div>
      <h2>Dental Chart</h2>
      <div style={{ display: "flex", flexWrap: "wrap", maxWidth: "400px" }}>
        {teeth.map((tooth) => (
          <div
            key={tooth}
            onClick={() => handleToothClick(tooth)}
            style={{
              width: "50px",
              height: "50px",
              border: "1px solid #ddd",
              margin: "5px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              backgroundColor: selectedTooth === tooth ? "#add8e6" : toothStatus[tooth] ? "#f0f0f0" : "#fff",
            }}
          >
            {tooth}
          </div>
        ))}
      </div>
      {selectedTooth && (
        <div style={{ marginTop: "20px" }}>
          <h3>Edit Tooth {selectedTooth}</h3>
          <select value={toothStatus[selectedTooth] || ""} onChange={handleStatusChange}>
            <option value="">Select Status</option>
            <option value="Cavity">Cavity</option>
            <option value="Extract">Extract</option>
            <option value="Wisdom">Wisdom</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default DentalChart;


