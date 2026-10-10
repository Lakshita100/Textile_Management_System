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
import PaymentGatewayModal from '../components/PaymentGatewayModal';

export default function WagesScreen() {
  const {
    worker,
    totalEarned,
    totalPaid,
    pendingWages,
    totalHoursWorked,
    paymentLogs,
  } = useContext(WorkerContext);

  const [paymentVisible, setPaymentVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <WorkerHeader title="Wages & Payments" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Payout Banner Card */}
        <View style={styles.payoutCard}>
          <Text style={styles.payoutTitle}>Unpaid Wages Balance</Text>
          <Text style={styles.payoutAmount}>₹{pendingWages}</Text>

          <View style={styles.payoutRateRow}>
            <Text style={styles.payoutRateText}>
              Hourly Rate: <Text style={styles.boldText}>₹{worker.hourlyRate}/hr</Text>
            </Text>
            <Text style={styles.payoutRateText}>
              Total Work: <Text style={styles.boldText}>{totalHoursWorked} hrs</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.gatewayBtn}
            onPress={() => setPaymentVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.gatewayBtnText}>RELEASE WAGES VIA GATEWAY</Text>
          </TouchableOpacity>
        </View>

        {/* Financial Summary Breakdown */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Gross Earned</Text>
            <Text style={styles.summaryValBlue}>₹{totalEarned}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Paid Out</Text>
            <Text style={styles.summaryValGreen}>₹{totalPaid}</Text>
          </View>
        </View>

        {/* Payment History / Disbursal Ledger */}
        <View style={styles.ledgerSection}>
          <Text style={styles.sectionTitle}>Payment Disbursal History</Text>

          {paymentLogs.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No payout transactions recorded yet.</Text>
            </View>
          ) : (
            paymentLogs.map((item) => (
              <View key={item.id} style={styles.txnCard}>
                <View style={styles.txnIconCircle}>
                  <Text style={styles.txnIcon}>💸</Text>
                </View>

                <View style={styles.txnInfo}>
                  <Text style={styles.txnMethod}>{item.method}</Text>
                  <Text style={styles.txnDate}>{item.date} • {item.txnId}</Text>
                </View>

                <View style={styles.txnAmountBox}>
                  <Text style={styles.txnAmount}>+ ₹{item.amount}</Text>
                  <Text style={styles.txnStatus}>{item.status}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

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
  payoutCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  payoutTitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  payoutAmount: {
    color: '#22C55E',
    fontSize: 34,
    fontWeight: '800',
    marginVertical: 4,
  },
  payoutRateRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  payoutRateText: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  boldText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  gatewayBtn: {
    backgroundColor: '#2563EB',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  gatewayBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  summaryValBlue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2563EB',
    marginTop: 4,
  },
  summaryValGreen: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16A34A',
    marginTop: 4,
  },
  ledgerSection: {
    marginTop: 4,
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
  txnCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  txnIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txnIcon: {
    fontSize: 18,
  },
  txnInfo: {
    flex: 1,
  },
  txnMethod: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  txnDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  txnAmountBox: {
    alignItems: 'flex-end',
  },
  txnAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16A34A',
  },
  txnStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
    marginTop: 2,
  },
});
