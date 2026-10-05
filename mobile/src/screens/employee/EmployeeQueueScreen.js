import React, { useState } from "react";
import { Pressable, ScrollView, Text, View, SafeAreaView, StatusBar, TouchableOpacity, StyleSheet } from "react-native";
import { colors, wire } from "../WireframeStyles";

const orders = [
  { id: "Order 1", type: "Takeaway", time: "03:24", items: "1 Latte, 2 Thai tea", status: "ongoing" },
  { id: "Order 2", type: "Takeaway", time: "02:42", items: "1 Hot Americano" },
  { id: "Order 3", type: "Dine-in", time: "01:21", items: "1 Matcha" },
  { id: "Order 4", type: "Dine-in", time: "00:54", items: "1 Peach tea" },
];

export default function EmployeeQueueScreen({ navigation, route, onLogout }) {
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
      <Text style={wire.title}>Employee Queue Expanded Order</Text>
      <View style={wire.canvas}>
        <View style={wire.nav}>
          <Text style={wire.navText}>Order</Text>
          <Text style={wire.navText}>Queue</Text>
          <Text style={wire.navText}>Inventory</Text>
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
                  {order.status && <Text style={[wire.tinyBold, { color: colors.green, marginRight: 12 }]}>Ongoing</Text>}
                  <Text style={wire.tinyBold}>{order.time}</Text>
                </View>
                <View style={wire.cardBody}>
                  <Text style={wire.tiny}>{order.items}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
          <View style={{ flex: 1, padding: 18 }}>
            <Text style={wire.tinyBold}>{active.id}   {active.type}</Text>
            <View style={{ backgroundColor: colors.soft, padding: 12, marginTop: 10 }}>
              <Text style={wire.tinyBold}>1 x Latte                      Recipe</Text>
              <Text style={wire.tiny}>- 0% sweetness</Text>
              <Text style={wire.tiny}>- normal coffee beans</Text>
              <Text style={wire.tiny}>1. Pull Double Espresso</Text>
              <Text style={wire.tiny}>2. Pour ice in the cup</Text>
              <Text style={wire.tiny}>3. Pour 200ml of milk</Text>
              <Text style={wire.tiny}>4. Top with Espresso</Text>
            </View>
            <View style={{ backgroundColor: colors.soft, padding: 12, marginTop: 10 }}>
              <Text style={wire.tinyBold}>2 x Thai Tea                  Recipe</Text>
              <Text style={wire.tiny}>- 50% sweetness</Text>
              <Text style={wire.tiny}>1. Pour ice in the cup</Text>
              <Text style={wire.tiny}>2. Pour 200ml of milk</Text>
              <Text style={wire.tiny}>3. Top with Thai Tea</Text>
            </View>
            <Text style={[wire.tinyBold, { marginTop: 16 }]}>Customer Description:</Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
              <Text style={[wire.tiny, { backgroundColor: colors.soft, padding: 8 }]}>Blue T Shirt</Text>
              <Text style={[wire.tiny, { backgroundColor: colors.soft, padding: 8 }]}>Glasses</Text>
            </View>
            <View style={{ flex: 1 }} />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 18 }}>
              <Text style={wire.tinyBold}>Cancel</Text>
              <Pressable style={wire.button}>
                <Text style={wire.buttonText}>{active.status ? "Mark as Completed" : "Mark as Ongoing"}</Text>
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
