import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { COLORS } from '../styles/theme';

export default function AdminAttendance() {
  const { employeeAttendanceLogs, employees, syncBackendAttendance } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await syncBackendAttendance();
    setRefreshing(false);
  }, [syncBackendAttendance]);

  // Initial sync & auto poll every 5s so attendance records stay in sync
  useEffect(() => {
    syncBackendAttendance();
    const interval = setInterval(() => {
      syncBackendAttendance();
    }, 5000);
    return () => clearInterval(interval);
  }, [syncBackendAttendance]);

  // Master Attendance Stream (combining initial roster records + real-time scanned logs)
  const masterAttendanceList = [...employeeAttendanceLogs];

  // Add initial roster records if list is empty for demo preview
  if (masterAttendanceList.length === 0) {
    employees.forEach(emp => {
      if (emp.lastCheckIn && emp.lastCheckIn !== '-') {
        masterAttendanceList.push({
          id: 'att-demo-' + emp.id,
          workerId: emp.id,
          workerName: emp.name,
          date: emp.lastCheckIn.split(',')[0],
          inTime: emp.lastCheckIn.split(',')[1] || '09:00 AM',
          outTime: emp.lastCheckOut !== '-' ? (emp.lastCheckOut.split(',')[1] || '06:00 PM') : 'Active Shift',
          hoursWorked: emp.hoursToday,
          status: emp.status === 'ON DUTY' ? 'In Progress' : 'Completed',
        });
      }
    });
  }

  const filteredLogs = masterAttendanceList.filter((log) =>
    (log.workerName && log.workerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.workerId && log.workerId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.date && log.date.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.headerTitle}>All Employee Attendance</Text>
            <Text style={styles.headerSub}>Master attendance records & shift log directory</Text>
          </View>
          <TouchableOpacity
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderWidth: 1,
              borderColor: COLORS.line,
            }}
            onPress={onRefresh}
          >
            <Feather name="refresh-cw" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={COLORS.muted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by employee name, ID or date..."
            placeholderTextColor={COLORS.muted}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryVal}>{masterAttendanceList.length}</Text>
            <Text style={styles.summaryLabel}>Total Records</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValGreen}>
              {employees.filter(e => e.status === 'ON DUTY').length}
            </Text>
            <Text style={styles.summaryLabel}>Active Shifts</Text>
          </View>
        </View>

        {filteredLogs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={36} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>No Attendance Records Found</Text>
            <Text style={styles.emptySub}>Matching attendance punches will appear here.</Text>
          </View>
        ) : (
          filteredLogs.map((item) => (
            <View key={item.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <View style={styles.empInfo}>
                  <Text style={styles.empName}>{item.workerName}</Text>
                  <Text style={styles.empIdBadge}>ID: {item.workerId}</Text>
                </View>

                <View
                  style={[
                    styles.badge,
                    item.status === 'In Progress' ? styles.badgeActive : styles.badgeCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      item.status === 'In Progress' ? styles.badgeTextActive : styles.badgeTextCompleted,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              <View style={styles.recordBody}>
                <View style={styles.timingCol}>
                  <Text style={styles.timingLabel}>DATE</Text>
                  <Text style={styles.timingVal}>{item.date}</Text>
                </View>

                <View style={styles.timingDivider} />

                <View style={styles.timingCol}>
                  <Text style={styles.timingLabel}>PUNCH IN</Text>
                  <Text style={styles.timingInVal}>{item.inTime}</Text>
                </View>

                <View style={styles.timingDivider} />

                <View style={styles.timingCol}>
                  <Text style={styles.timingLabel}>PUNCH OUT</Text>
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
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#172B45',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: '#264268',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  summaryVal: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ink,
  },
  summaryValGreen: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.success,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
    marginTop: 10,
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
  empInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  empName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
    marginRight: 8,
  },
  empIdBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
    backgroundColor: COLORS.canvas,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeCompleted: {
    backgroundColor: COLORS.successBg,
  },
  badgeActive: {
    backgroundColor: '#EFF6FF',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeTextCompleted: {
    color: COLORS.success,
  },
  badgeTextActive: {
    color: COLORS.primary,
  },
  recordBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.canvas,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  timingCol: {
    alignItems: 'center',
    flex: 1,
  },
  timingLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.muted,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  timingVal: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink,
  },
  timingInVal: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
  timingOutVal: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.danger,
  },
  timingWorkedVal: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  timingDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.line,
  },
});
