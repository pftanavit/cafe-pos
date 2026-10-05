/**
 * CustomerTrackingMobile.jsx
 * หน้าติดตามสถานะออเดอร์ สำหรับลูกค้า (เวอร์ชัน Mobile)
 *
 * มี 5 สถานะ:
 * - 'empty'    → ไม่มีออเดอร์
 * - 'queue'    → รอคิว (แสดงจำนวนคิวที่รอ)
 * - 'ongoing'  → กำลังทำ
 * - 'complete' → เสร็จแล้ว (พร้อมรับ)
 * - 'canceled' → ถูกยกเลิก
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
  ScrollView,
} from 'react-native';

// สีตามสถานะ
const STATUS_COLORS = {
  queue: '#F59E0B',    // เหลือง - รอคิว
  ongoing: '#10B981',  // เขียว - กำลังทำ
  complete: '#10B981', // เขียว - เสร็จแล้ว
  canceled: '#EF4444', // แดง - ยกเลิก
  empty: '#667085',
};

// ข้อความตามสถานะ
const STATUS_LABELS = {
  queue: '3 Queues ahead',
  ongoing: 'Currently Making',
  complete: 'Your Order is Ready !',
  canceled: 'Your Order has been Canceled',
  empty: '',
};

// icon ตามสถานะ
const STATUS_ICONS = {
  queue: '⏳',
  ongoing: '☕',
  complete: '✅',
  canceled: '❌',
  empty: '',
};

export default function CustomerTrackingMobile({ navigation }) {
  // สถานะออเดอร์ปัจจุบัน (จริงๆ ดึงจาก API polling หรือ WebSocket)
  const [orderStatus, setOrderStatus] = useState('queue');

  // หมายเลขออเดอร์
  const orderNumber = '001';

  // modal แสดงเฉพาะ complete หรือ canceled
  const showModal = orderStatus === 'complete' || orderStatus === 'canceled';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.navigate('CustomerMenu')}>
          <Text style={styles.backButton}>← Menu</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Order</Text>
        <TouchableOpacity onPress={() => navigation?.navigate('Login')}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ปุ่มทดสอบสถานะ (ลบออกเมื่อ production) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.debugScroll}
        >
          {['empty', 'queue', 'ongoing', 'complete', 'canceled'].map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.debugBtn,
                orderStatus === s && styles.debugBtnActive,
              ]}
              onPress={() => setOrderStatus(s)}
            >
              <Text style={styles.debugBtnText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* กรณีไม่มีออเดอร์ */}
        {orderStatus === 'empty' ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyText}>
              You Don't have any Ongoing Order
            </Text>
            <TouchableOpacity
              style={styles.goMenuButton}
              onPress={() => navigation?.navigate('CustomerMenu')}
            >
              <Text style={styles.goMenuButtonText}>Go to Menu</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* การ์ดสถานะ queue และ ongoing */
          !showModal && (
            <View style={styles.card}>
              {/* icon สถานะ */}
              <Text style={styles.statusIcon}>{STATUS_ICONS[orderStatus]}</Text>

              <Text style={styles.cardLabel}>Your Order:</Text>
              <Text style={styles.orderNumber}>#{orderNumber}</Text>

              {/* ข้อความสถานะ */}
              <Text
                style={[
                  styles.statusText,
                  { color: STATUS_COLORS[orderStatus] },
                ]}
              >
                {STATUS_LABELS[orderStatus]}
              </Text>

              {/* progress bar สำหรับ queue */}
              {orderStatus === 'queue' && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[styles.progressFill, { width: '25%' }]}
                    />
                  </View>
                  <Text style={styles.progressLabel}>Waiting in queue...</Text>
                </View>
              )}

              {/* animation dot สำหรับ ongoing */}
              {orderStatus === 'ongoing' && (
                <View style={styles.makingContainer}>
                  <Text style={styles.makingDots}>● ● ●</Text>
                </View>
              )}
            </View>
          )
        )}
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation?.navigate('CustomerMenu')}
        >
          <Text style={styles.tabText}>Menu</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={[styles.tabText, styles.tabActive]}>My Order</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation?.navigate('Login')}
        >
          <Text style={styles.tabText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Modal สำหรับ complete และ canceled */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setOrderStatus('empty')}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setOrderStatus('empty')}
          />
          <View style={styles.modalSheet}>
            {/* drag indicator */}
            <View style={styles.dragIndicator} />

            {/* ปุ่มปิด */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setOrderStatus('empty')}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {/* icon สถานะ */}
            <Text style={styles.modalIcon}>{STATUS_ICONS[orderStatus]}</Text>

            <Text style={styles.cardLabel}>Your Order:</Text>
            <Text style={styles.modalOrderNumber}>#{orderNumber}</Text>

            {/* ข้อความสถานะ */}
            <Text
              style={[
                styles.modalStatusText,
                { color: STATUS_COLORS[orderStatus] },
              ]}
            >
              {STATUS_LABELS[orderStatus]}
            </Text>

            {/* ปุ่ม action ตามสถานะ */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                orderStatus === 'canceled' && styles.actionButtonRed,
              ]}
              onPress={() => {
                setOrderStatus('empty');
                navigation?.navigate('CustomerMenu');
              }}
            >
              <Text style={styles.actionButtonText}>
                {orderStatus === 'complete' ? 'Done' : 'Back to Menu'}
              </Text>
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
    width: 70,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#18212F',
  },
  logoutText: {
    fontSize: 14,
    color: '#667085',
    width: 70,
    textAlign: 'right',
  },

  // เนื้อหา
  content: {
    flexGrow: 1,
    padding: 16,
    alignItems: 'center',
  },

  // Debug scroll (ลบออกได้เมื่อ production)
  debugScroll: {
    marginBottom: 20,
    alignSelf: 'stretch',
  },
  debugBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#D8DEE8',
    borderRadius: 6,
    marginRight: 8,
  },
  debugBtnActive: {
    backgroundColor: '#18212F',
  },
  debugBtnText: {
    fontSize: 12,
    color: '#fff',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  goMenuButton: {
    backgroundColor: '#18212F',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  goMenuButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  // การ์ดสถานะ
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D8DEE8',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statusIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },

  // Progress bar สำหรับ queue
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: 6,
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    color: '#aaa',
  },

  // Ongoing dots
  makingContainer: {
    marginTop: 8,
  },
  makingDots: {
    fontSize: 20,
    color: '#10B981',
    letterSpacing: 4,
  },

  // Bottom Tab
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

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    alignItems: 'center',
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#D8DEE8',
    borderRadius: 2,
    marginBottom: 16,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 4,
    marginBottom: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#667085',
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  modalOrderNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 12,
  },
  modalStatusText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 28,
  },
  actionButton: {
    backgroundColor: '#18212F',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  actionButtonRed: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
