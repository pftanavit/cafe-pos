import React, { useState } from "react";
import "../wireframe.css";

const orders = [
  { id: "Order 1", type: "Takeaway", items: "1 Latte, 2 Thai tea", time: "03:24", status: "Ongoing" },
  { id: "Order 2", type: "Takeaway", items: "1 Hot Americano", time: "02:42" },
  { id: "Order 3", type: "Dine-in", items: "1 Matcha", time: "01:21" },
  { id: "Order 4", type: "Dine-in", items: "1 Peach tea", time: "00:54" },
];

export default function EmployeeQueuePage() {
  const [active, setActive] = useState(null);

  return (
    <main className="pos-page">
      <h1 className="pos-title">Employee Queue Expanded Order</h1>
      <section className="pos-canvas">
        <nav className="pos-nav">
          <a href="#employee-order">Order</a>
          <a className="is-active" href="#employee-queue">Queue</a>
          <a href="#employee-inventory">Inventory</a>
          <span className="pos-nav__spacer" />
          <span>Log Out</span>
        </nav>
        <div className="pos-queue-layout">
          <div className="pos-queue-list">
            {orders.map((order) => (
              <button type="button" className="pos-order-card" style={{ width: "100%", border: 0, textAlign: "left", cursor: "pointer" }} key={order.id} onClick={() => setActive(order)}>
                <div className="pos-order-card__head">
                  <strong>{order.id}</strong>
                  <strong>{order.type}</strong>
                  <strong>{order.status && <span style={{ color: "#45b64a", marginRight: 22 }}>{order.status}</span>}{order.time}</strong>
                </div>
                <div className="pos-order-card__body">
                  <span>{order.items}</span>
                  <span />
                  <span />
                </div>
              </button>
            ))}
          </div>
          {!active ? (
            <div className="pos-queue-empty">Click Order cards to expand order</div>
          ) : (
            <div className="pos-queue-detail">
              <strong>{active.id} &nbsp; {active.type}</strong>
              <div className="pos-recipe">
                <div>
                  <strong>1 x Latte</strong>
                  <p>- 0% sweetness<br />- normal coffee beans</p>
                </div>
                <div>
                  <strong>Recipe</strong>
                  <p>1. Pull Double Espresso<br />2. Pour ice in the cup<br />3. Pour 200ml of milk<br />4. Top with Espresso</p>
                </div>
              </div>
              <div className="pos-recipe">
                <div>
                  <strong>2 x Thai Tea</strong>
                  <p>- 50% sweetness</p>
                </div>
                <div>
                  <strong>Recipe</strong>
                  <p>1. Pour ice in the cup<br />2. Pour 200ml of milk<br />3. Top with Thai Tea</p>
                </div>
              </div>
              <strong>Customer Description:</strong>
              <p><span style={{ background: "#eee", padding: 7 }}>Blue T Shirt</span> <span style={{ background: "#eee", padding: 7, marginLeft: 10 }}>Glasses</span></p>
              <div style={{ position: "absolute", right: 24, bottom: 20 }}>
                <button className="pos-link-button">Cancel</button>
                <button className="pos-button" style={{ marginLeft: 12 }}>{active.status ? "Mark as Completed" : "Mark as Ongoing"}</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
