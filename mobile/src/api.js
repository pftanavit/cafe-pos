import { Platform } from 'react-native';
import Constants from 'expo-constants';

const localHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0] || Constants.manifest?.debuggerHost?.split(':')[0] || '';
const isLocalDebugHost = (host) => /^(127\.0\.0\.1|localhost)$/i.test(host);
const API_HOST = Platform.OS === 'android'
  ? (debuggerHost && !isLocalDebugHost(debuggerHost) ? debuggerHost : localHost)
  : debuggerHost || localHost;
const API_BASE = `http://${API_HOST}:5000`;

async function request(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      throw new Error(data?.error || `Request failed: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  patch: (path, body = {}) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: "DELETE" }),
};

export async function fetchMenuItems() {
  try {
    return await api.get("/menu-items");
  } catch (error) {
    console.warn("Failed to fetch menu items:", error);
    return [];
  }
}

export async function fetchDiscountCode() {
  try {
    const result = await api.get("/discount-codes");
    if (result && result.code) {
      return result.code;
    }
  } catch (error) {
    console.warn("Failed to fetch discount code:", error);
  }
  return "DISC - 0000";
}

export async function fetchCustomerOrders(customerId, status) {
  try {
    const params = new URLSearchParams();
    if (customerId) params.append("customerId", customerId);
    if (status) params.append("status", status);
    const query = params.toString() ? `?${params.toString()}` : "";
    return await api.get(`/orders${query}`);
  } catch (error) {
    console.warn("Failed to fetch customer orders:", error);
    return [];
  }
}

export async function fetchCustomerOrder(customerId) {
  const orders = await fetchCustomerOrders(customerId);
  return Array.isArray(orders) && orders.length > 0 ? orders[0] : null;
}

export async function fetchOrderStatus(orderId) {
  try {
    return await api.get(`/orders/${orderId}`);
  } catch (error) {
    console.warn("Failed to fetch order status:", error);
    return { status: "queue" };
  }
}

export async function receiveOrder(orderId) {
  return await api.patch(`/orders/${orderId}/received`);
}
