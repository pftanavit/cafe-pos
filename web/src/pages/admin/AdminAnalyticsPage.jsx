import React from "react";
import "../wireframe.css";

const orderTrend = [2, 4, 6, 5, 8, 9, 7];
const trendLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const topItems = [
  { name: "Burgers", percent: 45, color: "#5b8ff9" },
  { name: "Fries", percent: 25, color: "#61dDAA" },
  { name: "Drinks", percent: 18, color: "#f6bd16" },
  { name: "Desserts", percent: 12, color: "#7262fd" },
];

export default function AdminAnalyticsPage() {
  const totalOrders = orderTrend.reduce((sum, value) => sum + value, 0);

  return (
    <main className="pos-page">
      <h1 className="pos-title">Admin Home Analytics</h1>
      <section className="pos-canvas">
        <nav className="pos-nav">
          <a className="is-active" href="#admin-analytics">Analytics</a>
          <a href="#admin-inventory">Inventory Management</a>
          <a href="#admin-menu">Menu Items Management</a>
          <span className="pos-nav__spacer" />
          <span>Log Out</span>
        </nav>
        <div className="pos-content">
          <h2 className="pos-section-title">Order History</h2>
          <div style={{ width: 560, height: 118, background: "#d8d8d8", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 12 }}>
            Table placeholder
          </div>

          <div style={{ display: "flex", gap: 40, flexWrap: "wrap", marginTop: 36 }}>
            <div style={{ flex: "1 1 320px", minHeight: 220, padding: 18, borderRadius: 12, background: "#f0f0f0" }}>
              <h3 style={{ margin: 0, marginBottom: 10, fontSize: 14 }}>Orders Over Time</h3>
              <div style={{ display: "flex", alignItems: "flex-end", height: 130, gap: 8, padding: "8px 0" }}>
                {orderTrend.map((value, index) => (
                  <div key={trendLabels[index]} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ margin: "0 auto", width: 24, height: `${value * 12}px`, background: "#5b8ff9", borderRadius: 8 }} />
                    <div style={{ marginTop: 8, fontSize: 10, color: "#555" }}>{trendLabels[index]}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: "#555" }}>
                Weekly total: {totalOrders} orders
              </div>
            </div>

            <div style={{ width: 260, padding: 18, borderRadius: 12, background: "#f0f0f0" }}>
              <h3 style={{ margin: 0, marginBottom: 14, fontSize: 14 }}>Top Selling Orders</h3>
              <div style={{ width: 140, height: 140, borderRadius: "50%", position: "relative", margin: "0 auto", background: "#e6e6e6" }}>
                <div style={{ position: "absolute", inset: 0, clipPath: "polygon(50% 50%, 100% 50%, 100% 0, 50% 0)", background: topItems[0].color }} />
                <div style={{ position: "absolute", inset: 0, clipPath: "polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)", background: topItems[1].color, transform: "rotate(162deg)" }} />
                <div style={{ position: "absolute", inset: 0, clipPath: "polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)", background: topItems[2].color, transform: "rotate(244deg)" }} />
                <div style={{ position: "absolute", inset: 0, clipPath: "polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)", background: topItems[3].color, transform: "rotate(308deg)" }} />
                <div style={{ position: "absolute", top: 40, left: 40, width: 60, height: 60, borderRadius: "50%", background: "#f0f0f0" }} />
              </div>
              <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
                {topItems.map((item) => (
                  <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: item.color, display: "inline-block" }} />
                    <span>{item.name} ({item.percent}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
