import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import app from "../../backend/firebaseConfig";
import { getDatabase, ref, get } from "firebase/database";

const SignIn = () => {
  // state variables
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const auth = getAuth(app);
  // userType variable to store the type of user (Patient, Dentist, Clinic Staff)
  let userType = "";

  // function to handle sign in
  const handleSignIn = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      alert("Please provide both email and password.");
      return;
    }

    try {
      // to sign in the user with the provided email and password.
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      console.log("Sign in successful, userCredential:", userCredential);
      const user = userCredential.user;
      
      // to determine the user type from the Realtime Database using the user's uid.
      const db = getDatabase(app);
      const patientRef = ref(db, "users/Patient");
      const dentistOwnerRef = ref(db, "users/Personnel/DentistOwner");
      const associateDentistRef = ref(db, "users/Personnel/AssociateDentist");
      const clinicStaffRef = ref(db, "users/Personnel/ClinicStaff");

      const [patientSnap, dentistOwnerSnap, associateDentistSnap, clinicStaffSnap] = await Promise.all([get(patientRef), get(dentistOwnerRef), get(associateDentistRef), get(clinicStaffRef)]);

      if (patientSnap.exists()) {
        const patients = Object.values(patientSnap.val());
        if (patients.find(record => record.uid === user.uid)) {
          userType = "Patient";
        }
      }
      if (!userType && dentistOwnerSnap.exists()) {
        const dentistsOwner = Object.values(dentistOwnerSnap.val());
        if (dentistsOwner.find(record => record.uid === user.uid)) {
          userType = "Dentist Owner";
        }
      }
      if (!userType && associateDentistSnap.exists()) {
        const associateDentist = Object.values(associateDentistSnap.val());
        if (associateDentist.find(record => record.uid === user.uid)) {
          userType = "Associate Dentist";
        }
      }
      if (!userType && clinicStaffSnap.exists()) {
        const clinicStaffs = Object.values(clinicStaffSnap.val());
        if (clinicStaffs.find(record => record.uid === user.uid)) {
          userType = "Clinic Staff";
        }
      }

      if (userType) {
        alert(`Sign in successful as ${userType}!`);
        
        let dashboardRoute = 
          userType === "Patient" ? "/DashboardPatient" :
          userType === "Dentist Owner" ? "/DashboardDentistOwner" :
          userType === "Associate Dentist" ? "/DashboardAssociateDentist" :
          userType === "Clinic Staff" ? "/DashboardClinicStaff" :
          "/"; // Default route in case of unexpected error

        navigate(dashboardRoute); // Navigate after defining the route
      } else {
        alert("User type not determined. Please contact support.");
      }
    } catch (error) {
      console.error("Error signing in:", error);
      // This alert will show the error code and message.
      alert(`Error signing in (${error.code}): ${error.message}`);
    }
  };

  return (
    <div>
      <button onClick={() => navigate(-1)}>Back</button>
      <h3>Sign In</h3>
      <input
        type="text"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleSignIn}>Sign In</button>
    </div>
  );
};

export default SignIn;
