import React, { useState, useEffect } from "react";
import { auth } from "../../backend/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import NotifyComp from "../../components/NotifyComp";

const Notification = () => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user ? user : null);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div>
      <button>
        <a href="/dashboard-patient">Go Back to Dashboard</a>
      </button>
      <NotifyComp currentUser={currentUser} />
    </div>
  );
};

export default Notification;