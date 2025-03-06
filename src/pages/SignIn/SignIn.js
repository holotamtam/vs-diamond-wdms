import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import app from "../../backend/firebaseConfig";
import { getDatabase, ref, get } from "firebase/database";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const auth = getAuth(app);

  const handleSignIn = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      alert("Please provide both email and password.");
      return;
    }

    // Log input values for debugging.
    console.log("Attempting sign in with email:", trimmedEmail);
    console.log("Password length:", password.length);

    try {
      // Sign in with Firebase Auth using email and password.
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      console.log("Sign in successful, userCredential:", userCredential);
      const user = userCredential.user;
      
      // Now determine the user type from the Realtime Database using the user's uid.
      const db = getDatabase(app);
      const patientRef = ref(db, "users/Patient");
      const personnelRef = ref(db, "users/Personnel");

      const [patientSnap, personnelSnap] = await Promise.all([get(patientRef), get(personnelRef)]);
      let userType = "";

      if (patientSnap.exists()) {
        const patients = Object.values(patientSnap.val());
        if (patients.find(record => record.uid === user.uid)) {
          userType = "Patient";
        }
      }
      if (!userType && personnelSnap.exists()) {
        const personnels = Object.values(personnelSnap.val());
        if (personnels.find(record => record.uid === user.uid)) {
          userType = "Personnel";
        }
      }

      if (userType) {
        alert(`Sign in successful as ${userType}!`);
        navigate(userType === "Patient" ? "/dashboardPatient" : "/dashboardPersonnel");
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
