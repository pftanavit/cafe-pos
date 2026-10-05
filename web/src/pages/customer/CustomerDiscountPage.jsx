import React from "react";
import "../wireframe.css";

export default function CustomerDiscountPage() {
  return (
    <main className="pos-page">
      <h1 className="pos-title">Customer Discount</h1>
      <section className="pos-canvas">
        <nav className="pos-nav">
          <a className="is-active" href="#customer-menu">Menu</a>
          <a href="#customer-tracking-queue">My Order</a>
          <span className="pos-nav__spacer" />
          <span>Log Out</span>
        </nav>
        <div className="pos-content">
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <h2 className="pos-section-title">Redeem Discount!</h2>
            <button className="pos-button" style={{ minWidth: 72, minHeight: 24, fontSize: 10 }}>Redeem</button>
          </div>
          <div className="pos-code">
            <span>Your Discount Code is</span>
            <span className="pos-close">x</span>
            <strong>DISC - 0000</strong>
          </div>
        </div>
      </section>
    </main>
  );
}
