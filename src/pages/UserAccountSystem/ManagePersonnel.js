import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDatabase, ref, get, remove } from "firebase/database";
import { getAuth } from "firebase/auth";
import app from "../../backend/firebaseConfig";

const ManagePersonnel = () => {
    const [clinicStaff, setClinicStaff] = useState([]);
    const [dentistOwner, setDentistOwner] = useState([]);
    const [associateDentist, setAssociateDentist] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);

    // listen for authentication state changes to get the current user ID
    useEffect(() => {
        const auth = getAuth(app);
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                setCurrentUserId(user.uid);
            }
        });

        return () => unsubscribe();
    }, []);

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

    // function to handle deletion of personnel accounts
    const handleDelete = async (userType, id) => {
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

    return (
        <div>
            <button>
                <a href="/DashboardDentistOwner">Go Back to Dashboard</a>
            </button>

            <h2>Manage Personnel</h2>

            <div>
                <Link to="/SignUpClinicStaff"><button>Add Clinic Staff</button></Link>
                <Link to="/SignUpDentistOwner"><button>Add Dentist Owner</button></Link>
                <Link to="/SignUpAssociateDentist"><button>Add Associate Dentist</button></Link>
            </div>

            <h3>Clinic Staff</h3>
            <ul>
                {clinicStaff.length > 0 ? (
                    clinicStaff.map(person => (
                        <li key={person.id}>
                            {person.firstName} {person.lastName} ({person.email})
                            <button onClick={() => handleDelete("ClinicStaff", person.id)}>Delete</button>
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
                                    <button onClick={() => handleDelete("DentistOwner", person.id)}>Delete</button>
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
                            <button onClick={() => handleDelete("AssociateDentist", person.id)}>Delete</button>
                        </li>
                    ))
                ) : (
                    <p>No Associate Dentists found.</p>
                )}
            </ul>
        </div>
    );
};

export default ManagePersonnel;
