import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import app from "../../backend/firebaseConfig";
import { getDatabase, ref, get } from "firebase/database";

const SignIn = () => {
  // State variables
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState(""); // Store the user role in state
  const navigate = useNavigate();

  const auth = getAuth(app);

  // Function to handle sign in
  const handleSignIn = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      alert("Please provide both email and password.");
      return;
    }

    try {
      // Sign in the user with the provided email and password
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      console.log("Sign in successful, userCredential:", userCredential);
      const user = userCredential.user;

      // Determine the user type from the Realtime Database using the user's UID
      const db = getDatabase(app);
      const patientRef = ref(db, `users/Patient/${user.uid}`);
      const dentistOwnerRef = ref(db, `users/Personnel/DentistOwner/${user.uid}`);
      const associateDentistRef = ref(db, `users/Personnel/AssociateDentist/${user.uid}`);
      const clinicStaffRef = ref(db, `users/Personnel/ClinicStaff/${user.uid}`);

      console.log("Authenticated UID:", user.uid);
      console.log("DB Path:", `users/Patient/${user.uid}`);

      const [patientSnap, dentistOwnerSnap, associateDentistSnap, clinicStaffSnap] = await Promise.all([
        get(patientRef),
        get(dentistOwnerRef),
        get(associateDentistRef),
        get(clinicStaffRef),
      ]);

      let userType = ""; // Temporary variable to determine the user type
     
      if (patientSnap.exists()) {
        userType = "Patient";
      } else if (dentistOwnerSnap.exists()) {
        userType = "DentistOwner";
      } else if (associateDentistSnap.exists()) {
        userType = "AssociateDentist";
      } else if (clinicStaffSnap.exists()) {  
        userType = "ClinicStaff";
      }

      if (userType) {
        setUserRole(userType); // Store the user role in state
        alert(`Sign in successful as ${userType}!`);

        // Navigate to the appropriate dashboard
        let dashboardRoute =
          userType === "Patient"
            ? "/dashboard-patient"
            : userType === "DentistOwner"
            ? "/dashboard-dentistowner"
            : userType === "AssociateDentist"
            ? "/dashboard-associatedentist"
            : userType === "ClinicStaff"
            ? "/dashboard-clinicstaff"
            : "/"; // Default route in case of unexpected error

        navigate(dashboardRoute, { state: { userRole: userType } }); // Pass userRole via navigation state
      } else {
        alert("User type not determined. Please contact support.");
      }
    } catch (error) {
      console.error("Error signing in:", error);
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