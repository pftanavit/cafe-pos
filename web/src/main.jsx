import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { api, money, statusLabel } from "./api";
import "./preview.css";

const roles = ["admin", "employee", "customer"];
const tabs = {
  admin: ["analytics","inventory","menu","orders","queue"],
  employee: ["orders", "queue", "inventory"],
  customer: ["menu", "discount", "tracking"],
};

const emptyOrderForm = {
  customerId: "",
  isTakeaway: true,
  notes: "",
  appearanceTags: "",
  discountCode: "",
  items: [],
};

const emptyMenuForm = {
  name: "",
  basePrice: "",
  recipe: "",
  imageUrl: "",
  ingredientSlots: [],
};

function useRemote(loader, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await loader());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh, setData };
}

function Notice({ error, message }) {
  if (!error && !message) return null;
  return <div className={error ? "notice notice--error" : "notice"}>{error || message}</div>;
}

function Login({ onLogin }) {
  const [mode, setMode] = useState("signup");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("customer");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    const cleanName = username.trim();
    if (!cleanName) return setError("Username is required.");
    try {
      const users = await api.get("/users");
      const existing = users.find((user) => user.username?.toLowerCase() === cleanName.toLowerCase());
      if (mode === "signin") {
        if (!existing) throw new Error("No user found with that username.");
        onLogin(existing);
        return;
      }
      if (existing) throw new Error("Username already exists. Choose another one.");
      const user = await api.post("/users", { username: cleanName, role });
      onLogin(user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <h1>Cafe POS</h1>
        <div className="segmented">
          <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Sign up</button>
          <button type="button" className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>Log in</button>
        </div>
        <label>Username</label>
        <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="e.g. anna" />
        {mode === "signup" && (
          <>
            <label>User type</label>
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              {roles.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </>
        )}
        <Notice error={error} />
        <button className="primary" type="submit">{mode === "signup" ? "Create and enter" : "Enter"}</button>
      </form>
    </main>
  );
}

function Shell({ user, children, tab, setTab, onLogout }) {
  return (
    <main className="app-page">
      <header className="topbar">
        <strong>Cafe POS</strong>
        <nav>
          {tabs[user.role].map((item) => (
            <button key={item} className={item === tab ? "active" : ""} onClick={() => setTab(item)}>
              {item}
            </button>
          ))}
        </nav>
        <span className="identity">ID: {user.uid} | {user.username}</span>
        <button className="ghost" onClick={onLogout}>Log Out</button>
      </header>
      {children}
    </main>
  );
}

function AdminAnalytics() {
  const summary = useRemote(() => api.get("/analytics/summary"), []);
  const history = useRemote(() => api.get("/analytics/history"), []);
  const graphs = useRemote(() => api.get("/analytics/graphs"), []);
  const [graphsReady, setGraphsReady] = useState(false);
  const topItems = summary.data?.topSellingItems || [];

  useEffect(() => {
    if (graphs.loading) setGraphsReady(false);
  }, [graphs.loading]);

  return (
    <section className="panel">
      <h2>Analytics</h2>
      <Notice error={summary.error || history.error || graphs.error} />
      <div className="metric-grid">
        <article><span>Total orders</span><strong>{summary.data?.totalOrders ?? "-"}</strong></article>
        <article><span>Revenue</span><strong>{money(summary.data?.totalRevenue)}</strong></article>
        <article><span>Average order</span><strong>{money(summary.data?.averageOrderValue)}</strong></article>
        <article><span>Fulfillment</span><strong>{Number(summary.data?.averageFulfillmentMinutes || 0).toFixed(1)} min</strong></article>
      </div>
      <div className="two-col">
        <Table title="Order History" rows={history.data || []} columns={["orderId", "status", "customerId", "totalPrice"]} />
        <Table title="Top Selling Items" rows={topItems} columns={["menuItemName", "count"]} />
      </div>
      <div className="analytics-graphs">
        <h3>Graphs</h3>
        {graphs.loading ? (
          <div className="graph-loading">Loading Graph...</div>
        ) : graphs.data?.html ? (
          <div className="graph-frame-wrap">
            {!graphsReady && <div className="graph-loading graph-loading--overlay">Loading Graph...</div>}
            <iframe
              className="graph-frame"
              title="Admin analytics graphs"
              srcDoc={graphs.data.html}
              onLoad={() => setGraphsReady(true)}
            />
          </div>
        ) : (
          <div className="graph-loading">No graph data available.</div>
        )}
      </div>
    </section>
  );
}

function AdminInventory({ employeeOnly = false }) {
  const remote = useRemote(() => api.get("/ingredients"), []);
  const [form, setForm] = useState({ name: "", amount: "", unit: "" });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  async function save(event) {
    event.preventDefault();
    setError("");
    try {
      if (employeeOnly && editing) {
        await api.patch(`/ingredients/${editing}`, { amount: form.amount });
      } else if (editing) {
        await api.patch(`/ingredients/${editing}`, form);
      } else {
        await api.post("/ingredients", form);
      }
      setForm({ name: "", amount: "", unit: "" });
      setEditing(null);
      remote.refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  function edit(item) {
    setEditing(item.ingredientId);
    setForm({ name: item.name, amount: item.amount, unit: item.unit });
  }

  async function remove(id) {
    if (!window.confirm("Delete this ingredient?")) return;
    await api.delete(`/ingredients/${id}`);
    remote.refresh();
  }

  return (
    <section className="panel">
      <h2>{employeeOnly ? "Inventory" : "Inventory Management"}</h2>
      <Notice error={remote.error || error} />
      <form className="inline-form" onSubmit={save}>
        {!employeeOnly && <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ingredient name" />}
        <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Amount" />
        {!employeeOnly && <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="Unit" />}
        <button className="primary">{editing ? "Save" : "Add"}</button>
        {editing && <button type="button" className="ghost" onClick={() => setEditing(null)}>Cancel</button>}
      </form>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Amount</th><th>Unit</th><th>Actions</th></tr></thead>
          <tbody>
            {(remote.data || []).map((item) => (
              <tr key={item.ingredientId}>
                <td>{item.name}</td><td>{item.amount}</td><td>{item.unit}</td>
                <td className="actions">
                  <button onClick={() => edit(item)}>Edit</button>
                  {!employeeOnly && <button className="danger" onClick={() => remove(item.ingredientId)}>Delete</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AdminMenu() {
  const menu = useRemote(() => api.get("/menu-items"), []);
  const ingredients = useRemote(() => api.get("/ingredients"), []);
  const [form, setForm] = useState(emptyMenuForm);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  async function save(event) {
    event.preventDefault();
    setError("");
    try {
      const payload = { ...form, basePrice: Number(form.basePrice), ingredientSlots: normalizeSlots(form.ingredientSlots) };
      if (editing) await api.patch(`/menu-items/${editing}`, payload);
      else await api.post("/menu-items", payload);
      setOpen(false);
      setEditing(null);
      setForm(emptyMenuForm);
      menu.refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  function create() {
    setEditing(null);
    setForm({ ...emptyMenuForm, ingredientSlots: [] });
    setOpen(true);
  }

  function edit(item) {
    setEditing(item.menuItemId);
    setForm({ name: item.name, basePrice: item.basePrice, recipe: item.recipe || "", imageUrl: item.imageUrl || "", ingredientSlots: item.ingredientSlots || [] });
    setOpen(true);
  }

  async function remove(id) {
    if (!window.confirm("Delete this menu item?")) return;
    await api.delete(`/menu-items/${id}`);
    menu.refresh();
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Menu Items Management</h2>
        <button className="primary" onClick={create}>Create New</button>
      </div>
      <Notice error={menu.error || ingredients.error || error} />
      <Table rows={menu.data || []} columns={["name", "basePrice", "isAvailable"]} actions={(item) => (
        <>
          <button onClick={() => edit(item)}>Edit</button>
          <button className="danger" onClick={() => remove(item.menuItemId)}>Delete</button>
        </>
      )} />
      {open && (
        <Modal title={editing ? `Edit ${form.name || editing}` : "Create new Menu Item"} onClose={() => setOpen(false)}>
          <MenuItemForm
            form={form}
            setForm={setForm}
            ingredients={ingredients.data || []}
            onSubmit={save}
            onCancel={() => setOpen(false)}
            error={error}
          />
        </Modal>
      )}
    </section>
  );
}

function MenuItemForm({ form, setForm, ingredients, onSubmit, onCancel, error }) {
  const [imagePreview, setImagePreview] = React.useState(form.imageUrl || null);

  function addSlot() {
    setForm({
      ...form,
      ingredientSlots: [...form.ingredientSlots, { type: "normal", ingredientId: "", amount: "", unit: "" }],
    });
  }

  function updateSlot(index, patch) {
    const ingredientSlots = form.ingredientSlots.map((slot, slotIndex) => {
      if (slotIndex !== index) return slot;
      const next = { ...slot, ...patch };
      if (patch.type === "normal") return { type: "normal", ingredientId: "", amount: "", unit: "" };
      if (patch.type === "customizable_amount") return { type: "customizable_amount", label: "", ingredientId: "", unit: "", defaultLevelIndex: 0, levels: [] };
      if (patch.type === "customizable_options") return { type: "customizable_options", label: "", options: [] };
      return next;
    });
    setForm({ ...form, ingredientSlots });
  }

  function removeSlot(index) {
    setForm({ ...form, ingredientSlots: form.ingredientSlots.filter((_, slotIndex) => slotIndex !== index) });
  }

  function handleImageSelect(e) {
    const imageUrl = e.target.value;
    setForm({ ...form, imageUrl });
    setImagePreview(imageUrl);
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        setForm({ ...form, imageUrl: dataUrl });
        setImagePreview(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <form className="long-form" onSubmit={onSubmit}>
      <label>Name</label>
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Text" />
      <label>Upload Image</label>
      {imagePreview && (
        <div style={{ marginBottom: "12px", textAlign: "center" }}>
          <img 
            src={imagePreview} 
            alt="Preview" 
            style={{ maxWidth: "150px", maxHeight: "150px", borderRadius: "4px", border: "1px solid #ddd" }}
          />
        </div>
      )}
      <input type="file" accept="image/*" onChange={handleFileUpload} style={{ marginBottom: "16px" }} />
      <label>Price</label>
      <input type="number" step="0.01" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} placeholder="Number" />
      <label>Recipe</label>
      <textarea value={form.recipe} onChange={(e) => setForm({ ...form, recipe: e.target.value })} placeholder="Text" />
      <h3>Ingredients</h3>
      {form.ingredientSlots.map((slot, index) => (
        <section className="slot-card" key={index}>
          <div className="slot-title">
            <strong>{index + 1}. {slotTitle(slot, ingredients)}</strong>
            <button type="button" className="danger" onClick={() => removeSlot(index)}>Remove</button>
          </div>
          <label>Type</label>
          <select value={slot.type} onChange={(e) => updateSlot(index, { type: e.target.value })}>
            <option value="normal">normal</option>
            <option value="customizable_options">customizable alternatives</option>
            <option value="customizable_amount">customizable level</option>
          </select>
          {slot.type === "normal" && <NormalSlot slot={slot} ingredients={ingredients} update={(patch) => updateSlot(index, patch)} />}
          {slot.type === "customizable_amount" && <AmountSlot slot={slot} ingredients={ingredients} update={(patch) => updateSlot(index, patch)} />}
          {slot.type === "customizable_options" && <OptionsSlot slot={slot} ingredients={ingredients} update={(patch) => updateSlot(index, patch)} />}
        </section>
      ))}
      <button type="button" className="wide-add" onClick={addSlot}>+ Add Ingredient</button>
      <Notice error={error} />
      <div className="form-actions">
        <button type="button" className="ghost" onClick={onCancel}>Cancel</button>
        <button className="primary">Submit</button>
      </div>
    </form>
  );
}

function NormalSlot({ slot, ingredients, update }) {
  return (
    <>
      <label>Ingredient name</label>
      <IngredientSelect ingredients={ingredients} value={slot.ingredientId} onChange={(ingredient) => update({ ingredientId: ingredient?.ingredientId || "", unit: ingredient?.unit || slot.unit })} />
      <label>Amount</label>
      <input type="number" step="0.01" value={slot.amount || ""} onChange={(e) => update({ amount: e.target.value })} placeholder="Number" />
    </>
  );
}

function AmountSlot({ slot, ingredients, update }) {
  function updateLevel(index, patch) {
    const levels = (slot.levels || []).map((level, levelIndex) => levelIndex === index ? { ...level, ...patch } : level);
    update({ levels });
  }
  return (
    <>
      <label>Ingredient name</label>
      <IngredientSelect ingredients={ingredients} value={slot.ingredientId} onChange={(ingredient) => update({ ingredientId: ingredient?.ingredientId || "", label: ingredient?.name || slot.label, unit: ingredient?.unit || slot.unit })} />
      <label>Default level</label>
      <select value={slot.defaultLevelIndex || 0} onChange={(e) => update({ defaultLevelIndex: Number(e.target.value) })}>
        {(slot.levels || []).map((level, index) => <option key={index} value={index}>{level.label || `Level ${index + 1}`}</option>)}
      </select>
      {(slot.levels || []).map((level, index) => (
        <div className="inline-pair" key={index}>
          <input value={level.label || ""} onChange={(e) => updateLevel(index, { label: e.target.value })} placeholder="Label" />
          <input type="number" step="0.01" value={level.amount || ""} onChange={(e) => updateLevel(index, { amount: e.target.value })} placeholder="Amount" />
          <button type="button" className="danger" onClick={() => update({ levels: slot.levels.filter((_, levelIndex) => levelIndex !== index) })}>X</button>
        </div>
      ))}
      <button type="button" className="wide-add" onClick={() => update({ levels: [...(slot.levels || []), { label: "", amount: "" }] })}>+ Add Level</button>
    </>
  );
}

function OptionsSlot({ slot, ingredients, update }) {
  function updateOption(index, patch) {
    const options = (slot.options || []).map((option, optionIndex) => {
      const next = optionIndex === index ? { ...option, ...patch } : option;
      return patch.isDefault && optionIndex !== index ? { ...next, isDefault: false } : next;
    });
    update({ options });
  }
  return (
    <>
      <label>Option group label</label>
      <input value={slot.label || ""} onChange={(e) => update({ label: e.target.value })} placeholder="e.g. Milk type" />
      {(slot.options || []).map((option, index) => (
        <div className="option-card" key={index}>
          <strong>Option {index + 1}</strong>
          <label>Name</label>
          <IngredientSelect ingredients={ingredients} value={option.ingredientId} onChange={(ingredient) => updateOption(index, { ingredientId: ingredient?.ingredientId || "", ingredientName: ingredient?.name || "", unit: ingredient?.unit || option.unit })} />
          <label>Amount</label>
          <input type="number" step="0.01" value={option.amount == null ? "" : option.amount} onChange={(e) => updateOption(index, { amount: e.target.value })} placeholder="Number" />
          <label>Price change</label>
          <select value={option.overridePrice != null ? "override" : "markup"} onChange={(e) => updateOption(index, e.target.value === "override" ? { overridePrice: "", priceMarkup: null } : { priceMarkup: "", overridePrice: null })}>
            <option value="markup">Mark up by</option>
            <option value="override">Override to</option>
          </select>
          <input type="number" step="0.01" value={option.overridePrice != null ? option.overridePrice : option.priceMarkup == null ? "" : option.priceMarkup} onChange={(e) => {
            const isOverride = option.overridePrice != null;
            updateOption(index, isOverride ? { overridePrice: e.target.value, priceMarkup: null } : { priceMarkup: e.target.value, overridePrice: null });
          }} placeholder="Baht" />
          <label className="check"><input type="checkbox" checked={Boolean(option.isDefault)} onChange={(e) => updateOption(index, { isDefault: e.target.checked })} /> Default option</label>
          <button type="button" className="danger" onClick={() => update({ options: slot.options.filter((_, optionIndex) => optionIndex !== index) })}>Remove option</button>
        </div>
      ))}
      <button type="button" className="wide-add" onClick={() => update({ options: [...(slot.options || []), { ingredientId: "", amount: "", unit: "", isDefault: !(slot.options || []).length, priceMarkup: null, overridePrice: null }] })}>+ Add Option</button>
    </>
  );
}

function IngredientSelect({ ingredients, value, onChange }) {
  return (
    <select value={value || ""} onChange={(e) => onChange(ingredients.find((ingredient) => ingredient.ingredientId === e.target.value))}>
      <option value="">Choose ingredient</option>
      {ingredients.map((ingredient) => <option key={ingredient.ingredientId} value={ingredient.ingredientId}>{ingredient.name} ({ingredient.amount} {ingredient.unit})</option>)}
    </select>
  );
}

function EmployeeOrders({ user }) {
  const orders = useRemote(() => api.get("/orders?status=unconfirmed"), []);
  const menu = useRemote(() => api.get("/menu-items"), []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyOrderForm);
  const [error, setError] = useState("");

  function create() {
    setEditing(null);
    setForm({ ...emptyOrderForm, items: [{ menuItemId: "", customizations: {} }] });
    setOpen(true);
  }

  async function edit(order) {
    setError("");
    try {
      const fullOrder = await api.get(`/orders/${order.orderId}`);
      setEditing(fullOrder.orderId);
      setForm({
        customerId: fullOrder.customerId || "",
        isTakeaway: Boolean(fullOrder.isTakeaway),
        notes: fullOrder.notes || "",
        appearanceTags: (fullOrder.appearanceTags || []).join(", "),
        discountCode: fullOrder.discountCode || "",
        items: (fullOrder.items || []).map((item) => ({ menuItemId: item.menuItemId, customizations: item.customizations || {} })),
      });
      setOpen(true);
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveDraft() {
    setError("");
    try {
      await persistOrder(false);
      setOpen(false);
      orders.refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitOrder(event) {
    event.preventDefault();
    setError("");
    try {
      await persistOrder(true);
      setOpen(false);
      orders.refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function persistOrder(confirmOrder) {
    let orderId = editing;
    const payload = {
      employeeId: user.uid,
      customerId: form.customerId || null,
      isTakeaway: form.isTakeaway,
      notes: form.notes || null,
      appearanceTags: tagsFromText(form.appearanceTags),
    };
    if (!orderId) {
      const order = await api.post("/orders", payload);
      orderId = order.orderId;
    } else {
      const existing = await api.get(`/orders/${orderId}`);
      await api.patch(`/orders/${orderId}`, payload);
      for (const item of existing.items || []) {
        await api.delete(`/orders/${orderId}/items/${item.itemId}`);
      }
    }
    for (const item of form.items.filter((entry) => entry.menuItemId)) {
      await api.post(`/orders/${orderId}/items`, { menuItemId: item.menuItemId, customizations: item.customizations || {} });
    }
    if (form.discountCode) {
      await api.post(`/orders/${orderId}/discount`, { code: form.discountCode });
    }
    if (confirmOrder) {
      await api.patch(`/orders/${orderId}/confirm`);
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this unconfirmed order?")) return;
    await api.delete(`/orders/${id}`);
    orders.refresh();
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Employee Orders</h2>
        <button className="primary" onClick={create}>Create</button>
      </div>
      <Notice error={orders.error || menu.error || error} />
      <div className="card-grid">
        {(orders.data || []).map((order) => (
          <article className="order-card" key={order.orderId}>
            <strong>{order.orderId}</strong>
            <span>{order.isTakeaway ? "Takeaway" : "Seat-in"}</span>
            <small>Customer: {order.customerId || "not set"}</small>
            <div className="actions">
              <button onClick={() => edit(order)}>Edit</button>
              <button className="danger" onClick={() => remove(order.orderId)}>Delete</button>
            </div>
          </article>
        ))}
      </div>
      {open && (
        <Modal title={editing ? editing : "Create new order"} onClose={() => setOpen(false)}>
          <OrderForm
            employeeId={user.uid}
            form={form}
            setForm={setForm}
            menu={menu.data || []}
            menuLoading={menu.loading}
            onCancel={saveDraft}
            onSubmit={submitOrder}
            submitLabel={editing ? "Submit" : "Create"}
            error={error}
          />
        </Modal>
      )}
    </section>
  );
}

function OrderForm({ employeeId, form, setForm, menu, menuLoading, onCancel, onSubmit, submitLabel, error }) {
  function addItem() {
    setForm({ ...form, items: [...form.items, { menuItemId: "", customizations: {} }] });
  }
  function updateItem(index, patch) {
    setForm({ ...form, items: form.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });
  }
  const canAddItem = !menuLoading && menu.length > 0;
  function removeItem(index) {
    setForm({ ...form, items: form.items.filter((_, itemIndex) => itemIndex !== index) });
  }
  return (
    <form className="long-form" onSubmit={onSubmit}>
      <div className="static-row"><strong>Employee ID:</strong><span>{employeeId}</span></div>
      <label>Customer ID</label>
      <input value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} placeholder="customer-001" />
      {form.items.map((item, index) => (
        <OrderItemEditor
          key={index}
          index={index}
          item={item}
          menu={menu}
          menuLoading={menuLoading}
          update={(patch) => updateItem(index, patch)}
          remove={() => removeItem(index)}
        />
      ))}
      <button type="button" className="wide-add" onClick={addItem} disabled={!canAddItem}>+ Add Menu Item</button>
      {!menuLoading && menu.length === 0 && <p className="notice">No menu items available yet. Create items from the menu page first.</p>}
      <label>Type</label>
      <select value={form.isTakeaway ? "takeaway" : "seat-in"} onChange={(e) => setForm({ ...form, isTakeaway: e.target.value === "takeaway" })}>
        <option value="takeaway">Takeaway</option>
        <option value="seat-in">Seat-in</option>
      </select>
      <label>Note</label>
      <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Text" />
      <label>Appearance Tags</label>
      <input value={form.appearanceTags} onChange={(e) => setForm({ ...form, appearanceTags: e.target.value })} placeholder="Blue shirt, Glasses" />
      <label>Discount code</label>
      <input value={form.discountCode} onChange={(e) => setForm({ ...form, discountCode: e.target.value.toUpperCase() })} placeholder="DISC-0000" />
      <Notice error={error} />
      <div className="form-actions">
        <button type="button" className="ghost" onClick={onCancel}>Cancel</button>
        <button className="primary">{submitLabel}</button>
      </div>
    </form>
  );
}

function OrderItemEditor({ index, item, menu, menuLoading, update, remove }) {
  const selected = menu.find((entry) => entry.menuItemId === item.menuItemId);
  function updateCustomization(label, value) {
    update({ customizations: { ...(item.customizations || {}), [label]: value } });
  }
  return (
    <section className="slot-card">
      <div className="slot-title">
        <strong>Menu Item {index + 1}</strong>
        <button type="button" className="danger" onClick={remove}>Remove</button>
      </div>
      <label>Name</label>
      {menu.length === 0 ? (
        <select disabled value="">
          <option value="">{menuLoading ? "Loading menu items..." : "No menu items available"}</option>
        </select>
      ) : (
        <select value={item.menuItemId || ""} onChange={(e) => update({ menuItemId: e.target.value, customizations: {} })}>
          <option value="">Choose menu item</option>
          {menu.map((entry) => <option key={entry.menuItemId} value={entry.menuItemId}>{entry.name}</option>)}
        </select>
      )}
      {selected && (
        <div className="order-item-preview">
          {selected.imageUrl ? (
            <img src={selected.imageUrl} alt={selected.name} />
          ) : (
            <div className="order-item-preview__fallback">{selected.name.slice(0, 1)}</div>
          )}
          <div>
            <strong>{selected.name}</strong>
            <span>{money(selected.basePrice)}</span>
          </div>
        </div>
      )}
      {selected?.ingredientSlots?.map((slot, slotIndex) => {
        const label = slotLabel(slot);
        if (slot.type === "customizable_amount") {
          return (
            <div key={slotIndex}>
              <label>{label}</label>
              <select value={item.customizations?.[label]?.chosenLabel || ""} onChange={(e) => {
                const level = slot.levels.find((entry) => entry.label === e.target.value);
                updateCustomization(label, {
                  type: "customizable_amount",
                  ingredientId: slot.ingredientId,
                  ingredientName: slot.ingredientName,
                  chosenLabel: level?.label || "",
                  chosenAmount: Number(level?.amount || 0),
                  unit: slot.unit,
                });
              }}>
                <option value="">Default</option>
                {(slot.levels || []).map((level) => <option key={level.label} value={level.label}>{level.label}</option>)}
              </select>
            </div>
          );
        }
        if (slot.type === "customizable_options") {
          return (
            <div key={slotIndex}>
              <label>{label}</label>
              <select value={item.customizations?.[label]?.chosenIngredientId || ""} onChange={(e) => {
                const option = slot.options.find((entry) => entry.ingredientId === e.target.value);
                updateCustomization(label, {
                  type: "customizable_options",
                  chosenIngredientId: option?.ingredientId || "",
                  chosenIngredientName: option?.ingredientName || "",
                  chosenAmount: Number(option?.amount || 0),
                  unit: option?.unit,
                  priceMarkup: option?.priceMarkup,
                  overridePrice: option?.overridePrice,
                });
              }}>
                <option value="">Default</option>
                {(slot.options || []).map((option) => <option key={`${option.ingredientId}-${option.ingredientName}`} value={option.ingredientId}>{option.ingredientName}</option>)}
              </select>
            </div>
          );
        }
        return null;
      })}
    </section>
  );
}

function EmployeeQueue() {
  const remote = useRemote(() => api.get("/orders/queue"), []);
  const [active, setActive] = useState(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  async function select(order) {
    setError("");
    try {
      setActive(await api.get(`/orders/${order.orderId}`));
    } catch (err) {
      setError(err.message);
    }
  }

  async function move(action) {
    setError("");
    try {
      await api.patch(`/orders/${active.orderId}/${action}`);
      setActive(null);
      remote.refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="panel queue-panel">
      <h2>Queue</h2>
      <Notice error={remote.error || error} />
      <div className="queue-grid">
        <div className="queue-list">
          {(remote.data || []).map((order) => (
            <button className="order-card" key={order.orderId} onClick={() => select(order)}>
              <strong>{order.orderId}</strong>
              <span>{statusLabel(order.status)} | {order.isTakeaway ? "Takeaway" : "Seat-in"}</span>
              <small>{elapsed(order.createdAt, tick)} elapsed</small>
              <small>{(order.itemNames || []).join(", ") || "No items"}</small>
            </button>
          ))}
        </div>
        <div className="detail">
          {!active ? <p>Select an order to expand it.</p> : (
            <>
              <h3>{active.orderId}</h3>
              <dl className="detail-list">
                <dt>Status</dt><dd>{statusLabel(active.status)}</dd>
                <dt>Employee</dt><dd>{active.employeeId}</dd>
                <dt>Customer</dt><dd>{active.customerId || "not set"}</dd>
                <dt>Type</dt><dd>{active.isTakeaway ? "Takeaway" : "Seat-in"}</dd>
                <dt>Discount</dt><dd>{active.discountCode || "none"} ({money(active.discountAmount)})</dd>
                <dt>Total</dt><dd>{money(active.totalPrice)}</dd>
                <dt>Notes</dt><dd>{active.notes || "none"}</dd>
              </dl>
              <div className="tag-row">{(active.appearanceTags || []).map((tag) => <span key={tag}>{tag}</span>)}</div>
              {(active.items || []).map((item) => <OrderItemDetail key={item.itemId} item={item} />)}
              <div className="actions">
                <button className="danger" onClick={() => move("cancel")}>Cancel</button>
                {active.status === "on_queue" ? <button className="primary" onClick={() => move("start")}>Mark as ongoing</button> : <button className="primary" onClick={() => move("complete")}>Mark completed</button>}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function CustomerMenu() {
  const menu = useRemote(() => api.get("/menu-items"), []);
  const menuItems = Array.isArray(menu.data) ? menu.data : [];
  return (
    <section className="panel">
      <h2>Menu</h2>
      <Notice error={menu.error} />
      {menu.loading ? (
        <div className="empty-state">Loading menu...</div>
      ) : menuItems.length === 0 ? (
        <div className="empty-state">No menu items available yet.</div>
      ) : (
        <div className="menu-grid">
          {menuItems.map((item) => {
            const itemName = item.name || "Menu item";
            return (
              <article className={`menu-card ${item.isAvailable ? "" : "is-sold-out"}`} key={item.menuItemId || itemName}>
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={itemName}
                    className="photo"
                    style={{ width: "100%", height: "120px", objectFit: "cover" }}
                  />
                ) : (
                  <div className="photo">{itemName.slice(0, 1)}</div>
                )}
                <strong>{itemName}</strong>
                <span>{item.isAvailable ? money(item.basePrice) : "Sold out"}</span>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function CustomerDiscount() {
  const [discount, setDiscount] = useState(null);
  const [error, setError] = useState("");
  async function generate() {
    setError("");
    try {
      setDiscount(await api.post("/discount-codes/generate", { type: "fixed", value: 20 }));
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <section className="panel discount-panel">
      <h2>Redeem Discount</h2>
      <button className="primary" onClick={generate}>Generate 20 Baht Code</button>
      <Notice error={error} />
      {discount && (
        <article className="discount-code">
          <span>Your Discount Code is</span>
          <strong>{discount.code}</strong>
        </article>
      )}
    </section>
  );
}

function CustomerTracking({ user }) {
  const remote = useRemote(() => api.get("/orders"), []);
  const [message, setMessage] = useState("");
  const myOrders = (remote.data || []).filter((order) => order.customerId === user.uid);
  const visibleStatuses = ["on_queue", "ongoing", "completed", "canceled"];
  const active = myOrders.find((order) => visibleStatuses.includes(order.status) && !(order.status === "completed" && order.customerReceived));
  const allActive = (remote.data || []).filter((order) => ["on_queue", "ongoing"].includes(order.status));
  const ahead = active ? allActive.filter((order) => new Date(order.createdAt || 0) < new Date(active.createdAt || 0)).length : 0;

  async function received() {
    setMessage("");
    try {
      await api.patch(`/orders/${active.orderId}/received`);
      setMessage("Order received. Thank you.");
      remote.refresh();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <section className="panel tracking">
      <h2>My Order</h2>
      <Notice error={remote.error} message={message} />
      {!active ? <strong>You do not have any active order.</strong> : (
        <article className="tracker-card">
          <span>{active.orderId}</span>
          <strong>{trackingText(active, ahead)}</strong>
          <small>{statusLabel(active.status)}</small>
          {active.status === "completed" && <button className="primary" onClick={received}>Received</button>}
        </article>
      )}
    </section>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-panel">
        <div className="modal-head">
          <h2>{title}</h2>
          <button onClick={onClose}>X</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function OrderItemDetail({ item }) {
  return (
    <article className="mini-card">
      <strong>{item.menuItemName} - {money(item.itemPrice)}</strong>
      {Object.entries(item.customizations || {}).map(([label, value]) => (
        <p key={label}><b>{label}:</b> {value.chosenLabel || value.chosenIngredientName} {value.chosenAmount ? `(${value.chosenAmount} ${value.unit || ""})` : ""}</p>
      ))}
      <p>{item.recipeSnapshot || "No recipe saved."}</p>
    </article>
  );
}

function Table({ title, rows, columns, actions }) {
  return (
    <div className="table-wrap">
      {title && <h3>{title}</h3>}
      <table>
        <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}{actions && <th>Actions</th>}</tr></thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.orderId || row.menuItemId || row.ingredientId || row.menuItemName || index}>
              {columns.map((column) => <td key={column}>{formatCell(row[column])}</td>)}
              {actions && <td className="actions">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function normalizeSlots(slots) {
  return slots.map((slot) => {
    if (slot.type === "normal") {
      return { type: "normal", ingredientId: slot.ingredientId, amount: Number(slot.amount || 0), unit: slot.unit };
    }
    if (slot.type === "customizable_amount") {
      return {
        type: "customizable_amount",
        label: slot.label,
        ingredientId: slot.ingredientId,
        unit: slot.unit,
        defaultLevelIndex: Number(slot.defaultLevelIndex || 0),
        levels: (slot.levels || []).map((level) => ({ label: level.label, amount: Number(level.amount || 0) })),
      };
    }
    return {
      type: "customizable_options",
      label: slot.label,
      options: (slot.options || []).map((option) => ({
        ingredientId: option.ingredientId,
        ingredientName: option.ingredientName,
        amount: Number(option.amount || 0),
        unit: option.unit,
        isDefault: Boolean(option.isDefault),
        priceMarkup: option.priceMarkup === "" || option.priceMarkup === undefined || option.priceMarkup === null ? null : Number(option.priceMarkup),
        overridePrice: option.overridePrice === "" || option.overridePrice === undefined || option.overridePrice === null ? null : Number(option.overridePrice),
      })),
    };
  });
}

function slotLabel(slot) {
  return slot.label || slot.ingredientName || "Customization";
}

function slotTitle(slot, ingredients) {
  if (slot.type === "customizable_options") return slot.label || "Options";
  const ingredient = ingredients.find((entry) => entry.ingredientId === slot.ingredientId);
  return ingredient?.name || slot.ingredientName || "Ingredient";
}

function tagsFromText(value) {
  return value.split(",").map((tag) => tag.trim()).filter(Boolean);
}

function formatCell(value) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  return String(value ?? "");
}

function elapsed(createdAt, tick) {
  void tick;
  if (!createdAt) return "00:00";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function trackingText(order, ahead) {
  if (order.status === "ongoing") return "Currently making";
  if (order.status === "completed") return "Your order is ready";
  if (order.status === "canceled") return "Your order has been canceled";
  return `${ahead} queues ahead`;
}

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("posUser") || "null"));
  const [tab, setTab] = useState(user ? tabs[user.role][0] : "menu");

  function login(nextUser) {
    localStorage.setItem("posUser", JSON.stringify(nextUser));
    setUser(nextUser);
    setTab(tabs[nextUser.role][0]);
  }

  function logout() {
    localStorage.removeItem("posUser");
    setUser(null);
  }

  const page = useMemo(() => {
    if (!user) return null;
    if (user.role === "admin") {
      if (tab === "inventory") return <AdminInventory />;
      if (tab === "menu") return <AdminMenu />;
      if (tab === "orders") return <EmployeeOrders user={user} />;
      if (tab === "queue") return <EmployeeQueue />;
      return <AdminAnalytics />;
    }
    if (user.role === "employee") {
      if (tab === "queue") return <EmployeeQueue />;
      if (tab === "inventory") return <AdminInventory employeeOnly />;
      return <EmployeeOrders user={user} />;
    }
    if (tab === "discount") return <CustomerDiscount />;
    if (tab === "tracking") return <CustomerTracking user={user} />;
    return <CustomerMenu />;
  }, [user, tab]);

  if (!user) return <Login onLogin={login} />;
  return <Shell user={user} tab={tab} setTab={setTab} onLogout={logout}>{page}</Shell>;
}

createRoot(document.getElementById("root")).render(<App />);
