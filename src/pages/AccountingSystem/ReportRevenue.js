import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db, auth } from "../../backend/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const ReportRevenue = () => {
  const [serviceUsage, setServiceUsage] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Encode email to match Firebase database structure
  const encodeEmail = (email) => email.replace(/[.]/g, ",");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchServiceUsage(user.email);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchServiceUsage = (email) => {
    const encodedEmail = encodeEmail(email);
    console.log("Encoded Email:", encodedEmail); // Debugging log
    const appointmentsRef = ref(db, "appointments");
  
    onValue(appointmentsRef, (snapshot) => {
      if (snapshot.exists()) {
        console.log(snapshot.val()); // Debugging log
        const allAppointments = snapshot.val();
        const usage = {};
  
        // Iterate through all dates in appointments
        Object.entries(allAppointments).forEach(([date, dateAppointments]) => {
          // Check if the email exists under the date
          if (dateAppointments[encodedEmail]) {
            const userAppointments = dateAppointments[encodedEmail];
  
            // Iterate through all user appointments
            Object.entries(userAppointments).forEach(([id, appointment]) => {
              console.log(appointment); // Debugging log
              // Check if the appointment is completed
              if (appointment.status === "Completed") {
                appointment.services.forEach((service) => {
                  if (usage[service]) {
                    usage[service] += 1;
                  } else {
                    usage[service] = 1;
                  }
                });
              }
            });
          }
        });
  
        setServiceUsage(usage);
        setLoading(false);
      } else {
        setServiceUsage({});
        setLoading(false);
      }
    });
  };

  const handleGoBack = () => {
    navigate("/DashboardDentistOwner"); // Adjust the route as needed
  };

  return (
    <div style={{ padding: "20px" }}>
      <button onClick={handleGoBack}>Go Back to Dashboard</button>
      <h1>Service Usage Report</h1>
      {loading ? (
        <p>Loading...</p>
      ) : Object.keys(serviceUsage).length === 0 ? (
        <p>No completed services available.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Service</th>
              <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Usage Count</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(serviceUsage).map(([service, count]) => (
              <tr key={service}>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{service}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ReportRevenue;