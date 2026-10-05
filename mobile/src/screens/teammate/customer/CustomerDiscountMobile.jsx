/**
 * CustomerDiscountMobile.jsx
 * หน้าแสดง Discount Code สำหรับลูกค้า (เวอร์ชัน Mobile)
 * Modal แสดงรหัสส่วนลดแบบ bottom sheet style
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';

// รหัสส่วนลดตัวอย่าง (จริงๆ ดึงจาก API)
const DISCOUNT_CODE = 'DISC - 0000';

export default function CustomerDiscountMobile({ navigation }) {
  // state ควบคุมการแสดง modal
  const [modalVisible, setModalVisible] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discount</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* เนื้อหาหลัก */}
      <View style={styles.content}>
        <Text style={styles.pageTitle}>Redeem Discount!</Text>
        <Text style={styles.pageSubtitle}>
          กดปุ่มด้านล่างเพื่อดูรหัสส่วนลดของคุณ
        </Text>

        {/* ปุ่มเปิด modal */}
        <TouchableOpacity
          style={styles.redeemButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.redeemButtonText}>Show My Discount Code</Text>
        </TouchableOpacity>
      </View>

      {/* Modal แสดง Discount Code */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {/* พื้นที่ด้านบน กดแล้วปิด modal */}
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setModalVisible(false)}
          />

          {/* กล่อง Modal แบบ Bottom Sheet */}
          <View style={styles.modalSheet}>
            {/* แถบด้านบน (drag indicator) */}
            <View style={styles.dragIndicator} />

            {/* ปุ่มปิด X */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setModalVisible(false);
                navigation?.goBack();
              }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {/* ข้อความหัว */}
            <Text style={styles.modalSubtitle}>Your Discount Code is</Text>

            {/* กล่องแสดงรหัสส่วนลด */}
            <View style={styles.codeBox}>
              <Text style={styles.discountCode}>{DISCOUNT_CODE}</Text>
            </View>

            {/* คำอธิบาย */}
            <Text style={styles.modalNote}>
              แสดงรหัสนี้ให้พนักงานเพื่อรับส่วนลด
            </Text>

            {/* ปุ่มปิด */}
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => {
                setModalVisible(false);
                navigation?.goBack();
              }}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  backButton: {
    fontSize: 14,
    color: '#555',
    width: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#18212F',
  },

  // เนื้อหาหลัก
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#18212F',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#667085',
    marginBottom: 32,
    textAlign: 'center',
  },
  redeemButton: {
    backgroundColor: '#18212F',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  },
  redeemButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  // Bottom Sheet Modal
  modalSheet: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    alignItems: 'center',
  },

  // แถบด้านบน Bottom Sheet
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    marginBottom: 16,
  },

  // ปุ่มปิด
  closeButton: {
    alignSelf: 'flex-end',
    padding: 4,
    marginBottom: 8,
  },
  closeButtonText: {
    color: '#aaa',
    fontSize: 18,
  },

  // ข้อความใน Modal
  modalSubtitle: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 20,
  },

  // กล่องรหัสส่วนลด
  codeBox: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    paddingHorizontal: 32,
    paddingVertical: 16,
    marginBottom: 16,
  },
  discountCode: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
    letterSpacing: 3,
  },

  // หมายเหตุ
  modalNote: {
    color: '#667085',
    fontSize: 13,
    marginBottom: 24,
    textAlign: 'center',
  },

  // ปุ่ม Done
  doneButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 48,
    paddingVertical: 12,
    borderRadius: 10,
  },
  doneButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '700',
  },
});
