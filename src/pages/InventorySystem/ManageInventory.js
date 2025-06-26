import React, { useState, useEffect } from "react";
import { getDatabase, ref, set, onValue, remove, get } from "firebase/database";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";

const ManageInventory = () => {
  // state variables
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [itemName, setItemName] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [quantity, setQuantity] = useState("");
  const [inventoryList, setInventoryList] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const location = useLocation();
  const [userDetails, setUserDetails] = useState(null);
  const navigate = useNavigate();
  const userRole = location.state?.userRole;
  const auth = getAuth();

  // Calculate total cost based on price per unit and quantity
  const totalCost = (parseFloat(pricePerUnit) || 0) * (parseInt(quantity) || 0);
  const db = getDatabase();

  // Function to check if item name already exists (case-insensitive)
  const isItemNameExists = (name, excludeKey = null) => {
    return inventoryList.some(item => {
      const existingName = item.itemName.toLowerCase().trim();
      const newName = name.toLowerCase().trim();
      return existingName === newName && item.key !== excludeKey;
    });
  };

  // Fetch inventory data from Firebase on component mount
  useEffect(() => {
    const inventoryRef = ref(db, "inventory");
    onValue(inventoryRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formatted = Object.keys(data).map((key) => ({
          key,
          ...data[key],
        }));
        setInventoryList(formatted);
      } else {
        setInventoryList([]);
      }
    });
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

  // Handle form submission for adding or editing items
  const handleSubmit = () => {
    // Clear any previous error messages
    setErrorMessage("");

    // Validate required fields
    if (!itemName.trim()) {
      setErrorMessage("Item name is required.");
      return;
    }

    if (!pricePerUnit || parseFloat(pricePerUnit) <= 0) {
      setErrorMessage("Price per unit must be greater than 0.");
      return;
    }

    if (!quantity || parseInt(quantity) <= 0) {
      setErrorMessage("Quantity must be greater than 0.");
      return;
    }

    // Check for duplicate item names
    if (isItemNameExists(itemName, editingKey)) {
      setErrorMessage("An item with this name already exists in the inventory.");
      return;
    }

    const key = itemName.replace(/\s+/g, "_").toLowerCase();
    const itemData = {
      itemName: itemName.trim(),
      pricePerUnit: parseFloat(pricePerUnit),
      quantity: parseInt(quantity),
      totalCost,
    };

    set(ref(db, `inventory/${key}`), itemData);

    setIsModalOpen(false);
    resetForm();
  };

  // Handle edit button click
  const handleEdit = (item) => {
    setEditingKey(item.key);
    setItemName(item.itemName);
    setPricePerUnit(item.pricePerUnit.toString());
    setQuantity(item.quantity.toString());
    setErrorMessage("");
    setIsModalOpen(true);
  };

  // Handle delete button click
  const handleDelete = (key) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      remove(ref(db, `inventory/${key}`));
    }
  };

  // Reset form fields
  const resetForm = () => {
    setItemName("");
    setPricePerUnit("");
    setQuantity("");
    setEditingKey(null);
    setErrorMessage("");
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Handle logout
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
              <Link to="/dashboard-dentistowner" state={{ userRole: "DentistOwner" }} style={{ textDecoration: "none", color: "#333"}}>
                Dashboard
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/patient-record" state={{ userRole: "DentistOwner" }} style={{ textDecoration: 'none', color: '#333' }}>
                Patient Record
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/inventory" state={{ userRole: "DentistOwner" }} style={{ textDecoration: 'none', color: '#C7A76C', fontWeight: "bold" }}>
                Inventory
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/analytics" state={{ userRole: "DentistOwner" }} style={{ textDecoration: 'none', color: '#333' }}>
                Analytics
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/manage-personnel" state={{ userRole: "DentistOwner" }} style={{ textDecoration: 'none', color: '#333' }}>
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
        <h2>Inventory</h2>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }}>Add Item or Equipment</button>

        <table border="1" cellPadding="10" cellSpacing="0" style={{ marginTop: "20px", width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: "#f0f0f0" }}>
            <tr>
              <th>Item Name</th>
              <th>Price per Unit (₱)</th>
              <th>Quantity</th>
              <th>Total Cost (₱)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventoryList.map((item) => (
              <tr key={item.key}>
                <td>{item.itemName}</td>
                <td>
                  {Number(item.pricePerUnit).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td>{item.quantity}</td>
                <td>
                  {Number(item.totalCost).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td>
                  <button onClick={() => handleEdit(item)}>Edit</button>{" "}
                  <button onClick={() => handleDelete(item.key)} style={{ color: "red" }}>Delete</button>
                </td>
              </tr>
            ))}

            {/* Grand Total Row */}
            <tr style={{ fontWeight: "bold", backgroundColor: "#f9f9f9" }}>
              <td colSpan="3" style={{ textAlign: "right" }}>Grand Total:</td>
              <td>
                ₱
                {inventoryList
                  .reduce((acc, item) => acc + (item.totalCost || 0), 0)
                  .toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>

        {isModalOpen && (
          <div style={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <div style={{
              backgroundColor: "#fff", padding: "20px", borderRadius: "8px", minWidth: "300px"
            }}>
              <h3>{editingKey ? "Edit" : "Add"} Item or Equipment</h3>
              
              {/* Error Message Display */}
              {errorMessage && (
                <div style={{
                  backgroundColor: "#ffebee",
                  color: "#c62828",
                  padding: "10px",
                  borderRadius: "4px",
                  marginBottom: "15px",
                  border: "1px solid #ffcdd2"
                }}>
                  {errorMessage}
                </div>
              )}

              <label>
                Item Name: <span style={{ color: "red" }}>*</span>
                <input 
                  type="text" 
                  value={itemName} 
                  onChange={(e) => setItemName(e.target.value)}
                  required
                  style={{ width: "100%", padding: "8px", marginTop: "5px", boxSizing: "border-box" }}
                />
              </label>
              <br /><br />
              <label>
                Price per Unit: <span style={{ color: "red" }}>*</span>
                <input 
                  type="number" 
                  value={pricePerUnit} 
                  onChange={(e) => setPricePerUnit(e.target.value)}
                  min="0"
                  step="0.01"
                  required
                  style={{ width: "100%", padding: "8px", marginTop: "5px", boxSizing: "border-box" }}
                />
              </label>
              <br /><br />
              <label>
                Quantity: <span style={{ color: "red" }}>*</span>
                <input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  required
                  style={{ width: "100%", padding: "8px", marginTop: "5px", boxSizing: "border-box" }}
                />
              </label>
              <br /><br />
              <label>
                Total Cost: <strong>₱{totalCost.toFixed(2)}</strong>
              </label>
              <br /><br />
              <button onClick={handleSubmit}>{editingKey ? "Update" : "Submit"}</button>
              <button onClick={handleModalClose} style={{ marginLeft: "10px" }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageInventory;