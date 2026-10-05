import React, { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View, SafeAreaView, StatusBar, TouchableOpacity, StyleSheet } from "react-native";
import { wire } from "../WireframeStyles";
import { fetchMenuItems } from "../../api";

const fallbackMenu = [
  { menuItemId: "1", name: "Latte", basePrice: 80 },
  { menuItemId: "2", name: "Thai Tea", basePrice: 75 },
  { menuItemId: "3", name: "Matcha", basePrice: 85 },
  { menuItemId: "4", name: "Americano", basePrice: 70 },
];

export default function EmployeeOrderScreen({ navigation, route, onLogout }) {
  const { user } = route?.params || {};
  const [creating, setCreating] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState("");

  useEffect(() => {
    let mounted = true;

    fetchMenuItems()
      .then((items) => {
        if (mounted && Array.isArray(items) && items.length > 0) {
          setMenuItems(items);
          setSelectedMenuItemId((current) => current || items[0].menuItemId);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) {
          setSelectedMenuItemId((current) => current || fallbackMenu[0].menuItemId);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const displayMenu = menuItems.length > 0 ? menuItems : fallbackMenu;
  const selectedMenuItem = displayMenu.find((item) => item.menuItemId === selectedMenuItemId) || displayMenu[0];

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
      <Text style={wire.title}>Employee Home(Order)</Text>
      <View style={wire.canvas}>
        <View style={wire.nav}>
          <Text style={wire.navText}>Order</Text>
          <Text style={wire.navText}>Queue</Text>
          <Text style={wire.navText}>Inventory</Text>
          <View style={wire.navSpacer} />
          <Text style={wire.navText}>Log Out</Text>
        </View>
        <View style={wire.content}>
          {!creating ? (
            <>
              <Text style={wire.sectionTitle}>incomplete order</Text>
              <View style={wire.card}>
                <View style={wire.cardHead}>
                  <Text style={[wire.tinyBold, { flex: 1 }]}>Order 1</Text>
                  <Text style={[wire.tinyBold, { flex: 1 }]}>Takeaway</Text>
                </View>
                <View style={[wire.cardBody, { flexDirection: "row", alignItems: "center" }]}>
                  <Text style={[wire.tiny, { flex: 1 }]}>1 Latte, 2 Thai tea</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                    <Pressable style={wire.editPill}>
                      <Text style={wire.editText}>Edit</Text>
                    </Pressable>
                    <Pressable style={wire.deleteBox}>
                      <Text style={wire.deleteText}>X</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
              <Pressable style={[wire.button, { alignSelf: "flex-end", marginTop: 120 }]} onPress={() => setCreating(true)}>
                <Text style={wire.buttonText}>Create</Text>
              </Pressable>
            </>
          ) : (
            <View style={wire.formPanel}>
              <View style={{ backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#D8DEE8", borderRadius: 8, padding: 12, marginBottom: 14 }}>
                <Text style={wire.sectionTitle}>Menu Item 1</Text>
                {selectedMenuItem && (
                  <View style={styles.orderItemPreview}>
                    {selectedMenuItem.imageUrl ? (
                      <Image source={{ uri: selectedMenuItem.imageUrl }} style={styles.orderItemImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.orderItemFallback}>
                        <Text style={styles.orderItemFallbackText}>{selectedMenuItem.name?.slice(0, 1) || "?"}</Text>
                      </View>
                    )}
                    <View style={styles.orderItemInfo}>
                      <Text style={styles.orderItemName}>{selectedMenuItem.name}</Text>
                      <Text style={styles.orderItemPrice}>{selectedMenuItem.basePrice}B</Text>
                    </View>
                  </View>
                )}
                <Text style={wire.label}>Menu item</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.menuPicker}>
                  {displayMenu.map((item) => (
                    <Pressable
                      key={item.menuItemId}
                      style={[styles.menuChoice, item.menuItemId === selectedMenuItemId && styles.menuChoiceActive]}
                      onPress={() => setSelectedMenuItemId(item.menuItemId)}
                    >
                      <Text style={styles.menuChoiceText}>{item.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Text style={wire.label}>Customizations</Text>
                <TextInput style={wire.input} />
              </View>
              <Pressable style={[wire.button, { marginBottom: 12 }]}>
                <Text style={wire.buttonText}>+   Add more item</Text>
              </Pressable>
              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12 }}>
                <Pressable onPress={() => setCreating(false)}>
                  <Text style={wire.linkButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={wire.button}>
                  <Text style={wire.buttonText}>Create</Text>
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
  orderItemPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderColor: "#D8DEE8",
    borderWidth: 1,
    padding: 8,
    marginBottom: 12,
  },
  orderItemImage: {
    width: 72,
    height: 72,
    borderRadius: 6,
    backgroundColor: "#E8F3F6",
  },
  orderItemFallback: {
    width: 72,
    height: 72,
    borderRadius: 6,
    backgroundColor: "#E8F3F6",
    alignItems: "center",
    justifyContent: "center",
  },
  orderItemFallbackText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#666",
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  orderItemPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
    marginTop: 4,
  },
  menuPicker: {
    marginBottom: 14,
  },
  menuChoice: {
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: "#F1F5F9",
  },
  menuChoiceActive: {
    backgroundColor: "#E8F3F6",
    borderColor: "#111",
    borderWidth: 1,
  },
  menuChoiceText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111",
  },
});
