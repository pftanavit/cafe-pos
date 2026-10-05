import React, { useState, useEffect } from "react";
import { api } from "../../api.js";
import "../wireframe.css";

export default function AdminInventoryPage() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", unit: "" });

  useEffect(() => {
    api.get("/ingredients").then(setRows);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await api.post("/ingredients", form);
    setRows(await api.get("/ingredients"));
    setOpen(false);
    setForm({ name: "", amount: "", unit: "" });
  };

  const handleDelete = async (ingredientId) => {
    await api.delete(`/ingredients/${ingredientId}`);
    setRows(await api.get("/ingredients"));
  };

  return (
    <main className="pos-page">
      <h1 className="pos-title">Admin Inventory</h1>
      <section className="pos-canvas">
        <nav className="pos-nav">
          <a href="#admin-analytics">Analytics</a>
          <a className="is-active" href="#admin-inventory">Inventory Management</a>
          <a href="#admin-menu">Menu Items Management</a>
          <span className="pos-nav__spacer" />
          <span>Log Out</span>
        </nav>
        <div className="pos-content">
          <button className="pos-button" style={{ float: "right", marginBottom: 12 }} onClick={() => setOpen(true)}>Create New</button>
          <table className="pos-table">
            <thead>
              <tr><th>Name</th><th>Amount</th><th>Unit</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.ingredientId}>
                  <td>{row.name}</td>
                  <td>{row.amount}</td>
                  <td>{row.unit}</td>
                  <td><button className="pos-delete" onClick={() => handleDelete(row.ingredientId)}>X</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {open && (
            <form className="pos-form pos-form--modal" onSubmit={handleSubmit}>
              <h2>Create Ingredient</h2>
              <label className="pos-label">Name</label>
              <input className="pos-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <label className="pos-label">Amount</label>
              <input className="pos-input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              <label className="pos-label">Unit</label>
              <input className="pos-input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required />
              <div className="pos-form-actions">
                <button type="button" className="pos-link-button" onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className="pos-button">Submit</button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
