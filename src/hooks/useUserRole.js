import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";

export default function useUserRole() {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const db = getDatabase();
    const personnelTypes = ["DentistOwner", "AssociateDentist", "ClinicStaff"];
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        for (const type of personnelTypes) {
          const userRef = ref(db, `users/Personnel/${type}/${user.uid}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            setUserRole(type);
            break;
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return userRole;
} 