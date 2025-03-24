import React from "react";

const SignUpForm = ({
  title,
  firstName,
  setFirstName,
  middleName,
  setMiddleName,
  lastName,
  setLastName,
  address,
  setAddress,
  contactNumber,
  setContactNumber,
  civilStatus,
  setCivilStatus,
  gender,
  setGender,
  birthDate,
  setBirthDate,
  age,
  setAge,
  email,
  setEmail,
  userPassword,
  setUserPassword,
  userConfirmPassword,
  setUserConfirmPassword,
  handleSubmit
}) => {
  return (
    <form onSubmit={handleSubmit}>
      <h3>{title}</h3>
      <div>
        <label>First Name:</label>
        <input
          type="text"
          value={firstName}
          maxLength="50"
          onChange={(e) => {
            const value = e.target.value;
            if (/^[A-Za-z\s]*$/.test(value)) {
              setFirstName(value.replace(/\b\w/g, (char) => char.toUpperCase()));
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
            if (/^[A-Za-z\s]*$/.test(value)) {
              setMiddleName(value.replace(/\b\w/g, (char) => char.toUpperCase()));
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
            if (/^[A-Za-z\s]*$/.test(value)) {
              setLastName(value.replace(/\b\w/g, (char) => char.toUpperCase()));
            }
          }}
        />
      </div>

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
            if (/^\d*$/.test(value)) {
              setContactNumber(value);
            }
          }}
        />
      </div>

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

            const today = new Date();
            const birthDate = new Date(birthDateValue);

            if (birthDate > today) {
              alert("Birthdate cannot be in the future.");
              setAge("");
              return;
            }

            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            const dayDiff = today.getDate() - birthDate.getDate();

            if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
              age--;
            }

            setAge(age);
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
            if (/^\d*$/.test(value)) {
              setAge(value);
            }
          }}
        />
      </div>

      <div>
        <label>Gender</label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          >
          <option value="">Select</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          </select>
      </div>

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

      <button type="submit">Submit</button>
    </form>
  );
};

export default SignUpForm;