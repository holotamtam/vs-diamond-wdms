import React, { useState } from "react";

const PatientInsuranceForm = ({ onSubmit, onClose, initialData = {} }) => {
  // State variables 
  const [name, setName] = useState(initialData.name || ""); 
  const [companyName, setCompanyName] = useState(initialData.companyName || ""); 
  const [contactNumber, setContactNumber] = useState(initialData.contactNumber || ""); 
  const [hmoCard, setHmoCard] = useState(initialData.hmoCard || ""); 
  const [hmoAccountNumber, setHmoAccountNumber] = useState(initialData.hmoAccountNumber || ""); 
  const [validGovernmentID, setValidGovernmentID] = useState(initialData.validGovernmentID || ""); 
  const [validGovernmentIDNumber, setValidGovernmentIDNumber] = useState(initialData.validGovernmentIDNumber || ""); 
  const [birthdate, setBirthdate] = useState(initialData.birthdate || ""); 
  const [relationship, setRelationship] = useState(initialData.relationship || ""); 

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = {
      name,
      companyName,
      contactNumber,
      hmoCard,
      hmoAccountNumber,
      validGovernmentID,
      validGovernmentIDNumber,
      birthdate,
      relationship,
    };
    onSubmit(formData);
  };

  return (
    <div>
      <h1>Patient Insurance Details</h1>
      <form onSubmit={handleSubmit}>
        <label>
          {/* The name of the patient indicated in the insurance */}
          <input 
            placeholder="Name"
            type="text"
            required
            value={name}
            maxLength="100"
            onChange={(e) => {
              const value = e.target.value;
              if (/^[a-zA-Z\s]*$/.test(value)) {
                setName(value.replace(/\b\w/g, (char) => char.toUpperCase()));
              }
            }}
          />
        </label>
        
        <div>
          {/* Company Name and Contact Number */}
          <input 
            placeholder="Company Name"
            type="text"
            required
            value={companyName}
            maxLength="50"
            onChange={(e) => {
              const value = e.target.value;
              const regex = /^[a-zA-Z0-9\s\-\&\.',]+$/;
              if (value === "" || regex.test(value)) {
                setCompanyName(value);
              }
            }}
          />

          <input 
            placeholder="Contact Number"
            type="text"
            required
            maxLength="11"
            value={contactNumber}
            onChange={(e) => {
              const value = e.target.value;
              // Checks if the contact number entered by the user only contains digits from 0-9
              if (/^\d*$/.test(value)) {
                setContactNumber(value); 
              }
            }}
          />
        </div>

        <div>
          {/* HMO Card and HMO Account Number */}
          <input 
            placeholder="HMO Card"
            type="text"
            required
            value={hmoCard}
            maxLength="15"
            onChange={(e) => {
              const value = e.target.value;
              const regex = /^[a-zA-Z0-9\-]+$/;
              if (value === "" || regex.test(value)) {
                setHmoCard(value);
              }
            }}
          />

          <input 
            placeholder="HMO Account Number"
            type="text"
            required
            value={hmoAccountNumber}
            maxLength="15"
            onChange={(e) => {
              const value = e.target.value;
              const regex = /^[0-9\-]+$/;
              if (value === "" || regex.test(value)) {
                setHmoAccountNumber(value);
              }
            }}
          />
        </div>

        <div>
          {/* Valid Government ID and Valid Government ID Number */}
          <input 
            placeholder="Valid Government ID"
            type="text"
            required
            value={validGovernmentID}
            onChange={(e) => {
              const value = e.target.value;
              const regex = /^[a-zA-Z0-9\-\s]+$/;
              if (value === "" || regex.test(value)) {
                setValidGovernmentID(value);
              }
            }}
          />

          <input 
            placeholder="Valid Government ID Number"
            type="text"
            required
            value={validGovernmentIDNumber}
            onChange={(e) => {
              const value = e.target.value;
              const regex = /^[a-zA-Z0-9\-\s]+$/; // Allows letters, numbers, hyphens, and spaces
              if (value === "" || regex.test(value)) {
                setValidGovernmentIDNumber(value);
              }
            }} 
          />
        </div>

        <div>
          <label>
            Birthdate:
            <input 
              placeholder="Birthdate"
              type="date"
              required
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
            />
          </label>

          <select
            required
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
          >
            <option value="">Select</option>
            <option value="Principal">Principal</option>
            <option value="Dependent">Dependent</option>
          </select>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "10px",     marginTop: "10px" }}>
          <button type="submit">Submit</button>
          <button type="button" onClick={() => onClose(true)}>Close</button>
        </div>
      </form>
    </div>
  );
}

export default PatientInsuranceForm;


