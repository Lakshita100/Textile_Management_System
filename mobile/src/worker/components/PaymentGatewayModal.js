import React, { useState, useContext } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { WorkerContext } from '../context/WorkerContext';

export default function PaymentGatewayModal({ visible, onClose }) {
  const { pendingWages, processPayout } = useContext(WorkerContext);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI (GPay)');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const handlePayout = () => {
    const numAmt = Number(amount || pendingWages);
    if (!numAmt || numAmt <= 0) {
      alert('Please enter a valid payout amount');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const res = processPayout(numAmt, method);
      setIsProcessing(false);
      setReceipt(res);
    }, 1200);
  };

  const handleQuickMax = () => {
    setAmount(String(pendingWages));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Wages Payment Gateway</Text>
              <Text style={styles.modalSubtitle}>Simulated Payout & Disbursal System</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {!receipt ? (
            <View style={styles.body}>
              <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Available Unpaid Wages</Text>
                <Text style={styles.balanceValue}>₹{pendingWages}</Text>
              </View>

              <Text style={styles.sectionLabel}>Enter Payout Amount (₹)</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder={String(pendingWages)}
                  value={amount}
                  onChangeText={setAmount}
                />
                <TouchableOpacity style={styles.maxBadge} onPress={handleQuickMax}>
                  <Text style={styles.maxText}>MAX</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionLabel}>Select Disbursal Method</Text>
              <View style={styles.methodRow}>
                {['UPI (GPay)', 'Bank Transfer', 'Cash'].map(item => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.methodChip, method === item && styles.methodChipActive]}
                    onPress={() => setMethod(item)}
                  >
                    <Text
                      style={[
                        styles.methodChipText,
                        method === item && styles.methodChipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.payBtn}
                onPress={handlePayout}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.payBtnText}>RELEASE PAYMENT NOW</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.receiptBody}>
              <View style={styles.successIconBox}>
                <Text style={styles.successIconText}>✓</Text>
              </View>
              <Text style={styles.successTitle}>Payment Successful!</Text>
              <Text style={styles.successSubtitle}>Wages paid & recorded in transaction ledger</Text>

              <View style={styles.receiptCard}>
                <View style={styles.receiptRow}>
                  <Text style={styles.rLabel}>Txn ID:</Text>
                  <Text style={styles.rValBold}>{receipt.txnId}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.rLabel}>Date:</Text>
                  <Text style={styles.rVal}>{receipt.date}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.rLabel}>Payment Method:</Text>
                  <Text style={styles.rVal}>{receipt.method}</Text>
                </View>
                <View style={styles.receiptDivider} />
                <View style={styles.receiptRow}>
                  <Text style={styles.rLabel}>Amount Paid:</Text>
                  <Text style={styles.rValAmount}>₹{receipt.amount}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => {
                  setReceipt(null);
                  setAmount('');
                  onClose();
                }}
              >
                <Text style={styles.doneBtnText}>Close Receipt</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: 'bold',
  },
  body: {
    paddingVertical: 10,
  },
  balanceCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E40AF',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  maxBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  maxText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '800',
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  methodChip: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  methodChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  methodChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  methodChipTextActive: {
    color: '#FFFFFF',
  },
  payBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  payBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  receiptBody: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successIconText: {
    color: '#16A34A',
    fontSize: 32,
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  successSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 20,
  },
  receiptCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  rLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  rVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  rValBold: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
  },
  rValAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16A34A',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: 8,
  },
  doneBtn: {
    backgroundColor: '#0F172A',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
