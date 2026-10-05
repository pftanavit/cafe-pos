import React, { useState } from "react";
import "../wireframe.css";

export default function EmployeeOrderPage() {
  const [creating, setCreating] = useState(false);

  const openOrderForm = () => setCreating(true);
  const closeOrderForm = () => setCreating(false);

  return (
    <main className="pos-page">
      <h1 className="pos-title">Employee Home(Order)</h1>
      <section className="pos-canvas">
        <nav className="pos-nav">
          <a className="is-active" href="#employee-order">Order</a>
          <a href="#employee-queue">Queue</a>
          <a href="#employee-inventory">Inventory</a>
          <span className="pos-nav__spacer" />
          <span>Log Out</span>
        </nav>
        <div className="pos-content">
          {!creating ? (
            <>
              <h2 className="pos-section-title">incomplete order</h2>
              <article className="pos-order-card">
                <div className="pos-order-card__head">
                  <strong>Order 1</strong>
                  <strong>Takeaway</strong>
                  <span />
                </div>
                <div className="pos-order-card__body pos-order-card__body--actions">
                  <span>1 Latte, 2 Thai tea</span>
                  <span className="pos-card-actions">
                    <button className="pos-edit" onClick={openOrderForm}>Edit</button>
                    <button className="pos-delete">X</button>
                  </span>
                </div>
              </article>
              <button className="pos-button" style={{ float: "right", marginTop: 104 }} onClick={openOrderForm}>Create</button>
            </>
          ) : (
            <form className="pos-order-form">
              <h2>Create New Order</h2>
              <div className="pos-inline-meta">
                <span>Employee ID: 029437</span>
              </div>
              <label className="pos-mini-label">Customer ID:</label>
              <input className="pos-mini-input" placeholder="Number" />

              <div className="pos-scroll-form">
                <section className="pos-menu-editor-card">
                  <h3>Menu Item 1</h3>
                  <div className="pos-field-row">
                    <span>Name:</span>
                    <input className="pos-mini-input" defaultValue="Matcha Latte" />
                  </div>
                  <div className="pos-field-row">
                    <span>Options for Milk:</span>
                    <select className="pos-mini-input">
                      <option>Whole Milk</option>
                      <option>Oat Milk</option>
                    </select>
                  </div>
                  <span>Levels for Syrup:</span>
                  <div className="pos-chip-row">
                    <button type="button">Not Sweet</button>
                    <button type="button">Normal Sweet</button>
                  </div>
                </section>

                <section className="pos-menu-editor-card">
                  <h3>Menu Item 2</h3>
                  <div className="pos-field-row">
                    <span>Name:</span>
                    <input className="pos-mini-input" defaultValue="Water" />
                  </div>
                </section>

                <button type="button" className="pos-add-wide">+ Add Menu Item</button>

                <div className="pos-field-row pos-field-row--spaced">
                  <span>Type:</span>
                  <select className="pos-mini-input">
                    <option>Takeaway</option>
                    <option>Dine-in</option>
                  </select>
                </div>

                <label className="pos-mini-label">Note:</label>
                <textarea className="pos-note" placeholder="Text" />

                <label className="pos-mini-label">Appearance Tags:</label>
                <div className="pos-chip-row">
                  <button type="button">Blue Shirt</button>
                  <button type="button">Glasses</button>
                </div>

                <div className="pos-field-row pos-field-row--spaced">
                  <span>Add Tag:</span>
                  <input className="pos-mini-input" placeholder="Text" />
                  <button type="button" className="pos-small-square" />
                </div>
              </div>

              <div className="pos-form-actions">
                <button type="button" className="pos-link-button" onClick={closeOrderForm}>Cancel</button>
                <button type="button" className="pos-button">Create</button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
