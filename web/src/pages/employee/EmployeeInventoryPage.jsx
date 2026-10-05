import React from "react";
import "../wireframe.css";

const rows = [
  ["Espresso Beans", "g", "1800"],
  ["Oat Milk", "ml", "3200"],
  ["Syrup", "ml", "900"],
];

export default function EmployeeInventoryPage() {
  return (
    <main className="pos-page">
      <h1 className="pos-title">Employee Inventory</h1>
      <section className="pos-canvas">
        <nav className="pos-nav">
          <a href="#employee-order">Order</a>
          <a href="#employee-queue">Queue</a>
          <a className="is-active" href="#employee-inventory">Inventory</a>
          <span className="pos-nav__spacer" />
          <span>Log Out</span>
        </nav>
        <div className="pos-content">
          <table className="pos-table">
            <thead>
              <tr><th>Ingredient</th><th>Unit</th><th style={{ fontSize: 16, fontWeight: 700 }}>Amount</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell) => <td key={cell}>{cell}</td>)}
                  <td><button className="pos-edit">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
