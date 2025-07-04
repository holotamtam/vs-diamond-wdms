import React from "react";
import Modal from "react-modal";

const ViewInsurance = ({ isOpen, onClose, insuranceDetails }) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Insurance Details Modal"
      style={{
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 2000
        },
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
        },
      }}
    >
      <h2>Insurance Details</h2>
      {insuranceDetails ? (
        <div>
          <p><strong>Name:</strong> {insuranceDetails.name}</p>
          <p><strong>Company Name:</strong> {insuranceDetails.companyName}</p>
          <p><strong>Contact Number:</strong> {insuranceDetails.contactNumber}</p>
          <p><strong>HMO Card:</strong> {insuranceDetails.hmoCard}</p>
          <p><strong>HMO Account Number:</strong> {insuranceDetails.hmoAccountNumber}</p>
          <p><strong>Valid Government ID:</strong> {insuranceDetails.validGovernmentID}</p>
          <p><strong>Valid Government ID Number:</strong> {insuranceDetails.validGovernmentIDNumber}</p>
          <p><strong>Birthdate:</strong> {insuranceDetails.birthdate}</p>
          <p><strong>Relationship:</strong> {insuranceDetails.relationship}</p>
          <button onClick={onClose} style={{ marginTop: "10px" }}>Close</button>
        </div>
      ) : (
        <p>No insurance details available.</p>
      )}
    </Modal>
  );
};

export default ViewInsurance;