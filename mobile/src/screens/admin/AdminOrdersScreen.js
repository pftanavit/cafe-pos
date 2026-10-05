import React, { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View, SafeAreaView, StatusBar, TouchableOpacity, StyleSheet } from "react-native";
import { wire } from "../WireframeStyles";

const initialOrders = [
  { id: "Order 1", customer: "Customer A", type: "Takeaway", items: "1 Latte, 2 Thai Tea", notes: "No sugar", tags: ["Blue shirt"], status: "unconfirmed" },
  { id: "Order 2", customer: "Customer B", type: "Dine-in", items: "1 Matcha", notes: "Extra ice", tags: ["Glasses"], status: "unconfirmed" },
];

const emptyOrder = {
  customerId: "",
  isTakeaway: true,
  notes: "",
  appearanceTags: "",
  discountCode: "",
  items: "",
};

export default function AdminOrdersScreen({ navigation, route, onLogout }) {
  const { user } = route?.params || {};
  const [orders, setOrders] = useState(initialOrders);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyOrder);

  function openCreate() {
    setEditing(false);
    setForm(emptyOrder);
    setSelected(null);
  }

  function openEdit(order) {
    setEditing(true);
    setSelected(order);
    setForm({
      customerId: order.customer,
      isTakeaway: order.type === "Takeaway",
      notes: order.notes,
      appearanceTags: order.tags.join(", "),
      discountCode: "",
      items: order.items,
    });
  }

  function saveOrder() {
    const nextOrder = {
      id: editing ? selected.id : `Order ${orders.length + 1}`,
      customer: form.customerId || "Customer",
      type: form.isTakeaway ? "Takeaway" : "Dine-in",
      items: form.items || "",
      notes: form.notes,
      tags: form.appearanceTags.split(",").map((tag) => tag.trim()).filter(Boolean),
      status: "unconfirmed",
    };
    setOrders((current) => {
      if (editing) {
        return current.map((order) => (order.id === selected.id ? nextOrder : order));
      }
      return [...current, nextOrder];
    });
    setForm(emptyOrder);
    setEditing(false);
    setSelected(null);
  }

  function deleteOrder(orderId) {
    setOrders((current) => current.filter((order) => order.id !== orderId));
    if (selected?.id === orderId) setSelected(null);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F8FB" />
      <View style={styles.accountHeader}>
        <View style={styles.accountInfo}>
          <Text style={styles.accountText}>ID: {user?.uid || user?.id || 'N/A'}</Text>
          <Text style={styles.accountText}>User: {user?.username || 'N/A'}</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => onLogout?.()}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <View style={wire.page}>
        <Text style={wire.title}>Admin Order Management</Text>
        <View style={wire.canvas}>
          <View style={wire.nav}>
            <Text style={wire.navText}>Analytics</Text>
            <Text style={wire.navText}>Inventory Management</Text>
            <Text style={wire.navText}>Menu Items Management</Text>
            <Text style={wire.navText}>Orders</Text>
            <Text style={wire.navText}>Queue</Text>
            <View style={wire.navSpacer} />
            <Text style={wire.navText}>Log Out</Text>
          </View>
          <View style={{ flex: 1, flexDirection: "row" }}>
            <ScrollView style={{ width: "48%", padding: 14, borderRightColor: "#ddd", borderRightWidth: 1 }}>
            {orders.map((order) => (
              <View style={wire.card} key={order.id}>
                <View style={wire.cardHead}>
                  <Text style={[wire.tinyBold, { flex: 1 }]}>{order.id}</Text>
                  <Text style={[wire.tinyBold, { flex: 1 }]}>{order.type}</Text>
                </View>
                <Text style={wire.tiny}>{order.customer}</Text>
                <Text style={wire.tiny}>{order.items}</Text>
                <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
                  <Pressable style={wire.editPill} onPress={() => openEdit(order)}>
                    <Text style={wire.editText}>Edit</Text>
                  </Pressable>
                  <Pressable style={wire.deleteBox} onPress={() => deleteOrder(order.id)}>
                    <Text style={wire.deleteText}>X</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={{ flex: 1, padding: 18 }}>
            <Text style={wire.sectionTitle}>{editing ? `Edit ${selected?.id}` : "Create New Order"}</Text>
            <Text style={wire.label}>Customer ID</Text>
            <TextInput style={wire.input} value={form.customerId} onChangeText={(text) => setForm({ ...form, customerId: text })} placeholder="customer-001" />
            <Text style={wire.label}>Items</Text>
            <TextInput style={wire.input} value={form.items} onChangeText={(text) => setForm({ ...form, items: text })} placeholder="1 Latte, 2 Thai Tea" />
            <Text style={wire.label}>Type</Text>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <Pressable style={[wire.pill, form.isTakeaway && wire.pillActive]} onPress={() => setForm({ ...form, isTakeaway: true })}>
                <Text>Takeaway</Text>
              </Pressable>
              <Pressable style={[wire.pill, !form.isTakeaway && wire.pillActive]} onPress={() => setForm({ ...form, isTakeaway: false })}>
                <Text>Seat-in</Text>
              </Pressable>
            </View>
            <Text style={wire.label}>Notes</Text>
            <TextInput style={wire.input} value={form.notes} onChangeText={(text) => setForm({ ...form, notes: text })} placeholder="Order notes" />
            <Text style={wire.label}>Appearance Tags</Text>
            <TextInput style={wire.input} value={form.appearanceTags} onChangeText={(text) => setForm({ ...form, appearanceTags: text })} placeholder="Blue shirt, Glasses" />
            <Text style={wire.label}>Discount Code</Text>
            <TextInput style={wire.input} value={form.discountCode} onChangeText={(text) => setForm({ ...form, discountCode: text })} placeholder="DISC-0000" />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
              <Pressable style={wire.linkButton} onPress={openCreate}>
                <Text style={wire.linkButtonText}>Clear</Text>
              </Pressable>
              <Pressable style={wire.button} onPress={saveOrder}>
                <Text style={wire.buttonText}>{editing ? "Update" : "Create"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F8FB",
  },
  accountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#D8DEE8",
  },
  accountInfo: {
    flex: 1,
  },
  accountText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#C2413A",
    borderRadius: 6,
  },
  logoutText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
