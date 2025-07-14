import React, { useState, useEffect } from "react";
import app from "../../backend/firebaseConfig";
import { useNavigate, useLocation } from "react-router-dom";
import { getDatabase, ref, set, push, remove as dbRemove } from "firebase/database";
import SignUpForm from "../../components/SignUpForm";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  fetchSignInMethodsForEmail, 
} from "firebase/auth";

const SignUpClinicStaff = () => {

  // state variables
  const [email, setEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userConfirmPassword, setUserConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [civilStatus, setCivilStatus] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth(app);
  const db = getDatabase(app);

  // If redirected from pendingPersonnel, pre-fill and lock the email field
  const pendingKey = location.state?.pendingKey || null;

  // regex pattern for email and password validation
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).+$/;
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    const missingFields = [];

    if (!email) missingFields.push("Email");
    if (!userPassword) missingFields.push("Password");
    if (!userConfirmPassword) missingFields.push("Confirm Password");
    if (!firstName) missingFields.push("First Name");
    if (!lastName) missingFields.push("Last Name");
    if (!address) missingFields.push("Address");
    if (!contactNumber) missingFields.push("Contact Number");
    if (!birthDate) missingFields.push("Birthdate");
    if (!age) missingFields.push("Age");

    if (missingFields.length > 0) {
      alert(`Please fill in the following fields: ${missingFields.join(", ")}`);
      return;
    }

    if (contactNumber.toString().length !== 11) {
      alert(`Invalid contact number. Must not be less than or greater than 11 digits. Contact number only contains ${contactNumber.toString().length} digits.`);
      return;
    }

    
    if (!emailPattern.test(email)) {
      alert("Invalid email. Please enter a Gmail or Yahoo email.");
      return;
    }

    if (userPassword.toString().length < 8) {
      alert("Password must be at least 8 characters long.");
      return;
    }
    if (!passwordPattern.test(userPassword)) {
      alert("Password must contain an uppercase letter, a lowercase letter, a number, and a special character.");
      return;
    }

    if (userPassword !== userConfirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {

      // creates the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, userPassword);
      const user = userCredential.user;

      // sends email verification
      await sendEmailVerification(user);
      alert("A verification email has been sent. Please check your inbox.");
      setShowVerifyModal(true);
      
      // saves the user info in the Realtime Database
      await set(ref(db, `users/Personnel/ClinicStaff/${user.uid}`), {
        uid: user.uid,
        email,
        userPassword,
        firstName,
        middleName,
        lastName,
        address,
        contactNumber,
        civilStatus,
        birthDate,
        age,
        gender,
        role: "ClinicStaff",
        emailVerified: "No"
      });

      // Remove the pendingPersonnel entry if present
      if (pendingKey) {
        await dbRemove(ref(db, `pendingPersonnel/${pendingKey}`));
      }

    } catch (error) {
      // If the email already in use, alert and exit.
      if (error.code === "auth/email-already-in-use") {
        alert("This email is already in use. Please use a different email or sign in.");
        return;
      }
    }
  };

  // Poll for verification status
  useEffect(() => {
    let interval;
    if (showVerifyModal) {
      interval = setInterval(async () => {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          setIsVerified(true);
          // Update emailVerified to Yes in the database
          await set(ref(db, `users/Personnel/ClinicStaff/${auth.currentUser.uid}/emailVerified`), "Yes");
          clearInterval(interval);
          setTimeout(() => {
            navigate("/dashboard-clinicstaff");
          }, 1500); // Give user a moment to see the "verified" message
        }
      }, 2000); // check every 2 seconds
    }
    return () => clearInterval(interval);
  }, [showVerifyModal, auth, navigate]);

  // Auto-calculate age from birthdate
  useEffect(() => {
    if (birthDate) {
      const today = new Date();
      const birth = new Date(birthDate);
      let ageNow = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        ageNow--;
      }
      setAge(ageNow >= 0 ? ageNow : "");
    } else {
      setAge("");
    }
  }, [birthDate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fdf8f2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "18px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          padding: "48px 40px 40px 40px",
          minWidth: 420,
          maxWidth: 520,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative", // for absolute positioning of back/user type
        }}
      >
        {/* Back button top left */}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: "absolute",
            top: 18,
            left: 24,
            background: "none",
            border: "none",
            color: "#888",
            cursor: "pointer",
            fontSize: 17,
            textDecoration: "underline",
            fontWeight: 500,
            padding: 0,
          }}
        >
          Back
        </button>
        {/* User type top right */}
        <div
          style={{
            position: "absolute",
            top: 18,
            right: 24,
            color: "#bfa15a",
            fontWeight: 600,
            fontSize: 16,
            letterSpacing: 0.5,
            textTransform: "capitalize",
          }}
        >
          Clinic Staff
        </div>
        <img src={process.env.PUBLIC_URL + "/logo.png"} alt="VSDIAMOND Logo" style={{ width: 70, marginBottom: 8 }} />
        <div style={{ fontWeight: 600, fontSize: 22, color: "#bfa15a", letterSpacing: 1, marginBottom: 2 }}>VSDIAMOND</div>
        <div style={{ fontWeight: 400, fontSize: 14, color: "#bfa15a", marginBottom: 24 }}>DENTAL CLINIC</div>
        <div style={{ fontWeight: 700, fontSize: 32, color: "#222", marginBottom: 24, textAlign: "center" }}>Let's get started</div>
        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          {/* Email full width, but aligned with other fields */}
          <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ flex: 1, minWidth: 0, padding: 10, border: "1px solid #e0d6c3", borderRadius: 6, fontSize: 16 }}
            />
          </div>
          {/* Password and Confirm Password side by side */}
          <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              type="password"
              placeholder="Password"
              value={userPassword}
              onChange={e => setUserPassword(e.target.value)}
              style={{ flex: 1, minWidth: 0, padding: 10, border: "1px solid #e0d6c3", borderRadius: 6, fontSize: 16 }}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={userConfirmPassword}
              onChange={e => setUserConfirmPassword(e.target.value)}
              style={{ flex: 1, minWidth: 0, padding: 10, border: "1px solid #e0d6c3", borderRadius: 6, fontSize: 16 }}
            />
          </div>
          {/* Name fields */}
          <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              style={{ flex: 1, minWidth: 0, padding: 10, border: "1px solid #e0d6c3", borderRadius: 6, fontSize: 16 }}
            />
            <input
              type="text"
              placeholder="Middle Name"
              value={middleName}
              onChange={e => setMiddleName(e.target.value)}
              style={{ flex: 1, minWidth: 0, padding: 10, border: "1px solid #e0d6c3", borderRadius: 6, fontSize: 16 }}
            />
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              style={{ flex: 1, minWidth: 0, padding: 10, border: "1px solid #e0d6c3", borderRadius: 6, fontSize: 16 }}
            />
          </div>
          {/* Mobile Number and Address side by side */}
          <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Mobile Number"
              value={contactNumber}
              onChange={e => setContactNumber(e.target.value)}
              style={{ flex: 1, minWidth: 0, padding: 10, border: "1px solid #e0d6c3", borderRadius: 6, fontSize: 16 }}
            />
            <input
              type="text"
              placeholder="Address"
              value={address}
              onChange={e => setAddress(e.target.value)}
              style={{ flex: 1, minWidth: 0, padding: 10, border: "1px solid #e0d6c3", borderRadius: 6, fontSize: 16 }}
            />
          </div>
          {/* Civil Status and Gender dropdowns */}
          <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            <select
              value={civilStatus}
              onChange={e => setCivilStatus(e.target.value)}
              style={{ flex: 1, minWidth: 0, padding: 10, border: "1px solid #e0d6c3", borderRadius: 6, fontSize: 16, color: civilStatus ? '#222' : '#888' }}
            >
              <option value="" disabled>Civil Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
              <option value="Divorced">Divorced</option>
              <option value="Separated">Separated</option>
            </select>
            <select
              value={gender}
              onChange={e => setGender(e.target.value)}
              style={{ flex: 1, minWidth: 0, padding: 10, border: "1px solid #e0d6c3", borderRadius: 6, fontSize: 16, color: gender ? '#222' : '#888' }}
            >
              <option value="" disabled>Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          {/* Birthdate and Age */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <input
              type="date"
              placeholder="Birthdate"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              style={{ flex: 1, minWidth: 0, padding: 10, border: "1px solid #e0d6c3", borderRadius: 6, fontSize: 16 }}
            />
            <input
              type="number"
              placeholder="Age"
              value={age}
              readOnly
              style={{ flex: 1, minWidth: 0, padding: 10, border: "1px solid #e0d6c3", borderRadius: 6, fontSize: 16, background: '#f5f5f5' }}
            />
          </div>
          <button
            type="submit"
            style={{
              width: "100%",
              background: "#bfa15a",
              color: "#fff",
              fontWeight: 600,
              fontSize: 18,
              border: "none",
              borderRadius: 24,
              padding: "12px 0",
              marginTop: 8,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            Get Started &rarr;
          </button>
        </form>
        {showVerifyModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "2rem",
              borderRadius: "8px",
              textAlign: "center",
              minWidth: "300px",
            }}
          >
            {!isVerified ? (
              <>
                <h2>Verify Your Email</h2>
                <p>
                  A verification email has been sent to <b>{email}</b>.<br />
                  Please check your inbox and click the verification link.
                </p>
                <p>Waiting for verification...</p>
              </>
            ) : (
              <>
                <h2>Email Verified!</h2>
                <p>Redirecting to your dashboard...</p>
              </>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default SignUpClinicStaff;