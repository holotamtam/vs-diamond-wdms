import React, { useState, useEffect } from "react";
import app from "../../backend/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { getDatabase, ref, set, push } from "firebase/database";
import SignUpForm from "../../components/SignUpForm";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  fetchSignInMethodsForEmail, 
} from "firebase/auth";

const SignUpDentistOwner = () => {
  // state variables
  const [personnelAuthStep, setPersonnelAuthStep] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
  const auth = getAuth(app);
  const db = getDatabase(app);

  // regex pattern for email and password validation
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).+$/;

  const handlePersonnelAuth = () => {
    if (username === "personnel" && password === "123456") {
      setPersonnelAuthStep(true);
    } else {
      alert(`Invalid credentials.`);
    }
  };

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

      /*
      // Check if the email is already in use
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        alert("This email is already in use. Please use a different email.");
        return;
      }
      */

      // creates the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, userPassword);
      const user = userCredential.user;

      // sends email verification
      await sendEmailVerification(user);
      alert("A verification email has been sent. Please check your inbox.");
      setShowVerifyModal(true);

      /// saves the user info in the Realtime Database
      await set(ref(db, `users/Personnel/DentistOwner/${user.uid}`), { 
        uid: user.uid,
        firstName,
        middleName,
        lastName,
        userPassword,
        address,
        contactNumber,
        civilStatus,
        birthDate,
        age,
        gender,
        email,
        role: "DentistOwner", 
      });

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
          clearInterval(interval);
          setTimeout(() => {
            navigate("/dashboard-dentistowner");
          }, 1500); // Give user a moment to see the "verified" message
        }
      }, 2000); // check every 2 seconds
    }
    return () => clearInterval(interval);
  }, [showVerifyModal, auth, navigate]);

  return (
    <div>
      <button onClick={() => navigate(-1)}>Back</button>

      {!personnelAuthStep ? (
        <div>
          <h3>Enter credentials | Personnel Authentication!</h3>
          <h4>Predefined Credentials</h4>
          <div>
            <label><h5>Username: personnel</h5></label>
            <label><h5>Password: 123456</h5></label>
          </div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handlePersonnelAuth}>Submit</button>
        </div>
      ) : (
        <SignUpForm
          title="Signup as Dentist Owner"
          firstName={firstName}
          setFirstName={setFirstName}
          middleName={middleName}
          setMiddleName={setMiddleName}
          lastName={lastName}
          setLastName={setLastName}
          address={address}
          setAddress={setAddress}
          contactNumber={contactNumber}
          setContactNumber={setContactNumber}
          civilStatus={civilStatus}
          setCivilStatus={setCivilStatus}
          birthDate={birthDate}
          setBirthDate={setBirthDate}
          age={age}
          setAge={setAge}
          gender={gender}
          setGender={setGender}
          email={email}
          setEmail={setEmail}
          userPassword={userPassword}
          setUserPassword={setUserPassword}
          userConfirmPassword={userConfirmPassword}
          setUserConfirmPassword={setUserConfirmPassword}
          handleSubmit={handleSubmit}
        />
      )}

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
  );
};

export default SignUpDentistOwner;