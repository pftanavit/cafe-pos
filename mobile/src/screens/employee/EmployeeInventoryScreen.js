import React from "react";
import { Pressable, Text, View, SafeAreaView, StatusBar, TouchableOpacity, StyleSheet } from "react-native";
import { wire } from "../WireframeStyles";

const stock = [
  ["Espresso Beans", "1800", "g"],
  ["Oat Milk", "3200", "ml"],
  ["Syrup", "900", "ml"],
];

export default function EmployeeInventoryScreen({ navigation, route, onLogout }) {
  const { user } = route?.params || {};

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
      <Text style={wire.title}>Employee Inventory</Text>
      <View style={wire.canvas}>
        <View style={wire.nav}>
          <Text style={wire.navText}>Order</Text>
          <Text style={wire.navText}>Queue</Text>
          <Text style={wire.navText}>Inventory</Text>
          <View style={wire.navSpacer} />
          <Text style={wire.navText}>Log Out</Text>
        </View>
        <View style={wire.content}>
          <View style={wire.table}>
            <View style={[wire.row, wire.headerRow]}>
              <Text style={wire.cell}>Ingredient</Text>
              <Text style={wire.cell}>Unit</Text>
              <Text style={[wire.cell, { fontSize: 18, fontWeight: "700" }]}>Amount</Text>
            </View>
            {stock.map((row) => (
              <View style={wire.row} key={row[0]}>
                <Text style={wire.cell}>{row[0]}</Text>
                <Text style={wire.cell}>{row[2]}</Text>
                <Text style={wire.cell}>{row[1]}</Text>
                <Pressable style={wire.editPill}>
                  <Text style={wire.editText}>Edit</Text>
                </Pressable>
              </View>
            ))}
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
