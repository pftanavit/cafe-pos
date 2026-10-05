/**
 * CustomerMenuMobile.jsx
 * หน้าเมนูสำหรับลูกค้า (เวอร์ชัน Mobile)
 * ปรับ layout ให้เหมาะกับหน้าจอมือถือ (2 คอลัมน์)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
} from 'react-native';

// ข้อมูลเมนูตัวอย่าง
const MENU_ITEMS = [
  { id: '1', name: 'Espresso', price: 60, image: null },
  { id: '2', name: 'Latte', price: 80, image: null },
  { id: '3', name: 'Cappuccino', price: 85, image: null },
  { id: '4', name: 'Americano', price: 70, image: null },
  { id: '5', name: 'Mocha', price: 90, image: null },
  { id: '6', name: 'Green Tea', price: 75, image: null },
  { id: '7', name: 'Matcha Latte', price: 95, image: null },
  { id: '8', name: 'Croissant', price: 55, image: null },
  { id: '9', name: 'Muffin', price: 50, image: null },
  { id: '10', name: 'Cheesecake', price: 120, image: null },
];

// มือถือใช้ 2 คอลัมน์
const NUM_COLUMNS = 2;

export default function CustomerMenuMobile({ navigation }) {
  const [cart, setCart] = useState([]);

  // เพิ่มสินค้าลงตะกร้า
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  // คำนวณจำนวนสินค้าในตะกร้า
  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);

  // Render การ์ดสินค้า
  const renderMenuItem = ({ item }) => (
    <TouchableOpacity style={styles.menuCard} onPress={() => addToCart(item)}>
      {/* รูปภาพสินค้า (placeholder) */}
      <View style={styles.imagePlaceholder}>
        <Text style={styles.imagePlaceholderText}>Photo</Text>
      </View>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemPrice}>{item.price}฿</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header มือถือ */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu</Text>
        <TouchableOpacity onPress={() => navigation?.navigate('CustomerTracking')}>
          <Text style={styles.orderLink}>My Order</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ส่วน Redeem Discount */}
        <View style={styles.redeemSection}>
          <Text style={styles.redeemTitle}>Redeem Discount!</Text>
          <TouchableOpacity
            style={styles.redeemButton}
            onPress={() => navigation?.navigate('CustomerDiscount')}
          >
            <Text style={styles.redeemButtonText}>Redeem</Text>
          </TouchableOpacity>
        </View>

        {/* กริดเมนู 2 คอลัมน์ */}
        <FlatList
          data={MENU_ITEMS}
          renderItem={renderMenuItem}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLUMNS}
          scrollEnabled={false}
          contentContainerStyle={styles.menuGrid}
        />
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={[styles.tabText, styles.tabActive]}>Menu</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation?.navigate('CustomerTracking')}
        >
          <Text style={styles.tabText}>My Order</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation?.navigate('Login')}
        >
          <Text style={styles.tabText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* ปุ่มลอยดูตะกร้า (แสดงเมื่อมีสินค้า) */}
      {totalItems > 0 && (
        <TouchableOpacity
          style={styles.cartFab}
          onPress={() => navigation?.navigate('CustomerTracking')}
        >
          <Text style={styles.cartFabText}>🛒 {totalItems}</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#D8DEE8',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#18212F',
  },
  orderLink: {
    fontSize: 14,
    color: '#555',
  },

  // เนื้อหา
  content: {
    padding: 16,
    paddingBottom: 80,
  },

  // Redeem section
  redeemSection: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D8DEE8',
  },
  redeemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#18212F',
  },
  redeemButton: {
    backgroundColor: '#555',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 6,
  },
  redeemButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // กริดเมนู
  menuGrid: {
    gap: 10,
  },

  // การ์ดสินค้า (มือถือใหญ่กว่า)
  menuCard: {
    flex: 1,
    margin: 5,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D8DEE8',
  },
  imagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#d0d0d0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  imagePlaceholderText: {
    fontSize: 13,
    color: '#667085',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18212F',
    textAlign: 'center',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#555',
  },

  // Bottom Tab Bar
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#D8DEE8',
    paddingVertical: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    color: '#667085',
  },
  tabActive: {
    color: '#18212F',
    fontWeight: '700',
  },

  // ปุ่มลอย FAB
  cartFab: {
    position: 'absolute',
    bottom: 70,
    right: 16,
    backgroundColor: '#18212F',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  cartFabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
