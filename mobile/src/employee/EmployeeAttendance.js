import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { COLORS } from '../styles/theme';

export default function EmployeeAttendance() {
  const { employeeAttendanceLogs } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = employeeAttendanceLogs.filter((log) =>
    log.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.inTime.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance History</Text>
        <Text style={styles.headerSub}>Complete record of shift punches & durations</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by date (e.g. 10 Oct)..."
            placeholderTextColor="#FFFFFF"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredLogs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={36} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>No Attendance Records</Text>
            <Text style={styles.emptySub}>Your shift attendance punches will appear here.</Text>
          </View>
        ) : (
          filteredLogs.map((item) => (
            <View key={item.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-sharp" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.recordDate}>{item.date}</Text>
                </View>

                <View style={styles.badgeCompleted}>
                  <Ionicons name="checkmark-done" size={12} color={COLORS.success} style={{ marginRight: 4 }} />
                  <Text style={styles.badgeTextCompleted}>{item.status || 'Completed'}</Text>
                </View>
              </View>

              <View style={styles.recordBody}>
                <View style={styles.timingCol}>
                  <Text style={styles.timingLabel}>SHIFT IN</Text>
                  <Text style={styles.timingInVal}>{item.inTime}</Text>
                </View>

                <View style={styles.timingDivider} />

                <View style={styles.timingCol}>
                  <Text style={styles.timingLabel}>SHIFT OUT</Text>
                  <Text style={styles.timingOutVal}>{item.outTime}</Text>
                </View>

                <View style={styles.timingDivider} />

                <View style={styles.timingCol}>
                  <Text style={styles.timingLabel}>DURATION</Text>
                  <Text style={styles.timingWorkedVal}>{item.hoursWorked} hrs</Text>
                </View>
              </View>
            </View>
          ))
        )}
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
    color: '#FFFFFF',
    marginTop: 2,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  recordCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordDate: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  badgeCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeTextCompleted: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '700',
  },
  recordBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.canvas,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  timingCol: {
    alignItems: 'center',
    flex: 1,
  },
  timingLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.muted,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  timingInVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.success,
  },
  timingOutVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.danger,
  },
  timingWorkedVal: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  timingDivider: {
    width: 1,
    height: 22,
    backgroundColor: COLORS.line,
  },
});
