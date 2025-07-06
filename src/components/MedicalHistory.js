import React, { useState, useEffect } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "../backend/firebaseConfig";
import "./MedicalHistory.css";

const dentalHistoryQuestions = [
  { key: "bleedingGums", text: "Do your gums bleed when you brush or floss?" },
  { key: "sensitiveTeeth", text: "Are your teeth sensitive to hot, cold, sweets, or pressure?" },
  { key: "flossCatch", text: "Does food or floss catch between your teeth?" },
  { key: "dryMouth", text: "Is your mouth often dry?" },
  { key: "periodontalTreatment", text: "Have you had periodontal (gum) treatment?" },
  { key: "orthodonticTreatment", text: "Have you had orthodontic treatment (braces)?" },
  { key: "mouthInjury", text: "Have you had serious injury to your head or mouth?" },
  { key: "jawClicking", text: "Do you have clicking, popping, or other discomfort in your jaw?" },
  { key: "dentalTreatmentProblems", text: "Have you had any problems related to dental treatment?" },
  { key: "currentDentalPain", text: "Are you currently experiencing dental pain or discomfort?" },
  { key: "ulcers", text: "Do you experience frequent ulcers in your mouth?" },
  { key: "sores", text: "Do you currently have any sores or ulcers in your mouth?" },
  { key: "energeticSports", text: "Do you participate in energetic sports or activities?" },
  { key: "grindTeeth", text: "Do you grind your teeth?" },
  { key: "dentures", text: "Do you wear dentures or partial dentures?" },
  { key: "fluoridatedHome", text: "Is your home water fluoridated?" },
  { key: "bottledWater", text: "Do you frequently drink bottled water?" },
];

const medicalHistoryQuestions = [
  { key: "physicianCare", text: "Are you under a physician's care now?" },
  { key: "hospitalizedOperation", text: "Have you ever been hospitalized or had a major operation?" },
  { key: "seriousHeadNeckInjury", text: "Have you ever had a serious head or neck injury?" },
  { key: "medicationsPillsDrugs", text: "Are you taking any medications, pills, or drugs?" },
  { key: "phenFenRedux", text: "Do you take, or have you taken, Phen-Fen or Redux?" },
  { key: "fosamaxBonivaActonel", text: "Have you ever taken Fosamax, Boniva, Actonel or any other medications containing bisphosphonates?" },
  { key: "specialDiet", text: "Are you on a special diet?" },
  { key: "tobaccoProducts", text: "Do you use any tobacco products?" },
  { key: "controlledSubstances", text: "Do you use any controlled substances?" },
  { key: "vapeECigarettes", text: "Do you Vape or use E-cigarettes?" },
  { key: "marijuanaCannabis", text: "Do you use any forms of Marijuana, Pot, Weed or Cannabis?" },
  { key: "pastTobaccoUse", text: "Have you used any tobacco products, controlled substances, vape or any forms of marijuana in the past?" },
];

