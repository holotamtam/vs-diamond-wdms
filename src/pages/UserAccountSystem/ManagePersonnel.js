import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDatabase, ref, get, remove } from "firebase/database";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import app from "../../backend/firebaseConfig";
import { onValue } from "firebase/database";
import { db } from "../../backend/firebaseConfig";

const ManagePersonnel = () => {
    const [clinicStaff, setClinicStaff] = useState([]);
    const [dentistOwner, setDentistOwner] = useState([]);
    const [associateDentist, setAssociateDentist] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [userDetails, setUserDetails] = useState(null);

    const navigate = useNavigate();
    const auth = getAuth(app);

    // listen for authentication state changes to get the current user ID
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                setCurrentUserId(user.uid);
            }
        });

        return () => unsubscribe();
    }, [auth]);

    // fetch personnel data from Firebase Realtime Database
    useEffect(() => {
        const fetchPersonnel = async () => {
            const db = getDatabase(app);
            const clinicStaffRef = ref(db, "users/Personnel/ClinicStaff");
            const dentistOwnerRef = ref(db, "users/Personnel/DentistOwner");
            const associateDentistRef = ref(db, "users/Personnel/AssociateDentist");

            try {
                const [clinicStaffSnap, dentistOwnerSnap, associateDentistSnap] = await Promise.all([
                    get(clinicStaffRef),
                    get(dentistOwnerRef),
                    get(associateDentistRef),
                ]);

                if (clinicStaffSnap.exists()) {
                    setClinicStaff(Object.entries(clinicStaffSnap.val()).map(([id, data]) => ({ id, ...data })));
                }

                if (dentistOwnerSnap.exists()) {
                    setDentistOwner(Object.entries(dentistOwnerSnap.val()).map(([id, data]) => ({ id, ...data })));
                }

                if (associateDentistSnap.exists()) {
                    setAssociateDentist(Object.entries(associateDentistSnap.val()).map(([id, data]) => ({ id, ...data })));
                }
            } catch (error) {
                console.error("Error fetching personnel:", error);
            }
        };

        fetchPersonnel();
    }, []);


    // Fetch user details for sidebar profile (search all personnel types)
  useEffect(() => {
    const personnelTypes = ["DentistOwner", "AssociateDentist", "ClinicStaff"];
    let unsubscribes = [];
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        let found = false;
        personnelTypes.forEach(type => {
          const userRef = ref(db, `users/Personnel/${type}/${user.uid}`);
          const unsub = onValue(userRef, (snapshot) => {
            if (snapshot.exists() && !found) {
              setUserDetails(snapshot.val());
              found = true;
              unsubscribes.forEach(u => u());
            }
          });
          unsubscribes.push(() => unsub());
        });
      }
    });
    return () => {
      unsubscribeAuth();
      unsubscribes.forEach(u => u());
    };
  }, [auth]);

    // function to handle deletion of personnel accounts
    const handleDelete = async (userType, id, personName) => {
        // Show confirmation dialog before deletion
        const isConfirmed = window.confirm(
            `Are you sure you want to delete ${personName} (${userType})?\n\nThis action cannot be undone.`
        );

        if (!isConfirmed) {
            return; // User cancelled the deletion
        }

        const db = getDatabase(app);
        const userRef = ref(db, `users/Personnel/${userType}/${id}`);

        try {
            await remove(userRef);
            alert(`${userType} deleted successfully!`);

            if (userType === "ClinicStaff") {
                setClinicStaff(clinicStaff.filter(person => person.id !== id));
            } else if (userType === "DentistOwner") {
                setDentistOwner(dentistOwner.filter(person => person.id !== id));
            } else if (userType === "AssociateDentist") {
                setAssociateDentist(associateDentist.filter(person => person.id !== id));
            }
        } catch (error) {
            console.error("Error deleting personnel:", error);
            alert("Failed to delete personnel.");
        }
    };

    // handle logout
    const handleLogout = () => {
        signOut(auth).then(() => {
            navigate("/", { replace: true });
        });
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
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: "10px" }}>
              <Link to="/dashboard-dentistowner" state={{ userRole: "DentistOwner" }} style={{ textDecoration: "none", color: "#333" }}>
                Dashboard
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/patient-record" state={{ userRole: "DentistOwner" }} style={{ textDecoration: 'none', color: '#333' }}>
                Patient Record
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/inventory" state={{ userRole: "DentistOwner" }} style={{ textDecoration: 'none', color: '#333' }}>
                Inventory
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/revenue" state={{ userRole: "DentistOwner" }} style={{ textDecoration: 'none', color: '#333' }}>
                Revenue
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/manage-personnel" state={{ userRole: "DentistOwner" }} style={{ textDecoration: 'none', color: '#333', fontWeight: "bold" }}>
                Manage Personnel
              </Link>
            </li>
            <li style={{ marginBottom: "10px" }}>
              <Link to="/settings-personnel" state={{ userRole: "DentistOwner" }} style={{ textDecoration: "none", color: "#333" }}>
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
              background: "#f44336",
              color: "white",
              border: "none",
              padding: "10px",
              cursor: "pointer",
              borderRadius: "5px",
              width: "100%",
            }}
          >
            Logout
          </button>
        </div>
      </div>
            {/* Main Content */}
            <div style={{ flex: 1, padding: "20px" }}>
                <h2>Manage Personnel</h2>

                <div>
                    <Link to="/sign-up-clinicstaff"><button>Add Clinic Staff</button></Link>
                    <Link to="/sign-up-dentistowner"><button>Add Dentist Owner</button></Link>
                    <Link to="/sign-up-associatedentist"><button>Add Associate Dentist</button></Link>
                </div>

                <h3>Clinic Staff</h3>
                <ul>
                    {clinicStaff.length > 0 ? (
                        clinicStaff.map(person => (
                            <li key={person.id}>
                                {person.firstName} {person.lastName} ({person.email})
                                <button onClick={() => handleDelete("ClinicStaff", person.id, `${person.firstName} ${person.lastName}`)}>Delete</button>
                            </li>
                        ))
                    ) : (
                        <p>No Clinic Staff found.</p>
                    )}
                </ul>

                <h3>Dentist Owner</h3>
                <ul>
                    {dentistOwner.length > 0 ? (
                        dentistOwner.map(person => {
                            const isCurrentUser = person.uid === currentUserId;
                            return (
                                <li
                                    key={person.id}
                                    style={{
                                        backgroundColor: isCurrentUser ? "#e6f7ff" : "transparent",
                                        padding: "8px",
                                        borderRadius: "5px",
                                        marginBottom: "6px"
                                    }}
                                >
                                    {person.firstName} {person.lastName} ({person.email}){" "}
                                    {isCurrentUser ? (
                                        <strong>(You)</strong>
                                    ) : (
                                        <button onClick={() => handleDelete("DentistOwner", person.id, `${person.firstName} ${person.lastName}`)}>Delete</button>
                                    )}
                                </li>
                            );
                        })
                    ) : (
                        <p>No Dentist Owner found.</p>
                    )}
                </ul>

                <h3>Associate Dentists</h3>
                <ul>
                    {associateDentist.length > 0 ? (
                        associateDentist.map(person => (
                            <li key={person.id}>
                                {person.firstName} {person.lastName} ({person.email})
                                <button onClick={() => handleDelete("AssociateDentist", person.id, `${person.firstName} ${person.lastName}`)}>Delete</button>
                            </li>
                        ))
                    ) : (
                        <p>No Associate Dentists found.</p>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default ManagePersonnel;