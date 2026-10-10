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

export default function HistoryScreen() {
  const { attendanceLogs, paymentLogs } = useContext(WorkerContext);
  const [filter, setFilter] = useState('ALL');

  return (
    <SafeAreaView style={styles.container}>
      <WorkerHeader title="Logs & History" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {['ALL', 'ATTENDANCE', 'PAYMENTS'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterChip, filter === type && styles.filterChipActive]}
              onPress={() => setFilter(type)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === type && styles.filterTextActive,
                ]}
              >
                {type === 'ALL' ? 'All Activity' : type === 'ATTENDANCE' ? 'Shifts' : 'Payouts'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Combined Activity Stream */}
        <View style={styles.streamSection}>
          {(filter === 'ALL' || filter === 'ATTENDANCE') &&
            attendanceLogs.map((item) => (
              <View key={'att-' + item.id} style={styles.itemCard}>
                <View style={[styles.iconBox, styles.iconAtt]}>
                  <Text style={styles.iconEmoji}>⏱️</Text>
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>Shift: {item.hoursWorked} hrs Worked</Text>
                  <Text style={styles.itemSub}>
                    IN {item.inTime} • OUT {item.outTime}
                  </Text>
                  <Text style={styles.itemDate}>{item.date}</Text>
                </View>
                <Text style={styles.itemEarned}>+ ₹{item.earned}</Text>
              </View>
            ))}

          {(filter === 'ALL' || filter === 'PAYMENTS') &&
            paymentLogs.map((item) => (
              <View key={'pay-' + item.id} style={styles.itemCard}>
                <View style={[styles.iconBox, styles.iconPay]}>
                  <Text style={styles.iconEmoji}>💸</Text>
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>Payout: {item.method}</Text>
                  <Text style={styles.itemSub}>Txn: {item.txnId}</Text>
                  <Text style={styles.itemDate}>{item.date}</Text>
                </View>
                <Text style={styles.itemPaid}>- ₹{item.amount}</Text>
              </View>
            ))}
        </View>
      </ScrollView>
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
  filterRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  streamSection: {
    marginTop: 4,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconAtt: {
    backgroundColor: '#EFF6FF',
  },
  iconPay: {
    backgroundColor: '#F0FDF4',
  },
  iconEmoji: {
    fontSize: 18,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  itemDate: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  itemEarned: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },
  itemPaid: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16A34A',
  },
});