const healthConditions = [
  { key: "AIDS_HIV_positive", label: "AIDS/HIV positive" },
  { key: "Alzheimers_disease", label: "Alzheimer's disease" },
  { key: "Anaphylaxis", label: "Anaphylaxis" },
  { key: "Anemia", label: "Anemia" },
  { key: "Angina", label: "Angina" },
  { key: "Arthritis_Gout", label: "Arthritis/Gout" },
  { key: "Artificial_heart_valve", label: "Artificial heart valve" },
  { key: "Artificial_joint", label: "Artificial joint" },
  { key: "Asthma", label: "Asthma" },
  { key: "Blood_disease", label: "Blood disease" },
  { key: "Blood_transfusion", label: "Blood transfusion" },
  { key: "Breathing_problems", label: "Breathing problems" },
  { key: "Bruise_easily", label: "Bruise easily" },
  { key: "Cancer", label: "Cancer" },
  { key: "Chemotherapy", label: "Chemotherapy" },
  { key: "Chest_pains", label: "Chest pains" },
  { key: "Cold_sores_fever_blisters", label: "Cold sores/fever blisters" },
  { key: "Congenital_heart_disorder", label: "Congenital heart disorder" },
  { key: "Convulsions", label: "Convulsions" },
  { key: "Cortisone_medicine", label: "Cortisone medicine" },
  { key: "Diabetes", label: "Diabetes" },
  { key: "Drug_addiction", label: "Drug addiction" },
  { key: "Easily_winded", label: "Easily winded" },
  { key: "Emphysema", label: "Emphysema" },
  { key: "Epilepsy_or_seizures", label: "Epilepsy or seizures" },
  { key: "Excessive_bleeding", label: "Excessive bleeding" },
  { key: "Fainting_or_dizziness", label: "Fainting or dizziness" },
  { key: "Frequent_cough", label: "Frequent cough" },
  { key: "Frequent_diarrhea", label: "Frequent diarrhea" },
  { key: "Frequent_headaches", label: "Frequent headaches" },
  { key: "Genital_herpes", label: "Genital herpes" },
  { key: "Glaucoma", label: "Glaucoma" },
  { key: "Hay_fever", label: "Hay fever" },
  { key: "Heart_attack_Failure", label: "Heart attack/Failure" },
  { key: "Heart_murmur", label: "Heart murmur" },
  { key: "Heart_pacemaker", label: "Heart pacemaker" },
  { key: "Heart_trouble_Disease", label: "Heart trouble/Disease" },
  { key: "Hemophilia", label: "Hemophilia" },
  { key: "Hepatitis_A", label: "Hepatitis A" },
  { key: "Hepatitis_B_or_C", label: "Hepatitis B or C" },
  { key: "Herpes", label: "Herpes" },
  { key: "High_blood_pressure", label: "High blood pressure" },
  { key: "High_cholesterol", label: "High cholesterol" },
  { key: "Hives_or_rash", label: "Hives or rash" },
  { key: "Hypoglycemia", label: "Hypoglycemia" },
  { key: "Irregular_heartbeat", label: "Irregular heartbeat" },
  { key: "Kidney_problems", label: "Kidney problems" },
  { key: "Leukemia", label: "Leukemia" },
  { key: "Liver_disease", label: "Liver disease" },
  { key: "Low_blood_pressure", label: "Low blood pressure" },
  { key: "Lung_disease", label: "Lung disease" },
  { key: "Mitral_valve_prolapse", label: "Mitral valve prolapse" },
  { key: "Osteoporosis", label: "Osteoporosis" },
  { key: "Pain_in_jaw_joints", label: "Pain in jaw joints" },
  { key: "Parathyroid_disease", label: "Parathyroid disease" },
  { key: "Psychiatric_care", label: "Psychiatric care" },
  { key: "Radiation_treatment", label: "Radiation treatment" },
  { key: "Recent_weight_loss", label: "Recent weight loss" },
  { key: "Renal_dialysis", label: "Renal dialysis" },
  { key: "Rheumatic_fever", label: "Rheumatic fever" },
  { key: "Rheumatism", label: "Rheumatism" },
  { key: "Scarlet_fever", label: "Scarlet fever" },
  { key: "Shingles", label: "Shingles" },
  { key: "Sickle_cell_disease", label: "Sickle cell disease" },
  { key: "Sinus_trouble", label: "Sinus trouble" },
  { key: "Spinal_bifida", label: "Spinal bifida" },
  { key: "Stomach_Intestinal_disease", label: "Stomach/Intestinal disease" },
  { key: "Stroke", label: "Stroke" },
  { key: "Swelling_of_limbs", label: "Swelling of limbs" },
  { key: "Thyroid_disease", label: "Thyroid disease" },
  { key: "Tonsillitis", label: "Tonsillitis" },
  { key: "Tuberculosis", label: "Tuberculosis" },
  { key: "Tumors_or_growths", label: "Tumors or growths" },
  { key: "Ulcers", label: "Ulcers" },
  { key: "Venereal_disease", label: "Venereal disease" },
  { key: "Yellow_Jaundice", label: "Yellow Jaundice" },
];

const initialDentalHistory = Object.fromEntries(dentalHistoryQuestions.map(q => [q.key, { answer: "", explanation: "" }]));
const initialMedicalHistory = Object.fromEntries(medicalHistoryQuestions.map(q => [q.key, { answer: "", explanation: "" }]));
const initialHealthConditions = Object.fromEntries(healthConditions.map(c => [c.key, ""]));

const MedicalHistory = ({ patientId }) => {
  const [dentalHistory, setDentalHistory] = useState(initialDentalHistory);
  const [medicalHistory, setMedicalHistory] = useState(initialMedicalHistory);
  const [medications, setMedications] = useState([{ name: "", product: "", frequency: "", type: "prescription" }]);
  const [healthHistory, setHealthHistory] = useState(initialHealthConditions);
  const [otherNotes, setOtherNotes] = useState("");
  const [otherPiercings, setOtherPiercings] = useState("");
  const [medMenuOpenIdx, setMedMenuOpenIdx] = useState(null);
  const medMenuRef = React.useRef();

  // Fetching from Firebase
  useEffect(() => {
    if (patientId) {
      const historyRef = ref(db, `users/Patient/${patientId}/medicalHistory`);
      onValue(historyRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setDentalHistory(data.dentalHistory || initialDentalHistory);
          setMedicalHistory(data.medicalHistory || initialMedicalHistory);
          setMedications(data.medications || [{ name: "", product: "", frequency: "", type: "prescription" }]);
          setHealthHistory(data.healthHistory || initialHealthConditions);
          setOtherNotes(data.otherNotes || "");
          setOtherPiercings(data.otherPiercings || "");
        }
      });
    }
  }, [patientId]);

  // Add click outside handler for menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (medMenuRef.current && !medMenuRef.current.contains(event.target)) {
        setMedMenuOpenIdx(null);
      }
    }
    if (medMenuOpenIdx !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [medMenuOpenIdx]);

  // Handlers
  const handleDentalChange = (key, field, value) => {
    setDentalHistory(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };
  const handleMedicalChange = (key, field, value) => {
    setMedicalHistory(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };
  const handleMedicationChange = (idx, field, value) => {
    setMedications(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };
  const addMedicationRow = () => {
    setMedications(prev => [...prev, { name: "", product: "", frequency: "", type: "prescription" }]);
  };
  const removeMedicationRow = (idx) => {
    setMedications(prev => prev.filter((_, i) => i !== idx));
  };
  const handleHealthHistoryChange = (key, value) => {
    setHealthHistory(prev => ({ ...prev, [key]: value }));
  };

  // Save to Firebase
  const handleSave = async () => {
    try {
      await set(ref(db, `users/Patient/${patientId}/medicalHistory`), {
        dentalHistory,
        medicalHistory,
        medications,
        healthHistory,
        otherNotes,
        otherPiercings,
      });
      alert("Medical history saved successfully!");
    } catch (error) {
      console.error("Error saving medical history:", error);
      alert("Failed to save medical history.");
    }
  };

  return (
    <div className="mh-container">
      <h2>Dental History</h2>
      <table className="mh-table">
        <thead>
          <tr><th>Question</th><th>Yes</th><th>No</th><th>If Yes, explain</th></tr>
        </thead>
        <tbody>
          {dentalHistoryQuestions.map(q => (
            <tr key={q.key}>
              <td>{q.text}</td>
              <td><input type="radio" name={`dental-${q.key}`} checked={dentalHistory[q.key].answer === "yes"} onChange={() => handleDentalChange(q.key, "answer", "yes")} /></td>
              <td><input type="radio" name={`dental-${q.key}`} checked={dentalHistory[q.key].answer === "no"} onChange={() => handleDentalChange(q.key, "answer", "no")} /></td>
              <td><input type="text" value={dentalHistory[q.key].explanation} onChange={e => handleDentalChange(q.key, "explanation", e.target.value)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Medical History</h2>
      <table className="mh-table">
        <thead>
          <tr><th>Question</th><th>Yes</th><th>No</th><th>If Yes, explain</th></tr>
        </thead>
        <tbody>
          {medicalHistoryQuestions.map(q => (
            <tr key={q.key}>
              <td>{q.text}</td>
              <td><input type="radio" name={`medical-${q.key}`} checked={medicalHistory[q.key].answer === "yes"} onChange={() => handleMedicalChange(q.key, "answer", "yes")} /></td>
              <td><input type="radio" name={`medical-${q.key}`} checked={medicalHistory[q.key].answer === "no"} onChange={() => handleMedicalChange(q.key, "answer", "no")} /></td>
              <td><input type="text" value={medicalHistory[q.key].explanation} onChange={e => handleMedicalChange(q.key, "explanation", e.target.value)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Medications</h2>
      <table className="mh-table">
        <thead>
          <tr>
            <th>Name of medication</th>
            <th>Product name</th>
            <th>Frequency of use</th>
            <th>Type</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {medications.map((row, idx) => (
            <tr key={idx}>
              <td><input type="text" value={row.name} onChange={e => handleMedicationChange(idx, "name", e.target.value)} /></td>
              <td><input type="text" value={row.product} onChange={e => handleMedicationChange(idx, "product", e.target.value)} /></td>
              <td><input type="text" value={row.frequency} onChange={e => handleMedicationChange(idx, "frequency", e.target.value)} /></td>
              <td>
                <select value={row.type} onChange={e => handleMedicationChange(idx, "type", e.target.value)}>
                  <option value="prescription">Prescription</option>
                  <option value="otc">Over-the-counter</option>
                </select>
              </td>
              <td style={{ position: 'relative' }}>
                <span
                  className="mh-med-menu-icon"
                  tabIndex={0}
                  onClick={() => setMedMenuOpenIdx(idx === medMenuOpenIdx ? null : idx)}
                  aria-label="More options"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="5" r="2" fill="#555"/>
                    <circle cx="12" cy="12" r="2" fill="#555"/>
                    <circle cx="12" cy="19" r="2" fill="#555"/>
                  </svg>
                </span>
                {medMenuOpenIdx === idx && (
                  <div className="mh-med-menu-dropdown" ref={medMenuRef}>
                    <button type="button" onClick={() => { addMedicationRow(); setMedMenuOpenIdx(null); }}>Add Row</button>
                    <button type="button" onClick={() => { removeMedicationRow(idx); setMedMenuOpenIdx(null); }} disabled={medications.length === 1}>Remove Row</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Health Conditions</h2>
      <table className="mh-table mh-health-table">
        <thead>
          <tr><th>Condition</th><th>Yes</th><th>No</th></tr>
        </thead>
        <tbody>
          {healthConditions.map(cond => (
            <tr key={cond.key}>
              <td>{cond.label}</td>
              <td><input type="radio" name={`cond-${cond.key}`} checked={healthHistory[cond.key] === "yes"} onChange={() => handleHealthHistoryChange(cond.key, "yes")} /></td>
              <td><input type="radio" name={`cond-${cond.key}`} checked={healthHistory[cond.key] === "no"} onChange={() => handleHealthHistoryChange(cond.key, "no")} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mh-section">
        <label>Have you ever had any serious illness, or body piercings not listed above?</label>
        <input type="text" value={otherPiercings} onChange={e => setOtherPiercings(e.target.value)} />
      </div>
      <div className="mh-section">
        <label>If Yes, please explain:</label>
        <textarea value={otherNotes} onChange={e => setOtherNotes(e.target.value)} />
      </div>
      <button className="mh-save-btn" onClick={handleSave}>Save Medical History</button>
    </div>
  );
};

export default MedicalHistory;