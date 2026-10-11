import React, { useState, useContext, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { WorkerContext } from '../context/WorkerContext';
import { Ionicons } from '@expo/vector-icons';

export default function SmartScannerModal({ visible, onClose }) {
  const { worker, activeShift, punchAttendance } = useContext(WorkerContext);
  const [scanResult, setScanResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Scanner Laser Animation
  const laserAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (visible) {
      setScanResult(null);
      setIsProcessing(false);
      startLaserAnimation();
    }
  }, [visible]);

  const startLaserAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(laserAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(laserAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleScanAction = () => {
    setIsProcessing(true);
    setTimeout(async () => {
      try {
        const res = await punchAttendance();
        setIsProcessing(false);
        setScanResult(res);
      } catch (_e) {
        setIsProcessing(false);
      }
    }, 600);
  };

  const laserY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 190],
  });

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Smart QR Gate Scanner</Text>
              <Text style={styles.modalSubtitle}>Simulating QR Gate Scanner Kiosk</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {!scanResult ? (
            <View style={styles.scannerBody}>
              {/* QR Camera Simulation Box */}
              <View style={styles.cameraBox}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />

                {/* Animated Scanner Laser */}
                <Animated.View
                  style={[
                    styles.laserLine,
                    { transform: [{ translateY: laserY }] },
                  ]}
                />

                <Text style={styles.scanTargetText}>
                  {activeShift ? 'Ready to Check OUT' : 'Ready to Check IN'}
                </Text>
                <Text style={styles.scannedIdText}>Detected QR: {worker.id}</Text>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={[
                  styles.punchButton,
                  activeShift ? styles.punchOutBtn : styles.punchInBtn,
                ]}
                onPress={handleScanAction}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                <Text style={styles.punchBtnText}>
                  {isProcessing
                    ? 'Processing Scan...'
                    : activeShift
                    ? 'SCAN TO PUNCH OUT'
                    : 'SCAN TO PUNCH IN'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.resultBody}>
              <View
                style={[
                  styles.resultIconCircle,
                  scanResult?.action === 'IN' ? styles.iconIn : styles.iconOut,
                ]}
              >
                <Ionicons
                  name={scanResult?.action === 'IN' ? 'checkmark' : 'log-out-outline'}
                  size={32}
                  color="#FFFFFF"
                />
              </View>

              <Text style={styles.resultTitle}>
                {scanResult?.action === 'IN' ? 'CHECKED IN SUCCESS' : 'CHECKED OUT SUCCESS'}
              </Text>

              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Worker Name:</Text>
                  <Text style={styles.detailVal}>{worker.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Worker ID:</Text>
                  <Text style={styles.detailVal}>{worker.id}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailVal}>{scanResult.date}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Timestamp:</Text>
                  <Text style={styles.detailValHighlight}>{scanResult.time}</Text>
                </View>

                {scanResult.action === 'OUT' && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Work Duration:</Text>
                      <Text style={styles.detailVal}>{scanResult.hoursWorked} hrs</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Shift Wages Earned:</Text>
                      <Text style={styles.detailValGreen}>+ ₹{scanResult.earned}</Text>
                    </View>
                  </>
                )}
              </View>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => {
                  setScanResult(null);
                  onClose();
                }}
              >
                <Text style={styles.doneBtnText}>Done</Text>
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
    marginBottom: 20,
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
  scannerBody: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cameraBox: {
    width: 240,
    height: 220,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginVertical: 15,
  },
  laserLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 3,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#3B82F6',
  },
  topLeft: {
    top: 12,
    left: 12,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 12,
    right: 12,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 12,
    left: 12,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 12,
    right: 12,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanTargetText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  scannedIdText: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  punchButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  punchInBtn: {
    backgroundColor: '#22C55E',
  },
  punchOutBtn: {
    backgroundColor: '#EF4444',
  },
  punchBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  resultBody: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  resultIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconIn: {
    backgroundColor: '#DCFCE7',
  },
  iconOut: {
    backgroundColor: '#FEE2E2',
  },
  resultIconText: {
    fontSize: 28,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  detailValHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },
  detailValGreen: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16A34A',
  },
  divider: {
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
