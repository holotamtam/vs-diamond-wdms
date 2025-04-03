import React from "react";

export const servicesList = [
  { name: "Dental Cleaning", value: "Dental Cleaning", label: "Dental Cleaning", time: 60 },
  { name: "Dental Bonding", value: "Dental Bonding", label: "Dental Bonding", time: 60 },
  { name: "Dental Crowns", value: "Dental Crowns", label: "Dental Crowns", time: 60 },
  { name: "Teeth Whitening", value: "Teeth Whitening", label: "Teeth Whitening", time: 60 },
  { name: "Tooth Extraction", value: "Tooth Extraction", label: "Tooth Extraction", time: 60 },
  { name: "Cosmetic Fillings", value: "Cosmetic Fillings", label: "Cosmetic Fillings", time: 60 },
  { name: "Dental Veneers", value: "Dental Veneers", label: "Dental Veneers", time: 60 },
  { name: "Dentures", value: "Dentures", label: "Dentures", time: 60 },
];

const ServicesList = ({ selectedServices, toggleService }) => {
  return (
    <ul style={{ border: "1px solid #000", padding: "5px", listStyle: "none", width: "100%", maxHeight: "200px", overflowY: "auto" }}>
      {servicesList.map((service, index) => (
        <li
          key={index}
          onClick={() => toggleService(service.name)}
          style={{ cursor: "pointer", background: selectedServices.includes(service.name) ? "#ddd" : "#fff", padding: "5px" }}
        >
          {service.name}
        </li>
      ))}
    </ul>
  );
};

export default ServicesList;