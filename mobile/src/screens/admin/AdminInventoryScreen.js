import React, { useState } from "react";
import { Pressable, Text, TextInput, View, SafeAreaView, StatusBar, TouchableOpacity, StyleSheet } from "react-native";
import { wire } from "../WireframeStyles";

const ingredients = [
  ["Espresso Beans", "1800", "g"],
  ["Whole Milk", "5600", "ml"],
  ["Thai Tea Mix", "2400", "g"],
];

export default function AdminInventoryScreen({ navigation, route, onLogout }) {
  const { user } = route?.params || {};
  const [showForm, setShowForm] = useState(false);

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
      <Text style={wire.title}>Admin Inventory</Text>
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
        <View style={wire.content}>
          <Pressable style={[wire.button, { alignSelf: "flex-end", marginBottom: 12 }]} onPress={() => setShowForm(true)}>
            <Text style={wire.buttonText}>Create New</Text>
          </Pressable>
          <View style={wire.table}>
            <View style={[wire.row, wire.headerRow]}>
              <Text style={wire.cell}>Name</Text>
              <Text style={wire.cell}>Amount</Text>
              <Text style={wire.cell}>Unit</Text>
              <Text style={{ width: 42 }} />
            </View>
            {ingredients.map((row) => (
              <View style={wire.row} key={row[0]}>
                {row.map((cell) => (
                  <Text style={wire.cell} key={cell}>{cell}</Text>
                ))}
                <Pressable style={wire.deleteBox}>
                  <Text style={wire.deleteText}>X</Text>
                </Pressable>
              </View>
            ))}
          </View>
          {showForm && (
            <View style={[wire.formPanel, { position: "absolute", top: 24 }]}>
              <Text style={wire.sectionTitle}>Form</Text>
              <Text style={wire.label}>Name</Text>
              <TextInput style={wire.input} />
              <Text style={wire.label}>Amount</Text>
              <TextInput style={wire.input} keyboardType="numeric" />
              <Text style={wire.label}>Unit</Text>
              <TextInput style={wire.input} />
              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12 }}>
                <Pressable onPress={() => setShowForm(false)}>
                  <Text style={wire.linkButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={wire.button}>
                  <Text style={wire.buttonText}>Submit</Text>
                </Pressable>
              </View>
            </View>
          )}
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
