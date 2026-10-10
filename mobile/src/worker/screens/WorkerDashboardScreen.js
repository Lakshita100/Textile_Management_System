import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { WorkerContext } from '../context/WorkerContext';
import WorkerHeader from '../components/WorkerHeader';
import QRCodeCard from '../components/QRCodeCard';
import SmartScannerModal from '../components/SmartScannerModal';
import PaymentGatewayModal from '../components/PaymentGatewayModal';

export default function WorkerDashboardScreen({ navigation }) {
  const {
    worker,
    activeShift,
    attendanceLogs,
    totalEarned,
    pendingWages,
    totalHoursWorked,
  } = useContext(WorkerContext);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [scannerVisible, setScannerVisible] = useState(false);
  const [paymentVisible, setPaymentVisible] = useState(false);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format live clock
  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const dateString = currentTime.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container}>
      <WorkerHeader />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Live Date & Time Bar */}
        <View style={styles.clockCard}>
          <View>
            <Text style={styles.clockDate}>{dateString}</Text>
            <Text style={styles.clockTime}>{timeString}</Text>
          </View>
          <TouchableOpacity
            style={[styles.scanTriggerBtn, activeShift ? styles.btnOut : styles.btnIn]}
            onPress={() => setScannerVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.scanBtnIcon}>📷</Text>
            <Text style={styles.scanBtnText}>
              {activeShift ? 'PUNCH OUT' : 'PUNCH IN'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={styles.statVal}>{totalHoursWorked} hrs</Text>
            <Text style={styles.statLabel}>Total Work Hours</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statVal}>₹{totalEarned}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>

          <View style={[styles.statCard, styles.statCardHighlight]}>
            <Text style={styles.statIcon}>💳</Text>
            <Text style={styles.statValGreen}>₹{pendingWages}</Text>
            <Text style={styles.statLabelHighlight}>Unpaid Balance</Text>
            <TouchableOpacity
              style={styles.payoutMiniBtn}
              onPress={() => setPaymentVisible(true)}
            >
              <Text style={styles.payoutMiniText}>Get Paid</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Worker Smart QR Code Section */}
        <QRCodeCard />

        {/* Recent Attendance Activity */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Attendance Logs</Text>
            <TouchableOpacity onPress={() => navigation && navigation.navigate('History')}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {attendanceLogs.slice(0, 3).map(item => (
            <View key={item.id} style={styles.logCard}>
              <View style={styles.logDateBox}>
                <Text style={styles.logDateText}>{item.date.split(' ')[0]}</Text>
                <Text style={styles.logMonthText}>{item.date.split(' ')[1]}</Text>
              </View>

              <View style={styles.logDetailBox}>
                <Text style={styles.logTiming}>
                  IN: <Text style={styles.inTime}>{item.inTime}</Text>  •  OUT: <Text style={styles.outTime}>{item.outTime}</Text>
                </Text>
                <Text style={styles.logMeta}>
                  Duration: {item.hoursWorked} hrs  |  Earned: ₹{item.earned}
                </Text>
              </View>

              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>✓</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modals */}
      <SmartScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
      />
      <PaymentGatewayModal
        visible={paymentVisible}
        onClose={() => setPaymentVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  clockCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clockDate: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  clockTime: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  scanTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  btnIn: {
    backgroundColor: '#22C55E',
  },
  btnOut: {
    backgroundColor: '#EF4444',
  },
  scanBtnIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  scanBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  statCardHighlight: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  statValGreen: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16A34A',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  statLabelHighlight: {
    fontSize: 10,
    color: '#1D4ED8',
    fontWeight: '700',
    marginTop: 2,
  },
  payoutMiniBtn: {
    marginTop: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  payoutMiniText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  recentSection: {
    marginTop: 10,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewAllText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logDateBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logDateText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  logMonthText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  logDetailBox: {
    flex: 1,
  },
  logTiming: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  inTime: {
    color: '#16A34A',
  },
  outTime: {
    color: '#DC2626',
  },
  logMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgeText: {
    color: '#15803D',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
