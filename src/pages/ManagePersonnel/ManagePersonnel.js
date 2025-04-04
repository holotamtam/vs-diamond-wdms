import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDatabase, ref, get, remove } from "firebase/database";
import app from "../../backend/firebaseConfig";

const ManagePersonnel = () => {
    const navigate = useNavigate();
    const [clinicStaff, setClinicStaff] = useState([]);
    const [dentists, setDentists] = useState([]);

    // to fetch the clinic staff and dentists from the database.
    useEffect(() => {
        const fetchPersonnel = async () => {
            const db = getDatabase(app);
            const clinicStaffRef = ref(db, "users/Personnel/ClinicStaff");
            const dentistRef = ref(db, "users/Personnel/Dentist");

            try {
                const [clinicStaffSnap, dentistSnap] = await Promise.all([get(clinicStaffRef), get(dentistRef)]);

                if (clinicStaffSnap.exists()) {
                    setClinicStaff(Object.entries(clinicStaffSnap.val()).map(([id, data]) => ({ id, ...data })));
                }
                if (dentistSnap.exists()) {
                    setDentists(Object.entries(dentistSnap.val()).map(([id, data]) => ({ id, ...data })));
                }
            } catch (error) {
                console.error("Error fetching personnel:", error);
            }
        };

        fetchPersonnel();
    }, []);

    // function that handles the deletion of dentist or clinic staff accounts.
    const handleDelete = async (userType, id) => {
        const db = getDatabase(app);
        const userRef = ref(db, `users/Personnel/${userType}/${id}`);

        try {
            await remove(userRef);
            alert(`${userType} deleted successfully!`);
            
            if (userType === "ClinicStaff") {
                setClinicStaff(clinicStaff.filter(person => person.id !== id));
            } else if (userType === "Dentist") {
                setDentists(dentists.filter(person => person.id !== id));
            }
        } catch (error) {
            console.error("Error deleting personnel:", error);
            alert("Failed to delete personnel.");
        }
    };

    return (
        <div>
            <button onClick={() => navigate("/DashboardDentist")}>Back</button>

            <h2>Manage Personnel</h2>

            {/* Links for adding another dentist or clinic staff */} 
            <div>
                <Link to="/SignUpClinicStaff"><button>Add Clinic Staff</button></Link>
                <Link to="/SignUpDentist"><button>Add Dentist</button></Link>
            </div>

            <h3>Clinic Staff</h3>
            <ul>
                {clinicStaff.length > 0 ? (
                    clinicStaff.map(person => (
                        <li key={person.id}>
                            {person.name} ({person.email})
                            <button onClick={() => handleDelete("ClinicStaff", person.id)}>Delete</button>
                        </li>
                    ))
                ) : (
                    <p>No Clinic Staff found.</p>
                )}
            </ul>

            <h3>Dentists</h3>
            <ul>
                {dentists.length > 0 ? (
                    dentists.map(person => (
                        <li key={person.id}>
                            {person.name} ({person.email})
                            <button onClick={() => handleDelete("Dentist", person.id)}>Delete</button>
                        </li>
                    ))
                ) : (
                    <p>No Dentists found.</p>
                )}
            </ul>
        </div>
    );
};

export default ManagePersonnel;
