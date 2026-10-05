import React, { useState, useEffect } from "react";
import { api } from "../../api.js";
import "../wireframe.css";

export default function AdminMenuPage() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    basePrice: "",
    recipe: "",
    imageUrl: "",
    ingredientSlots: [],
  });

  useEffect(() => {
    api.get("/menu-items").then(setRows);
  }, []);

  const handleDeleteRow = async (menuItemId) => {
    await api.delete(`/menu-items/${menuItemId}`);
    setRows(await api.get("/menu-items"));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "imageUrl" && value) {
      setImagePreview(value);
    }
  };

  const handleImageSelect = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, imageUrl: value }));
    setImagePreview(value);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
        setImagePreview(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/menu-items", {
        name: formData.name,
        basePrice: formData.basePrice,
        recipe: formData.recipe,
        imageUrl: formData.imageUrl || null,
        ingredientSlots: [],
      });
      setRows(await api.get("/menu-items"));
      setOpen(false);
      setFormData({
        name: "",
        basePrice: "",
        recipe: "",
        imageUrl: "",
        ingredientSlots: [],
      });
      setImagePreview(null);
    } catch (error) {
      alert("Error creating menu item: " + error.message);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setFormData({
      name: "",
      basePrice: "",
      recipe: "",
      imageUrl: "",
      ingredientSlots: [],
    });
    setImagePreview(null);
  };

  return (
    <main className="pos-page">
      <h1 className="pos-title">Admin Menu</h1>
      <section className="pos-canvas">
        <nav className="pos-nav">
          <a href="#admin-analytics">Analytics</a>
          <a href="#admin-inventory">Inventory Management</a>
          <a className="is-active" href="#admin-menu">Menu Items Management</a>
          <span className="pos-nav__spacer" />
          <span>Log Out</span>
        </nav>
        <div className="pos-content">
          <button className="pos-button" style={{ float: "right", marginBottom: 12 }} onClick={() => setOpen(true)}>Create New</button>
          <table className="pos-table">
            <thead>
              <tr><th>Menu Item</th><th>Price</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.menuItemId}>
                  <td>{row.name}</td>
                  <td>{row.basePrice}</td>
                  <td>{row.isAvailable ? "Available" : "Out"}</td>
                  <td><button className="pos-delete" onClick={() => handleDeleteRow(row.menuItemId)}>X</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {open && (
            <form className="pos-form pos-form--modal" onSubmit={handleSubmit}>
              <h2>Create Menu Item</h2>
              
              {/* Image Section */}
              <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid #ccc" }}>
                <h3 style={{ marginBottom: "12px" }}>Item Image</h3>
                
                {/* Image Preview */}
                {imagePreview && (
                  <div style={{ marginBottom: "12px", textAlign: "center" }}>
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      style={{ maxWidth: "150px", maxHeight: "150px", borderRadius: "4px", border: "1px solid #ddd" }}
                    />
                  </div>
                )}
                
                {/* Upload Menu Item Image */}
                <div>
                  <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>Upload Menu Image:</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {/* Menu Item Details */}
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>Item Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>Base Price (B):</label>
                <input
                  type="number"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>Recipe/Description:</label>
                <textarea
                  name="recipe"
                  value={formData.recipe}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "8px", boxSizing: "border-box", minHeight: "80px" }}
                />
              </div>

              <div className="pos-form-actions">
                <button type="submit" className="pos-button">Create Item</button>
                <button type="button" className="pos-link-button" onClick={handleCancel}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
