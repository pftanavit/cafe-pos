import React from "react";
import "../wireframe.css";

const statusMap = {
  queue: { title: "Customer Tracking on queue", message: "3 Queues ahead", color: "#f3b52b" },
  ongoing: { title: "Customer Tracking ongoing", message: "Currently Making", color: "#45b64a" },
  complete: { title: "Customer Tracking complete", message: "Your Order is Ready !", color: "#45b64a", close: true },
  canceled: { title: "Customer Tracking canceled", message: "Your Order has been Canceled", color: "#ff1111", close: true },
  empty: { title: "Customer Tracking Empty", message: "You Don't have any Ongoing Order", color: "#111" },
};

export default function CustomerTrackingPage({ status = "queue" }) {
  const state = statusMap[status] || statusMap.queue;

  return (
    <main className="pos-page">
      <h1 className="pos-title">{state.title}</h1>
      <section className="pos-canvas">
        <nav className="pos-nav">
          <a href="#customer-menu">Menu</a>
          <a className="is-active" href="#customer-tracking-queue">My Order</a>
          <span className="pos-nav__spacer" />
          <span>Log Out</span>
        </nav>
        {status === "empty" ? (
          <div style={{ paddingTop: 48, textAlign: "center" }}>
            <h2 className="pos-section-title">{state.message}</h2>
          </div>
        ) : (
          <div className="pos-tracker">
            {state.close && <span className="pos-close">x</span>}
            <h2 className="pos-section-title">Your Order:</h2>
            <div className="pos-tracker__number">#001</div>
            <strong style={{ color: state.color }}>{state.message}</strong>
          </div>
        )}
      </section>
    </main>
  );
}
