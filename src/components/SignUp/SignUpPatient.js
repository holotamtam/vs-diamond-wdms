import React, { useState } from "react";
import app from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { getDatabase, ref, set, push } from "firebase/database";

const SignUpPatient = () => {

  // State variables for each input field
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

   const navigate = useNavigate();


  // Function to HandleSubmit from the form data
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevents the page from reloading

    const missingFields = []; // Array to store missing input fields

    // Checking for any missing fields
    if (!email) missingFields.push("Email");
    if (!userPassword) missingFields.push("Password");
    if (!userConfirmPassword) missingFields.push("Confirm Password");
    if (!firstName) missingFields.push("First Name");
    if (!lastName) missingFields.push("Last Name");
    if (!address) missingFields.push("Address");
    if (!contactNumber) missingFields.push("Contact Number");
    if (!birthDate) missingFields.push("Birthdate");
    if (!age) missingFields.push("Age");


    // Display the missing fields as an alert
    if (missingFields.length > 0) {
      alert(`Please fill in the following fields: ${missingFields.join(", ")}`);
      return;
    }

    // Regex pattern for a strong password (must contain atleast 1 lowercase, 1 uppercase, 1 number, 1 special character)
    /*
      (?=.*[a-z]) – At least one lowercase letter.
      (?=.*[A-Z]) – At least one uppercase letter.
      (?=.*\d) – At least one number.
      (?=.*[!@#$%^&*]) – At least one special character (like !, @, #, $, %, ^, &, or *).
    */

    if(contactNumber.toString().length !== 11) {
      alert(`Invalid contact number. Must not be less than or greater than 11 digits. Contact number only contains ${contactNumber.toString().length} digits.`);
      return;
    }

    // Regex pattern for the email (must contain '@' and the domain must contain text and '.')
    /*
       ^[a-zA-Z0-9._%+-]+ - ensures that local part before the '@', can contain etters, numbers, dots, underscores, percent signs, plus signs, and hyphens.
       [a-zA-Z0-9.-]+ - ensures that the domain after '@' can contain letters, numbers, dots, and hyphens.
       \.[a-zA-Z]{2,}$ - ensures that the domain ends with a valid top-level domain (TLD), with atleast two letters. (Ex. .com, .edu.ph, .org)
    */
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    // Checks if the email entered by the user matches the regex pattern for the email
    if (!emailPattern.test(email)) {
      alert("Invalid email. Please enter a Gmail or Yahoo email.");
      return;
    }

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).+$/;
    // Checks if the password length is less than 8 characters
    if (userPassword.toString().length < 8) {
      alert("Password must be at least 8 characters long.");
      return;
    }
    // Checks if the password entered by the user meets the regex pattern for a strong password
    if (!passwordPattern.test(userPassword)) {
      alert("Password must contain an uppercase letter, a lowercase letter, a number, and a special character.");
      return;
    }

    // Checking if both password and confirm password match
    if (userPassword !== userConfirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    alert(`Registration successful for Patient`);
    

    // Firebase Realtime Database
    const saveData = async () => {
      const db = getDatabase(app);
      const newDocRef = push(ref(db, "users/Patient")); // Creates a unique user ID
      try {
        await set(newDocRef, {
          email,
          userPassword,
          firstName,
          middleName,
          lastName,
          address,
          contactNumber,
          civilStatus,
          birthDate,
          age
        });
        navigate("/dashboardPatient");
      } catch (error) {
        alert("Error saving data: " + error.message);
      }
    };
  
    saveData(); // Calls the function to save the data to the database
  };


  return (

    <div>
      {/*Ternary Conditional Operator - if no role selected yet, the div element below will prompt the user to select a role  */}
      {
      (
        <form onSubmit={handleSubmit}>
          {/*</div>First Name, Middle Name, Last Name input fields*/}
          <h3>Signup as Patient</h3>
          <div>
            <label>First Name:</label>
            <input
              type="text"
              value={firstName}
              maxLength="50"
              onChange={(e) => {
                const value = e.target.value;
                // Checks if the first name entered by the user is valid (no numbers, special characters)
                if (/^[A-Za-z\s]*$/.test(value)) {
                  setFirstName(value.replace(/\b\w/g, (char) => char.toUpperCase())); // Converts each first letter to Capital
                }
              }}
            />

            <label>Middle Name:</label>
            <input
              type="text"
              value={middleName}
              maxLength="50"
              onChange={(e) => {
                const value = e.target.value;
                // Checks if the first name entered by the user is valid (no numbers, special characters)
                if (/^[A-Za-z\s]*$/.test(value)) {
                  setMiddleName(value.replace(/\b\w/g, (char) => char.toUpperCase())); // Converts each first letter to Capital
                }
              }}
            />

            <label>Last Name:</label>
            <input
              type="text"
              value={lastName}
              maxLength="50"
              onChange={(e) => {
                const value = e.target.value;
                // Checks if the first name entered by the user is valid (no numbers, special characters)
                if (/^[A-Za-z\s]*$/.test(value)) {
                  setLastName(value.replace(/\b\w/g, (char) => char.toUpperCase())); // Converts each first letter to Capital
                }
              }}
            />
          </div>

          {/* Address and Contact Number input fields */}
          <div>
            <label>Address:</label>
            <input
              type="text"
              value={address}
              maxLength="150"
              onChange={(e) => setAddress(e.target.value)}
            />

            <label>Contact Number:</label>
            <input
              type="text"
              value={contactNumber}
              maxLength="11"
              onChange={(e) => {
                const value = e.target.value;
                // Checks if the contact number entered by the user only contains digits from 0-9
                if (/^\d*$/.test(value)) {
                  setContactNumber(value); 
                }
              }}
            />
          </div>

          {/* Civil Status, Birthdate, and Age input fields */}
          <div>
            <label>Civil Status:</label>
            <select
              value={civilStatus}
              onChange={(e) => setCivilStatus(e.target.value)}
            >
              <option value="">Select</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
              <option value="Separated">Separated</option>
            </select>

            <label>Birthdate:</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => {
                const birthDateValue = e.target.value;
                setBirthDate(birthDateValue);
      
                // Gets the date today and the birthdate entered by the user
                const today = new Date();
                const birthDate = new Date(birthDateValue);

                // Check if the birthdate is in the future
                if (birthDate > today) {
                  alert("Birthdate cannot be in the future.");
                  setAge(""); 
                  return;  
                }

                 // Calculate age
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                const dayDiff = today.getDate() - birthDate.getDate();

                // Checks if the birthday hasn't occurred yet this year, subtract 1 from age
                if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
                  age--;
                }

                setAge(age);  // Set the calculated age
              }}   
            />

            <label>Age:</label>
            <input
              type="text"
              value={age}
              min="1"
              maxLength="3"
              onChange={(e) => {
                const value = e.target.value;
                if(/^\d*$/.test(value)) {
                  setAge(value);
                }
              }}
            />
          </div>

          {/* Email input field */}
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              maxLength="254"
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "300px" }}
            />
          </div>

          {/* Password and Confirm Password input fields */}
          <div>
            <label>Password:</label>
            <input
              type="password"
              value={userPassword}
              min="8"
              maxLength="32"
              onChange={(e) => setUserPassword(e.target.value)}
            />

            <label>Confirm Password:</label>
            <input
              type="password"
              value={userConfirmPassword}
              min="8"
              maxLength="32"
              onChange={(e) => setUserConfirmPassword(e.target.value)}
            />
          </div>

          {/* Submit button */}
          <button type="submit">Submit</button>
        </form>
      )}
    </div> 
  );
};

export default SignUpPatient;