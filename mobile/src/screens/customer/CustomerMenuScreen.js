import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { fetchMenuItems } from "../../api";

const placeholderItems = [
  { menuItemId: "1", name: "Latte", basePrice: 80, isAvailable: true },
  { menuItemId: "2", name: "Thai Tea", basePrice: 75, isAvailable: true },
  { menuItemId: "3", name: "Matcha", basePrice: 85, isAvailable: false },
  { menuItemId: "4", name: "Americano", basePrice: 70, isAvailable: true },
];

export default function CustomerMenuScreen({ navigation, route, onLogout, user }) {
  const { user: routeUser } = route?.params || {};
  const currentUser = user || routeUser;
  const customerId = currentUser?.uid || currentUser?.id;
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetchMenuItems()
      .then((items) => {
        if (mounted && items && items.length > 0) {
          setMenuItems(items);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const renderMenuItem = ({ item }) => (
    <View style={styles.card}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.photoImage} resizeMode="cover" />
      ) : (
        <View style={styles.photo}>
          <Text style={styles.photoLabel}>Photo</Text>
        </View>
      )}
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemPrice}>
        {item.isAvailable ? `${item.basePrice}B` : "sold out"}
      </Text>
    </View>
  );

  const displayItems = menuItems.length > 0 ? menuItems : placeholderItems;

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
        <Text style={styles.headerText}>Customer Menu</Text>
        <TouchableOpacity onPress={() => navigation?.navigate("CustomerTracking", { status: "queue", user: currentUser })}>
          <Text style={styles.headerAction}>My Order</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={styles.topSection}>
          <Text style={styles.sectionTitle}>Redeem Discount!</Text>
          <TouchableOpacity style={styles.redeemButton} onPress={() => navigation?.navigate("CustomerDiscount")}> 
            <Text style={styles.redeemButtonText}>Redeem</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#444" style={styles.loading} />
        ) : (
          <FlatList
            data={displayItems}
            renderItem={renderMenuItem}
            keyExtractor={(item) => item.menuItemId || item.id || item.name}
            numColumns={2}
            contentContainerStyle={styles.menuGrid}
            columnWrapperStyle={styles.columnWrapper}
            ListHeaderComponent={<Text style={styles.menuHeading}>Menu</Text>}
            ListEmptyComponent={<Text style={styles.emptyText}>No menu items available.</Text>}
          />
        )}
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={[styles.tabText, styles.tabActive]}>Menu</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation?.navigate("CustomerTracking", { status: "queue" })}>
          <Text style={styles.tabText}>My Order</Text>
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
  headerText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#18212F",
  },
  headerAction: {
    fontSize: 14,
    color: "#176B87",
    fontWeight: "700",
  },
  body: {
    flex: 1,
    padding: 16,
  },
  topSection: {
    marginBottom: 18,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 18,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
    color: "#18212F",
  },
  redeemButton: {
    backgroundColor: "#176B87",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
  },
  redeemButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  menuHeading: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
    marginLeft: 4,
    color: "#18212F",
  },
  menuGrid: {
    paddingVertical: 4,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  card: {
    flex: 1,
    marginBottom: 12,
    marginHorizontal: 4,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    overflow: "hidden",
    minHeight: 160,
  },
  photo: {
    height: 92,
    backgroundColor: "#E8F3F6",
    alignItems: "center",
    justifyContent: "center",
  },
  photoImage: {
    width: "100%",
    height: 92,
    backgroundColor: "#E8F3F6",
  },
  photoLabel: {
    color: "#0F4F64",
    fontSize: 12,
    fontWeight: "700",
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#18212F",
    marginTop: 10,
    marginHorizontal: 10,
  },
  itemPrice: {
    fontSize: 13,
    color: "#667085",
    fontWeight: "700",
    marginTop: 6,
    marginHorizontal: 10,
    marginBottom: 12,
  },
  emptyText: {
    color: "#555",
    fontSize: 14,
    textAlign: "center",
    marginTop: 32,
  },
  loading: {
    marginTop: 16,
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
