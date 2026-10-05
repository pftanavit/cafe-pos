import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { api } from '../api';

const roles = ['customer'];

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('signin');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const cleanName = username.trim();

    if (!cleanName) {
      Alert.alert('Error', 'Username is required.');
      return;
    }

    setLoading(true);

    try {
      const users = await api.get('/users');
      const existing = users.find(
        (user) => user.username?.toLowerCase() === cleanName.toLowerCase()
      );

      if (mode === 'signin') {
        if (!existing) {
          Alert.alert('Error', 'No user found with that username.');
          setLoading(false);
          return;
        }
        onLogin(existing);
      } else {
        if (existing) {
          Alert.alert('Error', 'Username already exists. Choose another one.');
          setLoading(false);
          return;
        }

        const user = await api.post('/users', {
          username: cleanName,
          role,
        });
        onLogin(user);
      }
    } catch (err) {
      console.error('Login error:', err);
      Alert.alert('Error', err.message || 'Something went wrong. Make sure the backend is running on http://localhost:5000');
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.innerContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>Cafe POS</Text>

          <View style={styles.segmented}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              mode === 'signin' ? styles.segmentButtonActive : styles.segmentButtonInactive,
            ]}
            onPress={() => setMode('signin')}
            disabled={loading}
          >
            <Text
              style={[
                styles.segmentText,
                mode === 'signin' ? styles.segmentTextActive : styles.segmentTextInactive,
              ]}
            >
              Sign in
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              mode === 'signup' ? styles.segmentButtonActive : styles.segmentButtonInactive,
            ]}
            onPress={() => setMode('signup')}
            disabled={loading}
          >
            <Text
              style={[
                styles.segmentText,
                mode === 'signup' ? styles.segmentTextActive : styles.segmentTextInactive,
              ]}
            >
              Sign up
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. admin"
            value={username}
            onChangeText={setUsername}
            editable={!loading}
            autoCapitalize="none"
          />
        </View>

        {mode === 'signup' ? (
          <View style={styles.formGroup}>
            <Text style={styles.label}>User type</Text>
            <View style={styles.roleRow}>
              {roles.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.roleButton,
                    role === item && styles.roleButtonActive,
                  ]}
                  onPress={() => setRole(item)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      role === item && styles.roleButtonTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {mode === 'signin' ? 'Sign in' : 'Sign up'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    minHeight: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 28,
    color: '#0F4F64',
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D8DEE8',
    overflow: 'hidden',
    marginBottom: 26,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#176B87',
  },
  segmentButtonInactive: {
    backgroundColor: '#F1F5F9',
  },
  segmentText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#fff',
  },
  segmentTextInactive: {
    color: '#667085',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    color: '#344054',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D8DEE8',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  roleButton: {
    flexBasis: '30%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#D8DEE8',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: '#176B87',
    backgroundColor: '#E8F3F6',
  },
  roleButtonText: {
    fontSize: 14,
    color: '#344054',
    textTransform: 'capitalize',
  },
  roleButtonTextActive: {
    color: '#0F4F64',
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#176B87',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 24,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D8DEE8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
});
