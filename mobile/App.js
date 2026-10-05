import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from './src/api';

// Import screens
import {
  AdminAnalyticsScreen,
  AdminInventoryScreen,
  AdminMenuScreen,
  AdminOrdersScreen,
  AdminQueueScreen,
} from './src/screens/admin';
import {
  EmployeeInventoryScreen,
  EmployeeOrderScreen,
  EmployeeQueueScreen,
} from './src/screens/employee';
import {
  CustomerDiscountScreen,
  CustomerMenuScreen,
  CustomerTrackingScreen,
} from './src/screens/customer';
import LoginScreen from './src/screens/LoginScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Admin Navigator
function AdminNavigator({ user, onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = 'dashboard';
          if (route.name === 'AdminAnalytics') iconName = 'analytics';
          else if (route.name === 'AdminInventory') iconName = 'inventory';
          else if (route.name === 'AdminMenu') iconName = 'restaurant-menu';
          else if (route.name === 'AdminOrders') iconName = 'receipt';
          else if (route.name === 'AdminQueue') iconName = 'queue';
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#176B87',
        tabBarInactiveTintColor: '#667085',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#D8DEE8',
          height: 62,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTitleStyle: {
          color: '#18212F',
          fontWeight: '800',
        },
        headerShown: true,
      })}
    >
      <Tab.Screen
        name="AdminAnalytics"
        options={{ title: 'Analytics' }}
      >
        {(props) => <AdminAnalyticsScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen
        name="AdminInventory"
        options={{ title: 'Inventory' }}
      >
        {(props) => <AdminInventoryScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen
        name="AdminMenu"
        options={{ title: 'Menu' }}
      >
        {(props) => <AdminMenuScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen
        name="AdminOrders"
        options={{ title: 'Orders' }}
      >
        {(props) => <AdminOrdersScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen
        name="AdminQueue"
        options={{ title: 'Queue' }}
      >
        {(props) => <AdminQueueScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// Employee Navigator
function EmployeeNavigator({ user, onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = 'work';
          if (route.name === 'EmployeeOrders') iconName = 'assignment';
          else if (route.name === 'EmployeeQueue') iconName = 'queue';
          else if (route.name === 'EmployeeInventory') iconName = 'inventory';
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#176B87',
        tabBarInactiveTintColor: '#667085',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#D8DEE8',
          height: 62,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTitleStyle: {
          color: '#18212F',
          fontWeight: '800',
        },
        headerShown: true,
      })}
    >
      <Tab.Screen
        name="EmployeeOrders"
        options={{ title: 'Orders' }}
      >
        {(props) => <EmployeeOrderScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen
        name="EmployeeQueue"
        options={{ title: 'Queue' }}
      >
        {(props) => <EmployeeQueueScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen
        name="EmployeeInventory"
        options={{ title: 'Inventory' }}
      >
        {(props) => <EmployeeInventoryScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// Customer Navigator
function CustomerNavigator({ user, onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = 'shopping-cart';
          if (route.name === 'CustomerMenu') iconName = 'restaurant-menu';
          else if (route.name === 'CustomerDiscount') iconName = 'local-offer';
          else if (route.name === 'CustomerTracking') iconName = 'track-changes';
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#176B87',
        tabBarInactiveTintColor: '#667085',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#D8DEE8',
          height: 62,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTitleStyle: {
          color: '#18212F',
          fontWeight: '800',
        },
        headerShown: true,
      })}
    >
      <Tab.Screen
        name="CustomerMenu"
        options={{ title: 'Menu' }}
      >
        {(props) => <CustomerMenuScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen
        name="CustomerDiscount"
        options={{ title: 'Discounts' }}
      >
        {(props) => <CustomerDiscountScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen
        name="CustomerTracking"
        options={{ title: 'Tracking' }}
      >
        {(props) => <CustomerTrackingScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#176B87" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen
            name="Login"
            options={{ animationEnabled: false }}
          >
            {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
        ) : user.role === 'admin' ? (
          <Stack.Screen
            name="AdminApp"
            options={{ animationEnabled: false }}
          >
            {(props) => <AdminNavigator {...props} user={user} onLogout={handleLogout} />}
          </Stack.Screen>
        ) : user.role === 'employee' ? (
          <Stack.Screen
            name="EmployeeApp"
            options={{ animationEnabled: false }}
          >
            {(props) => <EmployeeNavigator {...props} user={user} onLogout={handleLogout} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen
            name="CustomerApp"
            options={{ animationEnabled: false }}
          >
            {(props) => <CustomerNavigator {...props} user={user} onLogout={handleLogout} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
