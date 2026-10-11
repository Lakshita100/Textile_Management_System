import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { COLORS } from '../styles/theme';
import CameraQRScannerModal from './CameraQRScannerModal';

export default function EmployeeHome({ onNavigateToAttendance }) {
  const {
    currentUser,
    activeShift,
    employeeAttendanceLogs,
    logout,
    syncBackendAttendance,
  } = useContext(AppContext);

  const { width } = useWindowDimensions();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scannerVisible, setScannerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await syncBackendAttendance();
    setRefreshing(false);
  }, [syncBackendAttendance]);

  // Sync with backend on mount
  useEffect(() => {
    syncBackendAttendance();
  }, [syncBackendAttendance]);

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const dateString = currentTime.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const totalHoursWorked = employeeAttendanceLogs.reduce((acc, curr) => acc + (curr.hoursWorked || 0), 0).toFixed(1);
  const totalShiftsCount = employeeAttendanceLogs.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Web Aligned Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="grid" size={18} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.brandTitle}>TEXTILE MANAGEMENT SYSTEM</Text>
            <Text style={styles.brandSub}>Worker Punch Station</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={[styles.exitBtn, { marginRight: 8, borderColor: COLORS.line }]} onPress={onRefresh}>
            <Feather name="refresh-cw" size={15} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.exitBtn} onPress={logout}>
            <Feather name="log-out" size={16} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Worker Info */}
        <View style={styles.workerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{currentUser?.name ? currentUser.name[0] : 'E'}</Text>
          </View>
          <View style={styles.workerDetails}>
            <Text style={styles.workerName}>{currentUser?.name || 'Ramesh Kumar'}</Text>
            <Text style={styles.workerRole}>{currentUser?.role} • ID: {currentUser?.id}</Text>
          </View>
        </View>

        {/* PUNCH STATION SECTION */}
        <View style={styles.punchSection}>
          <Text style={styles.punchHeaderTitle}>WEAVING UNIT PUNCH STATION</Text>
          <Text style={styles.punchHeaderSub}>Scan Station QR Code at Main Gate</Text>

          {/* COMPACT TIME BADGE */}
          <View style={styles.compactClockBox}>
            <Ionicons name="time-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.compactTimeText}>{timeString}</Text>
            <Text style={styles.clockSeparator}>•</Text>
            <Text style={styles.compactDateText}>{dateString}</Text>
          </View>

          {/* PUNCH BUTTON */}
          <TouchableOpacity
            style={[styles.bigPunchBtn, activeShift ? styles.punchBtnOut : styles.punchBtnIn]}
            onPress={() => setScannerVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={activeShift ? 'exit-outline' : 'qr-code-outline'}
              size={26}
              color="#FFFFFF"
              style={{ marginRight: 12 }}
            />
            <View style={styles.punchBtnTextBox}>
              <Text style={styles.punchBtnMainText}>
                {activeShift ? 'PUNCH OUT NOW' : 'PUNCH IN NOW'}
              </Text>
              <Text style={styles.punchBtnSubText}>
                {activeShift
                  ? `Active since ${activeShift.inTime}`
                  : 'Scan Station QR to Start Shift'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 3 METRIC CARDS (NO MONEY / NO WAGES) */}
        <View style={styles.metricsGrid}>
          {/* Card 1 */}
          <View style={styles.metricCard}>
            <Ionicons name="timer-outline" size={20} color={COLORS.primary} />
            <Text style={styles.metricVal}>{totalHoursWorked} hrs</Text>
            <Text style={styles.metricLabel}>Hours Worked</Text>
          </View>

          {/* Card 2 */}
          <View style={[styles.metricCard, activeShift ? styles.metricCardActive : styles.metricCardInactive]}>
            <Ionicons
              name={activeShift ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={activeShift ? COLORS.success : COLORS.muted}
            />
            <Text style={[styles.metricVal, activeShift ? styles.valSuccess : styles.valMuted]}>
              {activeShift ? 'ON DUTY' : 'OFF DUTY'}
            </Text>
            <Text style={styles.metricLabel}>Current Status</Text>
          </View>

          {/* Card 3 */}
          <View style={styles.metricCard}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            <Text style={styles.metricVal}>{totalShiftsCount} Shifts</Text>
            <Text style={styles.metricLabel}>Completed</Text>
          </View>
        </View>

        {/* Recent Attendance Logs */}
        <View style={styles.logsSection}>
          <View style={styles.logsHeader}>
            <Text style={styles.sectionTitle}>Recent Attendance Logs</Text>
            <TouchableOpacity onPress={onNavigateToAttendance}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {employeeAttendanceLogs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No shift logs recorded yet. Tap Punch In above.</Text>
            </View>
          ) : (
            employeeAttendanceLogs.slice(0, 3).map((item) => (
              <View key={item.id} style={styles.logCard}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} style={{ marginRight: 10 }} />

                <View style={styles.logInfo}>
                  <Text style={styles.logDateText}>{item.date}</Text>
                  <Text style={styles.logTimeRow}>
                    IN: <Text style={styles.textGreen}>{item.inTime}</Text>  •  OUT: <Text style={styles.textRed}>{item.outTime}</Text>
                  </Text>
                </View>

                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{item.hoursWorked} hrs</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Camera Modal */}
      <CameraQRScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
      />
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
  workerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  workerDetails: {
    flex: 1,
  },
  workerName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
  },
  workerRole: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  punchSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  punchHeaderTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primaryDark,
    letterSpacing: 0.5,
  },
  punchHeaderSub: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
    marginBottom: 12,
  },
  compactClockBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.canvas,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  compactTimeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
  },
  clockSeparator: {
    marginHorizontal: 6,
    color: COLORS.muted,
  },
  compactDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
  },
  bigPunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
  },
  punchBtnIn: {
    backgroundColor: COLORS.accent,
  },
  punchBtnOut: {
    backgroundColor: COLORS.danger,
  },
  punchBtnTextBox: {
    flex: 1,
  },
  punchBtnMainText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  punchBtnSubText: {
    color: '#F1F5F9',
    fontSize: 11,
    marginTop: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  metricCardActive: {
    borderColor: COLORS.accent,
    backgroundColor: '#F0FDF4',
  },
  metricCardInactive: {
    borderColor: COLORS.line,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
    marginTop: 4,
  },
  valSuccess: {
    color: COLORS.success,
  },
  valMuted: {
    color: COLORS.muted,
  },
  metricLabel: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 2,
    textAlign: 'center',
  },
  logsSection: {
    marginTop: 4,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  viewAllText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
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
  logCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  logInfo: {
    flex: 1,
  },
  logDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  logTimeRow: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  textGreen: {
    color: COLORS.success,
    fontWeight: '700',
  },
  textRed: {
    color: COLORS.danger,
    fontWeight: '700',
  },
  durationBadge: {
    backgroundColor: COLORS.canvas,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
});
