import React, { useState, useEffect } from "react";
import { api } from "../../api.js";
import "../wireframe.css";

export default function CustomerMenuPage() {
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    api.get("/menu-items").then(setMenuItems);
  }, []);

  return (
    <main className="pos-page">
      <h1 className="pos-title">Customer Menu</h1>
      <section className="pos-canvas">
        <nav className="pos-nav">
          <a className="is-active" href="#customer-menu">Menu</a>
          <a href="#customer-tracking-queue">My Order</a>
          <span className="pos-nav__spacer" />
          <span>Log Out</span>
        </nav>
        <div className="pos-content">
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h2 className="pos-section-title">Redeem Discount!</h2>
            <button className="pos-button" style={{ minWidth: 72, minHeight: 24, fontSize: 10 }}>Redeem</button>
          </div>
          <h2 className="pos-section-title">Menu</h2>
          <div className="pos-menu-grid">
            {menuItems.map((item) => (
              <article className="pos-menu-card" key={item.menuItemId}>
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.name}
                    style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "4px" }}
                  />
                ) : (
                  <div className="pos-photo">No Image</div>
                )}
                <span>{item.name}</span>
                <span className="pos-price">{item.isAvailable ? `${item.basePrice}B` : "sold out"}</span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
