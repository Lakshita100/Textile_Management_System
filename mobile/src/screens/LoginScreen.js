import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { COLORS } from '../styles/theme';

export default function LoginScreen() {
  const { loginAsRole } = useContext(AppContext);
  const { width } = useWindowDimensions();
  const [selectedRole, setSelectedRole] = useState('employee'); // 'employee' | 'admin' | 'buyer'
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');

  const handleLogin = () => {
    if (selectedRole === 'employee') {
      loginAsRole('employee', {
        id: 'EMP-101',
        name: name.trim() || 'Ramesh Kumar',
        role: 'Master Weaver',
        dept: 'Weaving Section',
        hourlyRate: 150,
      });
    } else if (selectedRole === 'admin') {
      loginAsRole('admin', {
        id: 'ADMIN-01',
        name: name.trim() || 'Rajesh Mehta',
        role: 'Plant Head & Factory Admin',
        dept: 'Factory Management',
      });
    } else if (selectedRole === 'buyer') {
      loginAsRole('buyer', {
        id: 'BUYER-501',
        name: name.trim() || 'Vikram Singhania',
        company: company.trim() || 'Vogue Garments Ltd',
        email: 'vikram@voguegarments.com',
      });
    }
  };

  const isSmallScreen = width < 380;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brand Header */}
        <View style={styles.brandBox}>
          <View style={styles.brandLogo}>
            <Ionicons name="grid" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.brandTitle}>TEXTILE MANAGEMENT SYSTEM</Text>
          <Text style={styles.brandSubtitle}>Factory & Buyer Portal</Text>
        </View>

        {/* Role Selector Segment */}
        <View style={styles.roleContainer}>
          <Text style={styles.roleLabel}>SELECT LOGIN ROLE</Text>
          <View style={styles.segmentRow}>
            <TouchableOpacity
              style={[styles.segmentBtn, selectedRole === 'employee' && styles.segmentActive]}
              onPress={() => setSelectedRole('employee')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="person"
                size={16}
                color={selectedRole === 'employee' ? '#FFFFFF' : COLORS.muted}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.segmentText, selectedRole === 'employee' && styles.segmentTextActive]}>
                Employee
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, selectedRole === 'admin' && styles.segmentActive]}
              onPress={() => setSelectedRole('admin')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="shield"
                size={16}
                color={selectedRole === 'admin' ? '#FFFFFF' : COLORS.muted}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.segmentText, selectedRole === 'admin' && styles.segmentTextActive]}>
                Plant Head
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, selectedRole === 'buyer' && styles.segmentActive]}
              onPress={() => setSelectedRole('buyer')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="cart"
                size={16}
                color={selectedRole === 'buyer' ? '#FFFFFF' : COLORS.muted}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.segmentText, selectedRole === 'buyer' && styles.segmentTextActive]}>
                Buyer
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Clean Login Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {selectedRole === 'employee' && 'Worker Portal Login'}
            {selectedRole === 'admin' && 'Plant Head Portal Login'}
            {selectedRole === 'buyer' && 'Textile Buyer Access'}
          </Text>

          <Text style={styles.inputLabel}>
            {selectedRole === 'buyer' ? 'Contact Person Name' : 'Full Name'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={
              selectedRole === 'employee'
                ? 'Ramesh Kumar'
                : selectedRole === 'admin'
                ? 'Rajesh Mehta'
                : 'Vikram Singhania'
            }
            placeholderTextColor={COLORS.muted}
            value={name}
            onChangeText={setName}
          />

          {selectedRole === 'buyer' && (
            <>
              <Text style={styles.inputLabel}>Company / Brand Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Vogue Garments Ltd"
                placeholderTextColor={COLORS.muted}
                value={company}
                onChangeText={setCompany}
              />
            </>
          )}

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.85}>
            <Text style={styles.loginBtnText}>
              ENTER PORTAL AS {selectedRole.toUpperCase()} →
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 36,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandLogo: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 2,
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.muted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: '#172B45',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#264268',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentActive: {
    backgroundColor: COLORS.primary,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
    elevation: 3,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.muted,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.canvas,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
    color: COLORS.ink,
    marginBottom: 16,
  },
  loginBtn: {
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
