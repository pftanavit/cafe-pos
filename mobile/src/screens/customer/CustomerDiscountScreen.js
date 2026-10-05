import React, { useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { api } from "../../api";

export default function CustomerDiscountScreen({ navigation, route, onLogout, user }) {
  const { user: routeUser } = route?.params || {};
  const currentUser = user || routeUser;
  const customerId = currentUser?.uid || currentUser?.id;
  const [discountCode, setDiscountCode] = useState("DISC - 0000");
  const [loading, setLoading] = useState(false);

  const generateDiscountCode = async () => {
    setLoading(true);
    try {
      const result = await api.post("/discount-codes/generate", {
        type: "fixed",
        value: 20.0,
      });
      if (result && result.code) {
        setDiscountCode(result.code);
      }
    } catch (error) {
      console.error("Failed to generate discount code:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F8FB" />

      <View style={styles.accountHeader}>
        <View style={styles.accountInfo}>
          <Text style={styles.accountText}>ID: {customerId || 'N/A'}</Text>
          <Text style={styles.accountText}>User: {currentUser?.username || 'N/A'}</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => onLogout?.()}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Customer Discount</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.body}>
        <Text style={styles.pageTitle}>Redeem Discount!</Text>
        <Text style={styles.pageSubtitle}>Press redeem to generate your discount code.</Text>

        <TouchableOpacity
          style={[styles.redeemButton, loading && styles.redeemButtonDisabled]}
          onPress={generateDiscountCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.redeemButtonText}>Redeem</Text>
          )}
        </TouchableOpacity>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Discount Code is</Text>
          <Text style={styles.codeValue}>{discountCode}</Text>
          <Text style={styles.closeMarker}>x</Text>
        </View>

        <TouchableOpacity style={styles.doneButton} onPress={() => navigation?.goBack()}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
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
    color: "#667085",
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
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  backButton: {
    width: 60,
    alignItems: "flex-start",
  },
  backText: {
    fontSize: 16,
    color: "#176B87",
    fontWeight: "600",
  },
  headerText: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    color: "#18212F",
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
    color: "#18212F",
  },
  pageSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#667085",
  },
  redeemButton: {
    backgroundColor: "#176B87",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 20,
  },
  redeemButtonDisabled: {
    opacity: 0.6,
  },
  redeemButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  codeCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D8DEE8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  codeLabel: {
    fontSize: 16,
    color: "#667085",
    marginBottom: 8,
  },
  codeValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0F4F64",
    marginBottom: 8,
  },
  closeMarker: {
    fontSize: 20,
    color: "#667085",
    position: "absolute",
    top: 10,
    right: 10,
  },
  doneButton: {
    backgroundColor: "#12805C",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: "center",
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
