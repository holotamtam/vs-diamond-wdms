import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
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

      //Check if the email is verified
      //if (!user.emailVerified) {
        //alert("Please verify your email before signing in. Check your inbox for the verification email.");
        //await auth.signOut();
        //return;
      //}

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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fdf9f3",
      }}
    >
       <div
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 4px 24px #0002",
          padding: "40px 32px 32px 32px",
          minWidth: 380,
          maxWidth: 440,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* Back button at top left */}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: "absolute",
            top: 18,
            left: 18,
            background: "none",
            border: "none",
            color: "#888",
            cursor: "pointer",
            fontSize: 14,
            textDecoration: "underline",
            padding: 0,
          }}
        >
          Back
        </button>
        <img
          src="/logo192.png"
          alt="VS Diamond Logo"
          style={{ width: 64, height: 64, borderRadius: "50%", marginBottom: 16, marginTop: 10, display: "block" }}
        />
        <h2 style={{ color: "#555", marginBottom: 8, fontWeight: "bold", textAlign: "center" }}>Welcome to VSDiamond</h2>
        {/* Email input with label */}
        <div style={{ width: "100%", marginBottom: 12, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <label htmlFor="email" style={{ alignSelf: "flex-start", marginBottom: 4, color: "#555", fontWeight: 500, fontSize: 15 }}>
            Email
          </label>
          <input
            id="email"
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 16,
              textAlign: "center"
            }}
          />
        </div>
        {/* Password input with label and forgot password */}
        <div style={{ width: "100%", marginBottom: 12, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <label htmlFor="password" style={{ alignSelf: "flex-start", marginBottom: 4, color: "#555", fontWeight: 500, fontSize: 15 }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 16,
              textAlign: "center"
            }}
          />
        </div>
        {/* Forgot password link above Sign In button, right aligned */}
        <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <Link to="/forgot-password" style={{ color: "#555", fontSize: 14, textDecoration: "underline" }}>
            Forgot password?
          </Link>
        </div>
        <button
          onClick={handleSignIn}
          style={{
            width: "100%",
            background: "#C29E38",
            color: "white",
            border: "none",
            padding: "12px 0",
            borderRadius: "999px",
            fontWeight: "bold",
            fontSize: "16px",
            cursor: "pointer",
            marginBottom: 16,
          }}
        >
          Sign In
        </button>
        <div style={{ marginTop: "10px", width: "100%", textAlign: "center" }}>
          <span style={{ color: "#555", fontSize: "15px", marginRight: 8 }}>
            Don't have an account?
          </span>
          <Link to="/sign-up">
            <button
              style={{
                background: "#fff",
                color: "#C29E38",
                border: "2px solid #C29E38",
                padding: "8px 24px",
                borderRadius: "999px",
                fontWeight: "bold",
                fontSize: "15px",
                cursor: "pointer",
                marginLeft: 8,
              }}
            >
              Sign Up
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;