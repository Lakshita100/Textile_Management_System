import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { COLORS } from '../styles/theme';

export default function AdminProfile() {
  const { currentUser, employees, logout } = useContext(AppContext);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Employee Head Profile</Text>
        <Text style={styles.headerSub}>Admin Controls & Gate Station Specs</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="shield-checkmark" size={30} color="#FFFFFF" />
          </View>

          <Text style={styles.userName}>{currentUser?.name || 'Employee Head'}</Text>
          <Text style={styles.userRole}>{currentUser?.role || 'Employee Head & Factory Admin'}</Text>
          <View style={styles.idBadge}>
            <Text style={styles.idBadgeText}>ID: {currentUser?.id || 'ADMIN-01'}</Text>
          </View>
        </View>

        {/* Station Specs */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>GATE STATION SPECIFICATIONS</Text>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={COLORS.primary} style={styles.infoIcon} />
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoLabel}>Gate Kiosk Location</Text>
              <Text style={styles.infoVal}>Weaving Unit 1 - Main Entrance Gate</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="qr-code-outline" size={18} color={COLORS.primary} style={styles.infoIcon} />
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoLabel}>Station QR Payload ID</Text>
              <Text style={styles.infoVal}>TEX-GATE-01 (Static Master QR)</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={18} color={COLORS.primary} style={styles.infoIcon} />
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoLabel}>Total Registered Staff</Text>
              <Text style={styles.infoVal}>{employees.length} Active Factory Employees</Text>
            </View>
          </View>
        </View>

        {/* Station Status */}
        <View style={styles.statusCard}>
          <Text style={styles.cardTitle}>GATE STATION STATUS</Text>
          <View style={styles.statusRow}>
            <View style={styles.liveDot} />
            <Text style={styles.statusText}>
              Station Active & Broadcasting QR Code
            </Text>
          </View>
        </View>

        {/* Exit Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Feather name="log-out" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>LOGOUT FROM PLANT HEAD PORTAL</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  header: {
    backgroundColor: COLORS.primaryDark,
    paddingTop: 42,
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ink,
  },
  userRole: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  idBadge: {
    backgroundColor: COLORS.canvas,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  idBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.muted,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoTextGroup: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.muted,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginVertical: 10,
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.success,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
