import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDatabase, ref, get, remove, set, push } from "firebase/database";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import app from "../../backend/firebaseConfig";
import { onValue, ref as dbRef } from "firebase/database";
import { db } from "../../backend/firebaseConfig";

const ManagePersonnel = () => {
    const [clinicStaff, setClinicStaff] = useState([]);
    const [dentistOwner, setDentistOwner] = useState([]);
    const [associateDentist, setAssociateDentist] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [filter, setFilter] = useState("all");
    const [patientCounts, setPatientCounts] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [editingPerson, setEditingPerson] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [newStaffType, setNewStaffType] = useState("ClinicStaff");
    const [newStaffEmail, setNewStaffEmail] = useState("");
    const [newStaffPassword, setNewStaffPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                for (const type of personnelTypes) {
                    const userRef = ref(db, `users/Personnel/${type}/${user.uid}`);
                    const snapshot = await get(userRef);
                    if (snapshot.exists()) {
                        setUserDetails(snapshot.val());
                        break;
                    }
                }
            }
        });
        return () => {
            authUnsubscribe();
        };
    }, [auth]);

    // Fetch all appointments and count unique patients per dentist
    useEffect(() => {
        const appointmentsRef = dbRef(db, "appointments");
        onValue(appointmentsRef, (snapshot) => {
            const data = snapshot.val();
            const dentistPatientMap = {};
            if (data) {
                Object.values(data).forEach((dateGroup) => {
                    Object.values(dateGroup).forEach((appt) => {
                        // Only count completed appointments
                        if ((appt.status === "Completed" || appt.status === "Confirmed") && appt.dentist) {
                            if (!dentistPatientMap[appt.dentist]) {
                                dentistPatientMap[appt.dentist] = new Set();
                            }
                            // Use patient email or uid as unique identifier
                            dentistPatientMap[appt.dentist].add(appt.patientEmail || appt.email || appt.uid);
                        }
                    });
                });
            }
            // Convert sets to counts
            const counts = {};
            Object.entries(dentistPatientMap).forEach(([dentist, patients]) => {
                counts[dentist] = patients.size;
            });
            setPatientCounts(counts);
        });
    }, []);

    // Filtering logic
    let filteredClinicStaff = clinicStaff;
    let filteredDentistOwner = dentistOwner;
    let filteredAssociateDentist = associateDentist;
    if (filter === "clinicstaff") {
        filteredDentistOwner = [];
        filteredAssociateDentist = [];
    } else if (filter === "associatedentist") {
        filteredClinicStaff = [];
        filteredDentistOwner = [];
    } else if (filter === "dentistowner") {
        filteredClinicStaff = [];
        filteredAssociateDentist = [];
    }

    // Search filter logic
    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
    };

    const searchLower = searchTerm.toLowerCase();
    const filterPersonnel = (list, type) =>
        list.filter(person => {
            const name = `${person.firstName} ${person.middleName || ''} ${person.lastName}`.toLowerCase();
            const email = (person.email || '').toLowerCase();
            const specialty = (person.specialty || person.position || '').toLowerCase();
            return (
                name.includes(searchLower) ||
                email.includes(searchLower) ||
                specialty.includes(searchLower)
            );
        });

    filteredClinicStaff = filterPersonnel(filteredClinicStaff, 'ClinicStaff');
    filteredDentistOwner = filterPersonnel(filteredDentistOwner, 'DentistOwner');
    filteredAssociateDentist = filterPersonnel(filteredAssociateDentist, 'AssociateDentist');

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

    // function to handle editing specialty/position
    const handleEditSpecialty = async (userType, id, currentValue) => {
        setEditingPerson({ userType, id });
        setEditValue(currentValue || "");
    };

    // function to save specialty/position changes
    const handleSaveSpecialty = async () => {
        if (!editingPerson || !editValue.trim()) {
            alert("Please enter a valid specialty/position.");
            return;
        }

        const db = getDatabase(app);
        const userRef = ref(db, `users/Personnel/${editingPerson.userType}/${editingPerson.id}`);

        try {
            // Update the specialty/position field
            const updateData = {};
            if (editingPerson.userType === "ClinicStaff") {
                updateData.position = editValue.trim();
            } else {
                updateData.specialty = editValue.trim();
            }

            await set(ref(db, `users/Personnel/${editingPerson.userType}/${editingPerson.id}`), {
                ...(editingPerson.userType === "ClinicStaff" ? clinicStaff.find(p => p.id === editingPerson.id) : 
                    editingPerson.userType === "DentistOwner" ? dentistOwner.find(p => p.id === editingPerson.id) :
                    associateDentist.find(p => p.id === editingPerson.id)),
                ...updateData
            });

            // Update local state
            if (editingPerson.userType === "ClinicStaff") {
                setClinicStaff(clinicStaff.map(person => 
                    person.id === editingPerson.id ? { ...person, position: editValue.trim() } : person
                ));
            } else if (editingPerson.userType === "DentistOwner") {
                setDentistOwner(dentistOwner.map(person => 
                    person.id === editingPerson.id ? { ...person, specialty: editValue.trim() } : person
                ));
            } else if (editingPerson.userType === "AssociateDentist") {
                setAssociateDentist(associateDentist.map(person => 
                    person.id === editingPerson.id ? { ...person, specialty: editValue.trim() } : person
                ));
            }

            alert("Specialty/Position updated successfully!");
            setEditingPerson(null);
            setEditValue("");
        } catch (error) {
            console.error("Error updating specialty/position:", error);
            alert("Failed to update specialty/position.");
        }
    };

    // function to cancel editing
    const handleCancelEdit = () => {
        setEditingPerson(null);
        setEditValue("");
    };

    // Add Staff/Personnel modal submit handler
    const handleAddPersonnel = async (e) => {
        e.preventDefault();
        if (!newStaffEmail || !newStaffPassword) {
            alert("Please provide both email/mobile and password.");
            return;
        }
        setIsSubmitting(true);
        try {
            const db = getDatabase(app);
            // Format date as MM/DD/YYYY HH:mm
            const now = new Date();
            const pad = (n) => n.toString().padStart(2, '0');
            const formattedDate = `${pad(now.getMonth() + 1)}/${pad(now.getDate())}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
            // Save under 'pendingPersonnel' with a generated key
            const newRef = push(ref(db, `pendingPersonnel`));
            await set(newRef, {
                email: newStaffEmail,
                password: newStaffPassword,
                type: newStaffType,
                createdAt: formattedDate,
                status: "pending"
            });
            alert("Staff/Personnel added successfully! Share the credentials with the staff for first-time login.");
            setShowAddModal(false);
            setNewStaffType("ClinicStaff");
            setNewStaffEmail("");
            setNewStaffPassword("");
        } catch (error) {
            alert("Failed to add personnel: " + error.message);
        }
        setIsSubmitting(false);
    };

    return (
        <div style={{ display: "flex", height: "100vh", background: "#fcf7f1" }}>
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
              <Link to="/analytics" state={{ userRole: "DentistOwner" }} style={{ textDecoration: 'none', color: '#333' }}>
                Analytics
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/manage-personnel" state={{ userRole: "DentistOwner" }} style={{ textDecoration: 'none', color: '#C7A76C', fontWeight: "bold" }}>
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
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: "#fcf7f1" }}>
                {/* Header Bar (updated style) */}
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
                    zIndex: 10,
                    marginBottom: 32
                }}>
                    <span style={{ fontWeight: 700, fontSize: "24px", color: "#3d342b", letterSpacing: 0.5 }}>Personnel Management</span>
                    <div>
                        <button
                            style={{ background: '#C7A76C', color: 'white', border: 'none', borderRadius: 20, padding: '10px 24px', fontWeight: 500, cursor: 'pointer', fontSize: 16 }}
                            onClick={() => setShowAddModal(true)}
                        >
                            Add Staff/Personnel
                        </button>
                    </div>
                </div>
                {/* Add Staff/Personnel Modal */}
                {showAddModal && (
                    <div style={{
                        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
                    }}>
                        <div style={{ background: "#fff", borderRadius: 16, padding: 36, minWidth: 400, position: "relative" }}>
                            <button onClick={() => setShowAddModal(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "1px solid #ccc", borderRadius: "50%", width: 32, height: 32, fontSize: 18, cursor: "pointer" }}>×</button>
                            <h2 style={{ textAlign: "center", marginBottom: 24 }}>Add Personnel</h2>
                            <form onSubmit={handleAddPersonnel} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                                <label style={{ fontWeight: 500 }}>Staff Type</label>
                                <select value={newStaffType} onChange={e => setNewStaffType(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #C7A76C', fontSize: 16 }}>
                                    <option value="ClinicStaff">Clinic Staff</option>
                                    <option value="AssociateDentist">Associate Dentist</option>
                                    <option value="DentistOwner">Dentist Owner</option>
                                </select>
                                <label style={{ fontWeight: 500 }}>Email/Mobile Number</label>
                                <input type="text" value={newStaffEmail} onChange={e => setNewStaffEmail(e.target.value)} style={{ padding: 10, borderRadius: 6, border: '1px solid #C7A76C', fontSize: 16 }} />
                                <label style={{ fontWeight: 500 }}>Password</label>
                                <input type="text" value={newStaffPassword} onChange={e => setNewStaffPassword(e.target.value)} style={{ padding: 10, borderRadius: 6, border: '1px solid #C7A76C', fontSize: 16 }} />
                                <button type="submit" disabled={isSubmitting} style={{ background: '#C7A76C', color: 'white', border: 'none', borderRadius: 20, padding: '12px 0', fontWeight: 600, fontSize: 17, marginTop: 18, cursor: 'pointer' }}>{isSubmitting ? 'Submitting...' : 'Submit'}</button>
                            </form>
                        </div>
                    </div>
                )}
                {/* Main Content Padding Wrapper */}
                <div style={{ padding: "0 36px", overflow: "hidden" }}>
                    {/* Summary Cards */}
                    <div style={{ display: 'flex', gap: 24, marginBottom: 28 }}>
                        <div style={{ flex: 1, background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px #0001', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span style={{ color: '#888', fontSize: 15 }}>Total Staff <span role="img" aria-label="staff">👥</span></span>
                            <span style={{ fontSize: 32, fontWeight: 600 }}>{clinicStaff.length + dentistOwner.length + associateDentist.length}</span>
                        </div>
                        <div style={{ flex: 1, background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px #0001', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span style={{ color: '#888', fontSize: 15 }}>Total Dentists <span role="img" aria-label="dentist">🦷</span></span>
                            <span style={{ fontSize: 32, fontWeight: 600 }}>{dentistOwner.length + associateDentist.length}</span>
                        </div>
                    </div>
                    {/* Filter Buttons and Search */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
                        {/* Filter Buttons */}
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <button
                                style={{ 
                                    background: filter === "all" ? '#C7A76C' : '#fff', 
                                    color: filter === "all" ? 'white' : '#C7A76C', 
                                    border: '1px solid #C7A76C', 
                                    borderRadius: 8, 
                                    padding: '7px 18px', 
                                    fontWeight: 500, 
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    minWidth: 'fit-content'
                                }}
                                onClick={() => setFilter("all")}
                            >
                                All Personnel
                            </button>
                            <button
                                style={{ 
                                    background: filter === "clinicstaff" ? '#C7A76C' : '#fff', 
                                    color: filter === "clinicstaff" ? 'white' : '#C7A76C', 
                                    border: '1px solid #C7A76C', 
                                    borderRadius: 8, 
                                    padding: '7px 18px', 
                                    fontWeight: 500, 
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    minWidth: 'fit-content'
                                }}
                                onClick={() => setFilter("clinicstaff")}
                            >
                                Clinic Staff
                            </button>
                            <button
                                style={{ 
                                    background: filter === "associatedentist" ? '#C7A76C' : '#fff', 
                                    color: filter === "associatedentist" ? 'white' : '#C7A76C', 
                                    border: '1px solid #C7A76C', 
                                    borderRadius: 8, 
                                    padding: '7px 18px', 
                                    fontWeight: 500, 
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    minWidth: 'fit-content'
                                }}
                                onClick={() => setFilter("associatedentist")}
                            >
                                Associate Dentists
                            </button>
                            <button
                                style={{ 
                                    background: filter === "dentistowner" ? '#C7A76C' : '#fff', 
                                    color: filter === "dentistowner" ? 'white' : '#C7A76C', 
                                    border: '1px solid #C7A76C', 
                                    borderRadius: 8, 
                                    padding: '7px 18px', 
                                    fontWeight: 500, 
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    minWidth: 'fit-content'
                                }}
                                onClick={() => setFilter("dentistowner")}
                            >
                                Dentist Owners
                            </button>
                        </div>
                        {/* Search Bar - fixed positioning */}
                        <div style={{ display: 'flex', alignItems: 'center', minWidth: 220, maxWidth: 220 }}>
                            <div style={{ display: 'flex', alignItems: 'center', width: '100%', position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Search"
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        borderBottom: '2px solid #C7A76C',
                                        outline: 'none',
                                        fontSize: 20,
                                        color: '#bca77b',
                                        width: '100%',
                                        padding: '6px 32px 6px 0',
                                        textAlign: 'left',
                                        fontWeight: 400,
                                        letterSpacing: 0.2
                                    }}
                                />
                                <svg width="24" height="24" fill="none" stroke="#bca77b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ position: 'absolute', right: 0 }}>
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    {/* Personnel Cards Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, overflow: 'hidden' }}>
                        {/* Dentist Owners */}
                        {filteredDentistOwner.map(person => {
                            const isCurrentUser = person.id === currentUserId;
                            const displayName = `Dr. ${person.firstName} ${person.lastName} ${isCurrentUser ? '(You)' : '(Owner)'}`;
                            const lookupName = `Dr. ${person.firstName} ${person.lastName} (Owner)`;
                            const isEditing = editingPerson && editingPerson.userType === "DentistOwner" && editingPerson.id === person.id;
                            
                            return (
                                <div key={person.id} style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 8px #0001', padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <img src={person.profilePictureUrl || 'https://via.placeholder.com/60'} alt="Profile" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: 17 }}>{displayName}</div>
                                            <div style={{ color: '#C7A76C', fontWeight: 500, fontSize: 14 }}>Dentist Owner</div>
                                            <div style={{ color: '#888', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {isEditing ? (
                                                    <>
                                                        <input
                                                            type="text"
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            style={{
                                                                border: '1px solid #C7A76C',
                                                                borderRadius: 4,
                                                                padding: '2px 6px',
                                                                fontSize: 13,
                                                                width: '120px'
                                                            }}
                                                            placeholder="Enter specialty"
                                                        />
                                                        <button 
                                                            onClick={handleSaveSpecialty}
                                                            style={{
                                                                background: '#4CAF50',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: 3,
                                                                padding: '2px 6px',
                                                                fontSize: 11,
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Save
                                                        </button>
                                                        <button 
                                                            onClick={handleCancelEdit}
                                                            style={{
                                                                background: '#f44336',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: 3,
                                                                padding: '2px 6px',
                                                                fontSize: 11,
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        {person.specialty || 'General Dentistry'}
                                                        <button
                                                            onClick={() => handleEditSpecialty("DentistOwner", person.id, person.specialty)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                padding: 2,
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}
                                                            title="Edit specialty"
                                                        >
                                                            ✏️
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
                                        <span style={{ fontSize: 15 }}>✉️ {person.email}</span>
                                        <span style={{ fontSize: 15 }}>📞 {person.contactNumber || 'N/A'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
                                        <span style={{ fontSize: 15 }}>🗂️ {patientCounts[lookupName] || 0} patients</span>
                                    </div>
                                    {!isCurrentUser && (
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                                            <button onClick={() => handleDelete("DentistOwner", person.id, `${person.firstName} ${person.lastName}`)} style={{ background: 'none', border: 'none', color: '#f44336', cursor: 'pointer', fontWeight: 500 }}>Delete</button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {/* Associate Dentists */}
                        {filteredAssociateDentist.map(person => {
                            const displayName = `Dr. ${person.firstName} ${person.lastName} (Associate)`;
                            const lookupName = `Dr. ${person.firstName} ${person.lastName} (Associate)`;
                            const isEditing = editingPerson && editingPerson.userType === "AssociateDentist" && editingPerson.id === person.id;
                            
                            return (
                                <div key={person.id} style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 8px #0001', padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <img src={person.profilePictureUrl || 'https://via.placeholder.com/60'} alt="Profile" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: 17 }}>{displayName}</div>
                                            <div style={{ color: '#C7A76C', fontWeight: 500, fontSize: 14 }}>Associate Dentist</div>
                                            <div style={{ color: '#888', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {isEditing ? (
                                                    <>
                                                        <input
                                                            type="text"
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            style={{
                                                                border: '1px solid #C7A76C',
                                                                borderRadius: 4,
                                                                padding: '2px 6px',
                                                                fontSize: 13,
                                                                width: '120px'
                                                            }}
                                                            placeholder="Enter specialty"
                                                        />
                                                        <button 
                                                            onClick={handleSaveSpecialty}
                                                            style={{
                                                                background: '#4CAF50',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: 3,
                                                                padding: '2px 6px',
                                                                fontSize: 11,
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Save
                                                        </button>
                                                        <button 
                                                            onClick={handleCancelEdit}
                                                            style={{
                                                                background: '#f44336',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: 3,
                                                                padding: '2px 6px',
                                                                fontSize: 11,
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        {person.specialty || 'General Dentistry'}
                                                        <button
                                                            onClick={() => handleEditSpecialty("AssociateDentist", person.id, person.specialty)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                padding: 2,
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}
                                                            title="Edit specialty"
                                                        >
                                                            ✏️
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
                                        <span style={{ fontSize: 15 }}>✉️ {person.email}</span>
                                        <span style={{ fontSize: 15 }}>📞 {person.contactNumber || 'N/A'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
                                        <span style={{ fontSize: 15 }}>🗂️ {patientCounts[lookupName] || 0} patients</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                                        <button onClick={() => handleDelete("AssociateDentist", person.id, `${person.firstName} ${person.lastName}`)} style={{ background: 'none', border: 'none', color: '#f44336', cursor: 'pointer', fontWeight: 500 }}>Delete</button>
                                    </div>
                                </div>
                            );
                        })}
                        {/* Clinic Staff */}
                        {filteredClinicStaff.map(person => {
                            const isEditing = editingPerson && editingPerson.userType === "ClinicStaff" && editingPerson.id === person.id;
                            
                            return (
                                <div key={person.id} style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 8px #0001', padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <img src={person.profilePictureUrl || 'https://via.placeholder.com/60'} alt="Profile" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: 17 }}>{person.firstName} {person.lastName}</div>
                                            <div style={{ color: '#C7A76C', fontWeight: 500, fontSize: 14 }}>Clinic Staff</div>
                                            <div style={{ color: '#888', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {isEditing ? (
                                                    <>
                                                        <input
                                                            type="text"
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            style={{
                                                                border: '1px solid #C7A76C',
                                                                borderRadius: 4,
                                                                padding: '2px 6px',
                                                                fontSize: 13,
                                                                width: '120px'
                                                            }}
                                                            placeholder="Enter position"
                                                        />
                                                        <button 
                                                            onClick={handleSaveSpecialty}
                                                            style={{
                                                                background: '#4CAF50',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: 3,
                                                                padding: '2px 6px',
                                                                fontSize: 11,
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Save
                                                        </button>
                                                        <button 
                                                            onClick={handleCancelEdit}
                                                            style={{
                                                                background: '#f44336',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: 3,
                                                                padding: '2px 6px',
                                                                fontSize: 11,
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        {person.position || 'Clinic Staff'}
                                                        <button
                                                            onClick={() => handleEditSpecialty("ClinicStaff", person.id, person.position)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                padding: 2,
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}
                                                            title="Edit position"
                                                        >
                                                            ✏️
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
                                        <span style={{ fontSize: 15 }}>✉️ {person.email}</span>
                                        <span style={{ fontSize: 15 }}>📞 {person.contactNumber || 'N/A'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                                        <button onClick={() => handleDelete("ClinicStaff", person.id, `${person.firstName} ${person.lastName}`)} style={{ background: 'none', border: 'none', color: '#f44336', cursor: 'pointer', fontWeight: 500 }}>Delete</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagePersonnel;