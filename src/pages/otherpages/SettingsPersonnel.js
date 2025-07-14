import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { db, auth } from "../../backend/firebaseConfig";
import { onAuthStateChanged, signOut, updatePassword } from "firebase/auth";
import { ref, get, update } from "firebase/database";
import useUserRole from "../../hooks/useUserRole";

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("Profile"); // Default to "Profile"
  const [user, setCurrentUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // State to toggle edit mode
  const [editedDetails, setEditedDetails] = useState({}); // State to store edited values
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [personnelType, setPersonnelType] = useState("DentistOwner"); // Default, but will update
  
  const userRoleFromHook = useUserRole();
  const userRole = location.state?.userRole || userRoleFromHook || "DentistOwner";

  // Fetch user details from the database
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user); // <-- store the whole user object
        fetchUserDetails(user.uid); // Fetch user details from the database
      } else {
        setCurrentUser(null);
        setUserDetails(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserDetails = async (uid) => {
    const types = ["DentistOwner", "AssociateDentist", "ClinicStaff"];
    for (const type of types) {
      const userRef = ref(db, `users/Personnel/${type}/${uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        setUserDetails(snapshot.val());
        setPersonnelType(type);
        break;
      }
    }
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
  const handleSave = () => {
    if (user) {
      const userRef = ref(db, `users/Personnel/${personnelType}/${user.uid}`);

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
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div
        style={{
          width: '250px',
          background: '#f4f4f4',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid #ddd',
        }}
      >
        <div>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: "10px" }}>
              <Link to={userRole === "ClinicStaff" ? "/dashboard-clinicstaff" : userRole === "AssociateDentist" ? "/dashboard-associatedentist" : "/dashboard-dentistowner"} state={{ userRole: userRole }} style={{ textDecoration: "none", color: "#333"}}>
                Dashboard
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/patient-record" state={{ userRole: userRole }} style={{ textDecoration: 'none', color: '#333' }}>
                Patient Record
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/inventory" state={{ userRole: userRole }} style={{ textDecoration: 'none', color: '#333' }}>
                Inventory
              </Link>
            </li>
            {userRole === "DentistOwner" && (
              <li style={{ marginBottom: '10px' }}>
                <Link to="/analytics" state={{ userRole: userRole }} style={{ textDecoration: 'none', color: '#333' }}>
                  Analytics
                </Link>
              </li>
            )}
            {userRole === "DentistOwner" && (
              <li style={{ marginBottom: '10px' }}>
                <Link to="/manage-personnel" state={{ userRole: userRole }} style={{ textDecoration: 'none', color: '#333' }}>
                  Manage Personnel
                </Link>
              </li>
            )}
            <li style={{ marginBottom: "10px" }}>
              <Link to="/settings-personnel" state={{ userRole: userRole }} style={{ textDecoration: "none", color: "#C7A76C", fontWeight: "bold" }}>
                Settings
              </Link>
            </li>
          </ul>
        </div>
        {/* User Profile and Logout */}
        <div>
          {userDetails && (
            <div style={{ display: "flex", alignItems: "center", marginBottom: "30px" }}>
              <img
                src={userDetails.profilePictureUrl || "https://via.placeholder.com/50"}
                alt="Profile"
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #ddd",
                  marginRight: "10px",
                }}
              />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span style={{ fontWeight: "bold", fontSize: "15px", textAlign: "left" }}>
                  {userDetails.firstName} {userDetails.middleName} {userDetails.lastName}
                </span>
                <span style={{ fontSize: "13px", color: "#555", textAlign: "left" }}>
                  {userDetails.email}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              background: '#f44336',
              color: 'white',
              border: 'none',
              padding: '10px',
              cursor: 'pointer',
              borderRadius: '5px',
              width: "100%",
            }}
          >
            Logout
          </button>
        </div>
      </div>
      {/* Main Content */}
      <div style={{ flex: 1, padding: 0, background: "#FAF7F3" }}>
        {/* Header Bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#fff",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          padding: "28px 32px 18px 32px",
          borderBottom: "1px solid #f0eae2",
          position: "sticky",
          top: 0,
          zIndex: 10
        }}>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "#23201A" }}>
            Settings
          </span>
        </div>
        {/* Main Content Container with padding */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
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
                    onClick={() => {
                      if (isEditing) {
                        setEditedDetails({}); // Reset edits on cancel
                      }
                      setIsEditing(!isEditing);
                    }}
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
                        {isEditing ? (
                          <select
                            defaultValue={userDetails.civilStatus || "Single"}
                            onChange={(e) => handleInputChange("civilStatus", e.target.value)}
                            style={{
                              width: "100%",
                              height: "45px",
                              padding: "5px",
                              border: "1px solid #ddd",
                              borderRadius: "5px",
                              background: "white",
                              fontSize: "14px",
                            }}
                          >
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Widowed">Widowed</option>
                            <option value="Divorced">Divorced</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={userDetails.civilStatus || "N/A"}
                            disabled
                            style={{
                              width: "100%",
                              height: "35px",
                              padding: "5px",
                              border: "1px solid #ddd",
                              borderRadius: "5px",
                              background: "#f4f4f4",
                              fontSize: "14px",
                            }}
                          />
                        )}
                      </div>
                      <div>
                        <label style={{ marginBottom: "5px", display: "block", textAlign: "left" }}>
                          <strong>Birthdate:</strong>
                        </label>
                        <input
                          type="date"
                          value={
                            isEditing
                              ? (editedDetails.birthDate !== undefined
                                  ? editedDetails.birthDate
                                  : userDetails.birthDate || "")
                              : userDetails.birthDate || ""
                          }
                          onChange={(e) => handleInputChange("birthDate", e.target.value)}
                          disabled={!isEditing}
                          style={{
                            width: "100%",
                            height: "35px",
                            padding: "5px",
                            border: "1px solid #ddd",
                            borderRadius: "5px",
                            background: isEditing ? "white" : "#f4f4f4",
                            fontSize: "14px",
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
                {/* Two-Factor Authentication Toggle (UI only, left-aligned, slide switch) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "30px",
                    padding: "15px 20px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    background: "#f9f9f9",
                    width: "fit-content"
                  }}
                >
                  <span style={{ fontWeight: "bold", fontSize: "16px", marginRight: "16px" }}>
                    Two-Factor Authentication
                  </span>
                  {/* Slide Switch */}
                  <label style={{ display: "flex", alignItems: "center", cursor: "pointer", marginLeft: 8 }}>
                    <input
                      type="checkbox"
                      checked={twoFactorEnabled}
                      onChange={() => setTwoFactorEnabled((prev) => !prev)}
                      style={{ display: "none" }}
                    />
                    <span
                      style={{
                        width: 40,
                        height: 22,
                        background: twoFactorEnabled ? "#007BFF" : "#ccc",
                        borderRadius: 22,
                        position: "relative",
                        transition: "background 0.2s",
                        display: "inline-block",
                        marginRight: 8,
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          left: twoFactorEnabled ? 20 : 2,
                          top: 2,
                          width: 18,
                          height: 18,
                          background: "#fff",
                          borderRadius: "50%",
                          transition: "left 0.2s",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.2)"
                        }}
                      />
                    </span>
                    <span style={{ fontWeight: "bold", color: twoFactorEnabled ? "#007BFF" : "#888" }}>
                      {twoFactorEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </label>
                </div>
                {/* New Password and Confirm Password */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (newPassword !== confirmPassword) {
                      alert("Passwords do not match!");
                      return;
                    }
                    if (!newPassword) {
                      alert("Password cannot be empty!");
                      return;
                    }
                    if (user) {
                      try {
                        // Update password in Firebase Authentication
                        await updatePassword(user, newPassword);

                        // Optionally update in your database for record-keeping
                        const userRef = ref(db, `users/Personnel/${personnelType}/${user.uid}`);
                        await update(userRef, { userPassword: newPassword });

                        alert("Password updated successfully!");
                        setNewPassword("");
                        setConfirmPassword("");
                      } catch (error) {
                        alert("Failed to update password. " + error.message);
                      }
                    }
                  }}
                  style={{ maxWidth: 400, margin: "0 0 0 0" }}
                >
                  <div style={{ marginBottom: "15px", textAlign: "left" }}>
                    <label style={{ fontWeight: "bold" }}>New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ddd",
                        borderRadius: "5px",
                        marginTop: "5px"
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: "20px", textAlign: "left" }}>
                    <label style={{ fontWeight: "bold" }}>Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ddd",
                        borderRadius: "5px",
                        marginTop: "5px"
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      background: "#28a745",
                      color: "white",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "5px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      width: "100%"
                    }}
                  >
                    Save Changes
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;