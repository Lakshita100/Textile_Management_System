import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons, Feather } from '@expo/vector-icons';
import { AppContext, STATION_QR_DATA } from '../context/AppContext';
import { COLORS } from '../styles/theme';

export default function AdminHome() {
  const { currentUser, employees, logout } = useContext(AppContext);
  const { width } = useWindowDimensions();

  const onDutyEmployees = employees.filter((emp) => emp.status === 'ON DUTY');
  const offDutyEmployees = employees.filter((emp) => emp.status === 'OFF DUTY');

  // Responsive QR size calculation
  const qrSize = Math.min(width * 0.48, 190);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="grid" size={18} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.brandTitle}>TEXTILE MANAGEMENT SYSTEM</Text>
            <Text style={styles.brandSub}>Employee Head Portal • Main Gate</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.exitBtn} onPress={logout}>
          <Feather name="log-out" size={16} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Employee Head Card */}
        <View style={styles.adminCard}>
          <View style={styles.avatar}>
            <Ionicons name="shield-checkmark" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.adminDetails}>
            <Text style={styles.adminName}>{currentUser?.name || 'Employee Head'}</Text>
            <Text style={styles.adminRole}>Employee Head • ID: {currentUser?.id || 'ADMIN-01'}</Text>
          </View>
        </View>

        {/* STATION QR CODE CARD */}
        <View style={styles.qrStationCard}>
          <View style={styles.qrHeaderRow}>
            <View style={styles.qrTitleBox}>
              <Ionicons name="qr-code" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.qrStationTitle}>GATE STATION QR CODE</Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>STATION ACTIVE</Text>
            </View>
          </View>

          <Text style={styles.qrSubtitle}>
            Employees scan this QR code with their mobile cameras to Punch In/Out
          </Text>

          <View style={styles.qrContainer}>
            <QRCode
              value={STATION_QR_DATA}
              size={qrSize}
              color="#073B63"
              backgroundColor="#FFFFFF"
            />
          </View>

          <View style={styles.stationInfoBox}>
            <Ionicons name="location-sharp" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.stationVal}>Weaving Unit 1 - Gate Kiosk</Text>
          </View>
        </View>

        {/* ON DUTY EMPLOYEES */}
        <View style={styles.onDutySection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleBox}>
              <Ionicons name="people" size={18} color={COLORS.success} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Currently On Duty</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{onDutyEmployees.length} Checked In</Text>
            </View>
          </View>

          {onDutyEmployees.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No employees checked in right now.</Text>
            </View>
          ) : (
            onDutyEmployees.map((emp) => (
              <View key={emp.id} style={styles.empCard}>
                <View style={styles.empAvatar}>
                  <Text style={styles.empAvatarText}>{emp.name[0]}</Text>
                </View>

                <View style={styles.empMainInfo}>
                  <View style={styles.empNameRow}>
                    <Text style={styles.empName}>{emp.name}</Text>
                    <View style={styles.pillIn}>
                      <View style={styles.pillDot} />
                      <Text style={styles.pillTextIn}>ON DUTY</Text>
                    </View>
                  </View>
                  <Text style={styles.empRole}>{emp.role} • {emp.dept}</Text>
                  <Text style={styles.empTimeInfo}>Checked In: {emp.lastCheckIn}</Text>
                </View>
              </View>
            ))
          )}
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  brandSub: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  exitBtn: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
    maxWidth: 550,
    alignSelf: 'center',
    width: '100%',
  },
  adminCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adminDetails: {
    flex: 1,
  },
  adminName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
  },
  adminRole: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 1,
  },
  qrStationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  qrHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 6,
  },
  qrTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrStationTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primaryDark,
    letterSpacing: 0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.success,
    marginRight: 4,
  },
  liveBadgeText: {
    color: COLORS.success,
    fontSize: 9,
    fontWeight: '800',
  },
  qrSubtitle: {
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 14,
  },
  qrContainer: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  stationInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: COLORS.canvas,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  stationVal: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink,
  },
  onDutySection: {
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  countBadge: {
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.success,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 12,
  },
  empCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  empAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  empAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  empMainInfo: {
    flex: 1,
  },
  empNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  empName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
    marginRight: 6,
  },
  pillIn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pillDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.success,
    marginRight: 3,
  },
  pillTextIn: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.success,
  },
  empRole: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 1,
  },
  empTimeInfo: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 1,
  },
});
