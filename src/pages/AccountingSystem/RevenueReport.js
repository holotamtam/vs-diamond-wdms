import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../../backend/firebaseConfig";

const RevenueReport = () => {
  const [serviceUsage, setServiceUsage] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServiceUsage();
  }, []);

  const fetchServiceUsage = () => {
    const appointmentsRef = ref(db, "appointments");
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    onValue(appointmentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allAppointments = snapshot.val();
        const usage = {};

        // Iterate through all appointments
        Object.entries(allAppointments).forEach(([date, dateAppointments]) => {
          Object.entries(dateAppointments).forEach(([id, appointment]) => {
            const appointmentDate = new Date(appointment.date);

            // Check if the appointment is within the last 30 days
            if (appointmentDate >= thirtyDaysAgo && appointmentDate <= now) {
              appointment.services.forEach((service) => {
                if (usage[service]) {
                  usage[service] += 1;
                } else {
                  usage[service] = 1;
                }
              });
            }
          });
        });

        setServiceUsage(usage);
        setLoading(false);
      } else {
        setServiceUsage({});
        setLoading(false);
      }
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Service Usage Report (Last 30 Days)</h1>
      {loading ? (
        <p>Loading...</p>
      ) : Object.keys(serviceUsage).length === 0 ? (
        <p>No data available for the past 30 days.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Service</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Usage Count</th>
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

export default RevenueReport;