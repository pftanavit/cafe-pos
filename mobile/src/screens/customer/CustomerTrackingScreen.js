import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { fetchCustomerOrders, receiveOrder } from "../../api";

const statusCopy = {
  queue: { title: "Order Status", message: "3 Queues ahead", color: "#B76E00" },
  ongoing: { title: "Order Status", message: "Currently Making", color: "#12805C" },
  complete: { title: "Order Status", message: "Your Order is Ready !", color: "#12805C", close: true },
  canceled: { title: "Order Status", message: "Your Order has been Canceled", color: "#C2413A", close: true },
  empty: { title: "Order Status", message: "You Don't have any Ongoing Order", color: "#18212F" },
};

export default function CustomerTrackingScreen({ navigation, route, onLogout, user }) {
  const { user: routeUser } = route?.params || {};
  const currentUser = user || routeUser;
  const customerId = currentUser?.uid || currentUser?.id;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [receiving, setReceiving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadOrder = async () => {
      if (!customerId) {
        if (mounted) {
          setOrder(null);
          setLoading(false);
        }
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const orders = await fetchCustomerOrders(customerId);
        const visibleStatuses = ["on_queue", "ongoing", "completed", "canceled"];
        const activeOrder = Array.isArray(orders)
          ? orders.find((item) => visibleStatuses.includes(item.status) && !(item.status === "completed" && item.customerReceived))
          : null;
        if (!mounted) return;
        setOrder(activeOrder || null);
        if (activeOrder) setMessage("");
      } catch (err) {
        if (!mounted) return;
        setError("Unable to load order data.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadOrder();
    const interval = setInterval(loadOrder, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [customerId]);

  const handleReceiveOrder = async () => {
    if (!order?.orderId) return;
    setError(null);
    setMessage("");
    setReceiving(true);
    try {
      await receiveOrder(order.orderId);
      setOrder(null);
      setMessage("Order received. Thank you.");
    } catch (err) {
      setError("Unable to mark this order as received.");
    } finally {
      setReceiving(false);
      setLoading(false);
    }
  };

  const rawStatus = order?.status || "empty";
  const statusKey =
    rawStatus === "on_queue" ? "queue" :
    rawStatus === "completed" ? "complete" :
    rawStatus === "unconfirmed" ? "empty" :
    rawStatus;
  const state = statusCopy[statusKey] || statusCopy.empty;
  const showClose = state.close === true;
  const orderNumber = order?.orderId ? `#${order.orderId}` : "N/A";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F8FB" />

      {/* Account Details Header */}
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
        <TouchableOpacity onPress={() => navigation?.navigate("CustomerMenu")}>
          <Text style={styles.headerLink}>Menu</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{state.title}</Text>
        <TouchableOpacity onPress={() => onLogout?.()}>
          <Text style={styles.headerLink}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#176B87" />
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : rawStatus === "empty" ? (
        <View style={styles.emptyContainer}>
          <Text style={message ? styles.messageText : styles.emptyText}>{message || state.message}</Text>
        </View>
      ) : (
        <View style={styles.trackerCard}>
          {showClose && (
            <TouchableOpacity style={styles.closeButton} onPress={() => navigation?.navigate("CustomerMenu")}> 
              <Text style={styles.closeText}>x</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.sectionTitle}>Your Order:</Text>
          <Text style={styles.orderNumber}>{orderNumber}</Text>
          <Text style={[styles.statusMessage, { color: state.color }]}>{state.message}</Text>
          {rawStatus === "completed" && (
            <TouchableOpacity
              style={[styles.receivedButton, receiving && styles.receivedButtonDisabled]}
              onPress={handleReceiveOrder}
              disabled={receiving}
            >
              <Text style={styles.receivedButtonText}>
                {receiving ? "Saving..." : "Received"}
              </Text>
            </TouchableOpacity>
          )}
          {order?.items?.length ? (
            <View style={styles.orderDetails}>
              <Text style={styles.orderSection}>Items</Text>
              {order.items.map((item) => (
                <Text key={item.itemId} style={styles.orderItem}>
                  • {item.menuItemName}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      )}

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation?.navigate("CustomerMenu")}> 
          <Text style={styles.tabText}>Menu</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}> 
          <Text style={[styles.tabText, styles.tabActive]}>My Order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => onLogout?.()}> 
          <Text style={styles.tabText}>Log Out</Text>
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
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomColor: "#D8DEE8",
    borderBottomWidth: 1,
  },
  headerLink: {
    fontSize: 14,
    color: "#176B87",
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#18212F",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#344054",
    textAlign: "center",
  },
  messageText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#12805C",
    textAlign: "center",
  },
  trackerCard: {
    flex: 1,
    margin: 24,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    padding: 28,
    alignItems: "center",
  },
  orderDetails: {
    marginTop: 20,
    width: "100%",
    alignItems: "flex-start",
  },
  orderSection: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    color: "#344054",
  },
  orderItem: {
    fontSize: 14,
    color: "#667085",
    marginBottom: 4,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  closeText: {
    fontSize: 22,
    color: "#667085",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#18212F",
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 42,
    fontWeight: "900",
    color: "#18212F",
    marginBottom: 18,
  },
  statusMessage: {
    fontSize: 16,
    fontWeight: "700",
  },
  receivedButton: {
    marginTop: 20,
    backgroundColor: "#176B87",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
  },
  receivedButtonDisabled: {
    opacity: 0.6,
  },
  receivedButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  bottomBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#D8DEE8",
    paddingVertical: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
  },
  tabText: {
    fontSize: 13,
    color: "#667085",
  },
  tabActive: {
    color: "#176B87",
    fontWeight: "700",
  },
});
