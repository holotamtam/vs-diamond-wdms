import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db, auth } from "../../backend/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, onValue, update } from "firebase/database";

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Profile"); // Default to "Profile"
  const [currentUser, setCurrentUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // State to toggle edit mode
  const [editedDetails, setEditedDetails] = useState({}); // State to store edited values


  // Fetch user details from the database
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchUserDetails(user.uid); // Fetch user details from the database
      } else {
        setCurrentUser(null);
        setUserDetails(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserDetails = (userId) => {
    const usersRef = ref(db, "users/Patient");

    onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const users = snapshot.val();
        const userData = Object.values(users).find((user) => user.uid === userId);
        if (userData) {
          setUserDetails(userData);
        }
      }
    });
  };

   // Handle logout
    const handleLogout = () => {
      signOut(auth).then(() => {
        navigate("/", { replace: true });
      });
    };

    // Handle input changes
  const handleInputChange = (field, value) => {
    setEditedDetails((prevDetails) => ({
      ...prevDetails,
      [field]: value,
    }));
  };

  // Handle save changes
  // Handle save changes
const handleSave = () => {
  if (currentUser) {
    const userRef = ref(db, `users/Patient/${currentUser.uid}`);

    // Merge edited details with existing user details
    const updatedDetails = {
      ...userDetails, // Existing user data
      ...editedDetails, // Only the fields that were edited
    };

    update(userRef, updatedDetails)
      .then(() => {
        setUserDetails(updatedDetails); // Update local state with the new data
        setIsEditing(false); // Exit edit mode
        alert("Profile updated successfully!");
      })
      .catch((error) => {
        console.error("Error updating profile:", error);
        alert("Failed to update profile. Please try again.");
      });
  }
};

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div
        style={{
          width: "250px",
          background: "#f4f4f4",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          borderRight: "1px solid #ddd",
        }}
      >
        <div>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li style={{ marginBottom: "20px" }}>
              <Link
                to="/dashboard-patient"
                style={{
                  textDecoration: "none",
                  color: "#333",
                }}
              >
                Dashboard
              </Link>
            </li>
            <li style={{ marginBottom: "20px" }}>
              <Link
                to="/treatment-history"
                style={{
                  textDecoration: "none",
                  color: "#333",
                }}
              >
                Treatment History
              </Link>
            </li>
            <li style={{ marginBottom: "20px" }}>
              <Link
                to="/settings"
                style={{
                  textDecoration: "none",
                  color: "#007BFF", // Highlight the active link
                  fontWeight: "bold",
                }}
              >
                Settings
              </Link>
            </li>
          </ul>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: "#f44336",
            color: "white",
            border: "none",
            padding: "10px",
            cursor: "pointer",
            borderRadius: "5px",
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "20px" }}>
        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
          <button
            onClick={() => setActiveTab("Profile")}
            style={{
              background: activeTab === "Profile" ? "#007BFF" : "#f4f4f4",
              color: activeTab === "Profile" ? "white" : "#333",
              border: "1px solid #ddd",
              padding: "10px 20px",
              cursor: "pointer",
              borderRadius: "5px",
            }}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("Security")}
            style={{
              background: activeTab === "Security" ? "#007BFF" : "#f4f4f4",
              color: activeTab === "Security" ? "white" : "#333",
              border: "1px solid #ddd",
              padding: "10px 20px",
              cursor: "pointer",
              borderRadius: "5px",
            }}
          >
            Security
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ border: "1px solid #ddd", padding: "20px", borderRadius: "5px" }}>
          {activeTab === "Profile" && (
            <div style={{ textAlign: "center" }}>
              {/* Edit Profile Buttons */}
              <div style={{ textAlign: "right", marginBottom: "20px" }}>
                {isEditing && (
                  <button
                    onClick={handleSave}
                    style={{
                      background: "#28a745",
                      color: "white",
                      border: "none",
                      padding: "10px 20px",
                      cursor: "pointer",
                      borderRadius: "5px",
                      marginRight: "10px",
                    }}
                  >
                    Save
                  </button>
                )}
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  style={{
                    background: isEditing ? "#f44336" : "#007BFF",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    cursor: "pointer",
                    borderRadius: "5px",
                  }}
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </button>
              </div>

              {/* Profile Picture */}
              <div style={{ marginBottom: "20px" }}>
                <img
                  src="https://via.placeholder.com/150" // Replace with the actual profile picture URL
                  alt="Profile"
                  style={{
                    width: "150px",
                    height: "150px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #ddd",
                  }}
                />
              </div>

             {/* Profile Information */}
{userDetails ? (
  <div>
    {/* First Row: Name, Email, and Contact Number */}
    <div
      style={{
       display: "grid",
        gridTemplateColumns: "430px 430px 430px", // Fixed widths for all columns
        gap: "20px", // Space between columns
        marginBottom: "20px",
        alignItems: "start", // Align content to the top
      }}
    >
      <div>
        <label style={{ marginBottom: "5px", display: "block", textAlign: "left" }}>
          <strong>Name:</strong>
        </label>
        <div
          style={{
            width: "100%", // Match column width
            padding: "5px",
            height: "35px", // Consistent height
            border: "1px solid #ddd",
            borderRadius: "5px",
            background: "#f4f4f4", // Non-editable background
            display: "flex",
            alignItems: "center", // Vertically align content
            fontSize: "14px", // Consistent font size
          }}
        >
          {userDetails.firstName} {userDetails.middleName} {userDetails.lastName}
        </div>
      </div>
      <div>
        <label style={{ marginBottom: "5px", display: "block", textAlign: "left" }}>
          <strong>Email Address:</strong>
        </label>
        <div
          style={{
            width: "100%", // Match column width
            height: "35px", // Consistent height
            padding: "5px",
            border: "1px solid #ddd",
            borderRadius: "5px",
            background: "#f4f4f4", // Non-editable background
            display: "flex",
            alignItems: "center", // Vertically align content
            fontSize: "14px", // Consistent font size
          }}
        >
          {userDetails.email}
        </div>
      </div>
      <div>
        <label style={{ marginBottom: "5px", display: "block", textAlign: "left" }}>
          <strong>Contact Number:</strong>
        </label>
        <div
          style={{
            width: "100%", // Match column width
            height: "35px", // Consistent height
            padding: "5px",
            border: "1px solid #ddd",
            borderRadius: "5px",
            background: "#f4f4f4", // Non-editable background
            display: "flex",
            alignItems: "center", // Vertically align content
            fontSize: "14px", // Consistent font size
          }}
        >
          {userDetails.contactNumber || "N/A"}
        </div>
      </div>
    </div>

    {/* Second Row: Civil Status, Birthdate, and Occupation */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "430px 430px 430px", // Fixed widths for all columns
        gap: "20px", // Space between columns
        marginBottom: "20px",
        alignItems: "start", // Align content to the top
      }}
    >
      <div>
        <label style={{ marginBottom: "5px", display: "block", textAlign: "left" }}>
          <strong>Civil Status:</strong>
        </label>
        <input
          type="text"
          defaultValue={userDetails.civilStatus || "N/A"}
          disabled={!isEditing} // Disable input if not editing
          onChange={(e) => handleInputChange("civilStatus", e.target.value)}
          style={{
            width: "100%", // Match column width
            height: "35px", // Consistent height
            padding: "5px",
            border: "1px solid #ddd",
            borderRadius: "5px",
            background: isEditing ? "white" : "#f4f4f4",
            fontSize: "14px", // Consistent font size
          }}
        />
      </div>
      <div>
        <label style={{ marginBottom: "5px", display: "block", textAlign: "left" }}>
          <strong>Birthdate:</strong>
        </label>
        <input
          type="date"
          defaultValue={userDetails.birthDate || ""}
          disabled={!isEditing} // Disable input if not editing
          style={{
            width: "100%", // Match column width
            height: "35px", // Consistent height
            padding: "5px",
            border: "1px solid #ddd",
            borderRadius: "5px",
            background: isEditing ? "white" : "#f4f4f4",
            fontSize: "14px", // Consistent font size
          }}
        />
      </div>
      <div>
        <label style={{ marginBottom: "5px", display: "block", textAlign: "left" }}>
          <strong>Occupation:</strong>
        </label>
        <input
          type="text"
          defaultValue={userDetails.occupation || "N/A"}
          disabled={!isEditing} // Disable input if not editing
          style={{
            width: "100%", // Match column width
            height: "35px", // Consistent height
            padding: "5px",
            border: "1px solid #ddd",
            borderRadius: "5px",
            background: isEditing ? "white" : "#f4f4f4",
            fontSize: "14px", // Consistent font size
          }}
        />
      </div>
    </div>

    {/* Third Row: Address */}
<div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr", // Single column for address
    gap: "20px", // Space between rows
    marginBottom: "20px",
    alignItems: "start", // Align content to the top
  }}
>
  <div>
    <label style={{ marginBottom: "5px", display: "block", textAlign: "left" }}>
      <strong>Address:</strong>
    </label>
    <input
      type="text"
      defaultValue={userDetails.address || "N/A"}
      disabled={!isEditing} // Disable textarea if not editing
      onChange={(e) => handleInputChange("address", e.target.value)}
      style={{
        width: "100%", // Full width for address
        height: "35px", // Consistent height
        padding: "5px",
        border: "1px solid #ddd",
        borderRadius: "5px",
        background: isEditing ? "white" : "#f4f4f4",
        fontSize: "14px", // Consistent font size
      }}
    />
  </div>
</div>
  </div>
) : (
  <p>Loading profile information...</p>
)}
            </div>
          )}
          {activeTab === "Security" && (
            <div>
              <h2>Security Settings</h2>
              <p>
                Here you can update your password, enable two-factor authentication, and manage
                security settings.
              </p>
              {/* Add Security-related form or content here */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;