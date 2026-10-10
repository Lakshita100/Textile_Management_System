import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { COLORS } from '../styles/theme';

export default function EmployeeProfile() {
  const { currentUser, activeShift, logout } = useContext(AppContext);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Worker Profile</Text>
        <Text style={styles.headerSub}>Personal & Shift Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{currentUser?.name ? currentUser.name[0] : 'E'}</Text>
          </View>

          <Text style={styles.userName}>{currentUser?.name || 'Ramesh Kumar'}</Text>
          <Text style={styles.userRole}>{currentUser?.role || 'Master Weaver'}</Text>
          <View style={styles.idBadge}>
            <Text style={styles.idBadgeText}>ID: {currentUser?.id || 'EMP-101'}</Text>
          </View>
        </View>

        {/* Shift & Gate Info */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>ASSIGNED SHIFT & STATION</Text>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={COLORS.primary} style={styles.infoIcon} />
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoLabel}>Assigned Shift Hours</Text>
              <Text style={styles.infoVal}>09:00 AM - 06:00 PM (Standard Shift)</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={COLORS.primary} style={styles.infoIcon} />
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoLabel}>Assigned Gate Station</Text>
              <Text style={styles.infoVal}>Weaving Unit 1 - Main Entrance</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={18} color={COLORS.primary} style={styles.infoIcon} />
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoVal}>{currentUser?.dept || 'Weaving Section'}</Text>
            </View>
          </View>
        </View>

        {/* Current Duty Status */}
        <View style={styles.statusCard}>
          <Text style={styles.cardTitle}>CURRENT DUTY STATUS</Text>
          <View style={styles.statusRow}>
            <Ionicons
              name={activeShift ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={activeShift ? COLORS.success : COLORS.muted}
            />
            <Text style={[styles.statusText, activeShift ? styles.textSuccess : styles.textMuted]}>
              {activeShift
                ? `ON DUTY - Checked In at ${activeShift.inTime}`
                : 'OFF DUTY - Checked Out'}
            </Text>
          </View>
        </View>

        {/* Exit Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Feather name="log-out" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>LOGOUT FROM EMPLOYEE PORTAL</Text>
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
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 24,
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
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 10,
  },
  textSuccess: {
    color: COLORS.success,
  },
  textMuted: {
    color: COLORS.muted,
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
