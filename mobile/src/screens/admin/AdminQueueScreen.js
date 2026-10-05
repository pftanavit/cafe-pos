import React, { useState } from "react";
import { Pressable, ScrollView, Text, View, SafeAreaView, StatusBar, TouchableOpacity, StyleSheet } from "react-native";
import { colors, wire } from "../WireframeStyles";

const orders = [
  { id: "Order 1", type: "Takeaway", time: "03:24", items: "1 Latte, 2 Thai Tea", status: "on_queue", tags: ["Blue shirt"] },
  { id: "Order 2", type: "Dine-in", time: "02:42", items: "1 Hot Americano", status: "ongoing", tags: ["Glasses"] },
  { id: "Order 3", type: "Dine-in", time: "01:21", items: "1 Matcha", status: "on_queue", tags: [] },
  { id: "Order 4", type: "Dine-in", time: "00:54", items: "1 Peach Tea", status: "completed", tags: [] },
];

export default function AdminQueueScreen({ navigation, route, onLogout }) {
  const { user } = route?.params || {};
  const [selected, setSelected] = useState(null);
  const active = selected || orders[0];

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
      <Text style={wire.title}>Admin Order Queue</Text>
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
          <ScrollView style={{ width: "48%", padding: 14, borderRightColor: colors.text, borderRightWidth: 1 }}>
            {orders.map((order) => (
              <Pressable style={wire.card} key={order.id} onPress={() => setSelected(order)}>
                <View style={wire.cardHead}>
                  <Text style={[wire.tinyBold, { flex: 1 }]}>{order.id}</Text>
                  <Text style={[wire.tinyBold, { flex: 1 }]}>{order.type}</Text>
                  {order.status === "ongoing" && <Text style={[wire.tinyBold, { color: colors.green, marginRight: 12 }]}>Ongoing</Text>}
                  <Text style={wire.tinyBold}>{order.time}</Text>
                </View>
                <Text style={wire.tiny}>{order.items}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={{ flex: 1, padding: 18 }}>
            <Text style={wire.sectionTitle}>{active.id}</Text>
            <View style={{ backgroundColor: colors.soft, padding: 12, marginTop: 10 }}>
              <Text style={wire.tinyBold}>{active.items}</Text>
              <Text style={wire.tiny}>{active.tags.map((tag) => tag).join(", ") || "No tags"}</Text>
            </View>
            <Text style={[wire.tinyBold, { marginTop: 16 }]}>Customer Details</Text>
            <Text style={wire.tiny}>Type: {active.type}</Text>
            <Text style={wire.tiny}>Status: {active.status}</Text>
            <View style={{ flex: 1 }} />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 18 }}>
              <Pressable style={wire.deleteBox}>
                <Text style={wire.deleteText}>Cancel</Text>
              </Pressable>
              <Pressable style={wire.button}>
                <Text style={wire.buttonText}>{active.status === "on_queue" ? "Mark as Ongoing" : active.status === "ongoing" ? "Mark as Completed" : "Completed"}</Text>
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
