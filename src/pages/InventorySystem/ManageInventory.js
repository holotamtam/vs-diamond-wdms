import React, { useState, useEffect } from "react";
import { getDatabase, ref, set, onValue, remove } from "firebase/database";

const ManageInventory = () => {
  // state variables
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [itemName, setItemName] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [quantity, setQuantity] = useState("");
  const [inventoryList, setInventoryList] = useState([]);

  // Calculate total cost based on price per unit and quantity
  const totalCost = (parseFloat(pricePerUnit) || 0) * (parseInt(quantity) || 0);
  const db = getDatabase();

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

  // Handle form submission for adding or editing items
  const handleSubmit = () => {
    const key = itemName.replace(/\s+/g, "_").toLowerCase();
    const itemData = {
      itemName,
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
  };

  return (
    <div style={{ padding: "20px" }}>
      <button>
        <a href="/DashboardDentistOwner">Go Back to Dashboard</a>
      </button>

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
              <td>{item.pricePerUnit}</td>
              <td>{item.quantity}</td>
              <td>{item.totalCost}</td>
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
                ₱{inventoryList.reduce((acc, item) => acc + (item.totalCost || 0), 0).toFixed(2)}
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
            <label>
              Item Name:
              <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} />
            </label>
            <br />
            <label>
              Price per Unit:
              <input type="number" value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} />
            </label>
            <br />
            <label>
              Quantity:
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </label>
            <br />
            <label>
              Total Cost: <strong>₱{totalCost.toFixed(2)}</strong>
            </label>
            <br /><br />
            <button onClick={handleSubmit}>{editingKey ? "Update" : "Submit"}</button>
            <button onClick={() => setIsModalOpen(false)} style={{ marginLeft: "10px" }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageInventory;
