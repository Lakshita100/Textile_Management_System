import React, { useState, useContext } from 'react';
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

export default function AttendanceScreen() {
  const { activeShift, attendanceLogs } = useContext(WorkerContext);
  const [scannerVisible, setScannerVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <WorkerHeader title="Attendance & QR Gate" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Quick Action Smart Button */}
        <TouchableOpacity
          style={[styles.bigActionBtn, activeShift ? styles.btnOut : styles.btnIn]}
          onPress={() => setScannerVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.bigActionIcon}>{activeShift ? '🚪' : '📷'}</Text>
          <View style={styles.bigActionTextBox}>
            <Text style={styles.bigActionTitle}>
              {activeShift ? 'TAP TO PUNCH OUT' : 'TAP TO PUNCH IN'}
            </Text>
            <Text style={styles.bigActionSub}>
              {activeShift
                ? `Currently Shift Active (Checked In ${activeShift.inTime})`
                : 'Scans QR at Gate to record live date & time'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Worker Smart QR Code */}
        <QRCodeCard size={200} />

        {/* Attendance Log History */}
        <View style={styles.logsSection}>
          <Text style={styles.sectionTitle}>Attendance History</Text>
          {attendanceLogs.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No attendance records found yet.</Text>
            </View>
          ) : (
            attendanceLogs.map((item) => (
              <View key={item.id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordDate}>{item.date}</Text>
                  <View style={styles.badgeCompleted}>
                    <Text style={styles.badgeTextCompleted}>{item.status || 'Completed'}</Text>
                  </View>
                </View>

                <View style={styles.recordBody}>
                  <View style={styles.timingCol}>
                    <Text style={styles.timingLabel}>IN TIME</Text>
                    <Text style={styles.timingInVal}>{item.inTime}</Text>
                  </View>
                  <View style={styles.timingDivider} />
                  <View style={styles.timingCol}>
                    <Text style={styles.timingLabel}>OUT TIME</Text>
                    <Text style={styles.timingOutVal}>{item.outTime}</Text>
                  </View>
                  <View style={styles.timingDivider} />
                  <View style={styles.timingCol}>
                    <Text style={styles.timingLabel}>WORKED</Text>
                    <Text style={styles.timingWorkedVal}>{item.hoursWorked} hrs</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <SmartScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
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
  bigActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    elevation: 3,
  },
  btnIn: {
    backgroundColor: '#16A34A',
  },
  btnOut: {
    backgroundColor: '#DC2626',
  },
  bigActionIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  bigActionTextBox: {
    flex: 1,
  },
  bigActionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bigActionSub: {
    color: '#F1F5F9',
    fontSize: 11,
    marginTop: 2,
  },
  logsSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  emptyBox: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  badgeCompleted: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeTextCompleted: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '700',
  },
  recordBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
  },
  timingCol: {
    alignItems: 'center',
    flex: 1,
  },
  timingLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  timingInVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  timingOutVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  timingWorkedVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
  },
  timingDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#CBD5E1',
  },
});
