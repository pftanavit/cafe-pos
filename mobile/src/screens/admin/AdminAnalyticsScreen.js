import React from "react";
import { Text, View, SafeAreaView, StatusBar, TouchableOpacity, StyleSheet } from "react-native";
import { colors, wire } from "../WireframeStyles";

const orders = ["Order History", "Date", "Item", "Price"];

export default function AdminAnalyticsScreen({ navigation, route, onLogout }) {
  const { user } = route?.params || {};

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F8FB" />

      {/* Account Details Header */}
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
        <Text style={wire.title}>Admin Home Analytics</Text>
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
            <Text style={wire.sectionTitle}>Order History</Text>
            <View style={[wire.table, { height: 120, justifyContent: "center" }]}>
              <Text style={{ alignSelf: "center", fontWeight: "700" }}>Table</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 42, gap: 58 }}>
              <View style={{ width: 250, height: 120, backgroundColor: colors.mid, justifyContent: "center" }}>
                <Text style={{ alignSelf: "center", fontWeight: "700" }}>Some chart</Text>
              </View>
              <View
                style={{
                  width: 144,
                  height: 144,
                  borderRadius: 72,
                  backgroundColor: colors.mid,
                  justifyContent: "center",
                }}
              >
                <Text style={{ alignSelf: "center", fontWeight: "700" }}>Some chart</Text>
              </View>
            </View>
            <View style={{ position: "absolute", opacity: 0 }}>
              {orders.map((item) => (
                <Text key={item}>{item}</Text>
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
