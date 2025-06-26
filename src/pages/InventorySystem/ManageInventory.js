import React, { useState, useEffect } from "react";
import { getDatabase, ref, set, onValue, remove, get } from "firebase/database";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { FaEllipsisV } from "react-icons/fa";

const ManageInventory = () => {
  // state variables
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [itemName, setItemName] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("");
  const [supplier, setSupplier] = useState("");
  const [status, setStatus] = useState("In Stock");
  const [inventoryList, setInventoryList] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const location = useLocation();
  const [userDetails, setUserDetails] = useState(null);
  const navigate = useNavigate();
  const userRole = location.state?.userRole;
  const auth = getAuth();
  const [openMenuKey, setOpenMenuKey] = useState(null);

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

  const handleMenuOpen = (key) => setOpenMenuKey(key);
  const handleMenuClose = () => setOpenMenuKey(null);

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
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
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
          <span style={{ fontWeight: 700, fontSize: "24px", color: "#3d342b", letterSpacing: 0.5, lineHeight: 1 }}>Inventory</span>
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            style={{
              background: "#C7A76C",
              color: "white",
              border: "none",
              borderRadius: 28,
              padding: "8px 38px",
              height: "35.333px",
              fontWeight: 600,
              fontSize: 18,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
              transition: "background 0.2s",
              lineHeight: "35.333px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            Add Item
          </button>
        </div>
        {/* Main Content Area */}
        <div style={{ flex: 1, background: "#f9f6f2", minHeight: 0, padding: "0px 0 20px 0" }}>
          <div style={{ maxWidth: "100%", margin: "0 auto", padding: "0 20px" }}>
            <div style={{
              background: "#fff",
              borderRadius: 18,
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
              padding: 0,
              overflow: "hidden",
              margin: "20px 0",
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    <th style={{ padding: "20px 16px", fontWeight: 600, textAlign: "left", borderBottom: "2px solid #dee2e6", color: "#495057" }}>Item Name</th>
                    <th style={{ padding: "20px 16px", fontWeight: 600, textAlign: "left", borderBottom: "2px solid #dee2e6", color: "#495057" }}>Price per Unit</th>
                    <th style={{ padding: "20px 16px", fontWeight: 600, textAlign: "left", borderBottom: "2px solid #dee2e6", color: "#495057" }}>Quantity</th>
                    <th style={{ padding: "20px 16px", fontWeight: 600, textAlign: "left", borderBottom: "2px solid #dee2e6", color: "#495057" }}>Total Cost</th>
                    <th style={{ padding: "20px 16px", fontWeight: 600, textAlign: "center", borderBottom: "2px solid #dee2e6", color: "#495057" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryList.map((item) => (
                    <tr key={item.key} style={{ borderBottom: "1px solid #e9ecef", backgroundColor: "#fff" }}>
                      <td style={{ padding: "18px 16px", color: "#212529" }}>{item.itemName}</td>
                      <td style={{ padding: "18px 16px", color: "#212529", fontWeight: "500" }}>
                        ₱ {Number(item.pricePerUnit).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td style={{ padding: "18px 16px", color: "#212529" }}>{item.quantity}</td>
                      <td style={{ padding: "18px 16px", color: "#212529", fontWeight: "500" }}>
                        ₱ {Number(item.totalCost).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td style={{ padding: "18px 16px", textAlign: "center", position: "relative" }}>
                        <button
                          onClick={() => handleMenuOpen(item.key)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 6,
                          }}
                          aria-label="More actions"
                        >
                          <FaEllipsisV size={18} color="#8d8d8d" />
                        </button>
                        {openMenuKey === item.key && (
                          <div
                            style={{
                              position: "absolute",
                              top: 38,
                              right: 10,
                              background: "#fff",
                              boxShadow: "0 2px 12px rgba(0,0,0,0.13)",
                              borderRadius: 8,
                              zIndex: 10,
                              minWidth: 120,
                            }}
                          >
                            <div
                              onClick={() => { handleEdit(item); handleMenuClose(); }}
                              style={{
                                padding: "10px 18px",
                                cursor: "pointer",
                                borderBottom: "1px solid #f0ede7",
                                color: "#333",
                                fontWeight: 500,
                                fontSize: 15,
                              }}
                            >
                              Edit
                            </div>
                            <div
                              onClick={() => { handleDelete(item.key); handleMenuClose(); }}
                              style={{
                                padding: "10px 18px",
                                cursor: "pointer",
                                color: "#d32f2f",
                                fontWeight: 500,
                                fontSize: 15,
                              }}
                            >
                              Delete
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* Grand Total Row */}
                  <tr style={{ fontWeight: "bold", backgroundColor: "#f8f9fa", borderTop: "2px solid #dee2e6" }}>
                    <td colSpan="3" style={{ textAlign: "right", padding: "20px 16px", color: "#495057" }}>Grand Total:</td>
                    <td style={{ padding: "20px 16px", color: "#495057" }}>
                      ₱ {inventoryList
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
            </div>
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
                    Total Cost: <strong>₱ {totalCost.toFixed(2)}</strong>
                  </label>
                  <br /><br />
                  <button onClick={handleSubmit}>{editingKey ? "Update" : "Submit"}</button>
                  <button onClick={handleModalClose} style={{ marginLeft: "10px" }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageInventory;