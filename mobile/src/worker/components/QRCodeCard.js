import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { WorkerContext } from '../context/WorkerContext';

export default function QRCodeCard({ size = 180 }) {
  const { worker, activeShift } = useContext(WorkerContext);

  const qrPayload = JSON.stringify({
    type: 'WORKER_SMART_ATTENDANCE',
    workerId: worker.id,
    name: worker.name,
    department: worker.department,
    timestamp: new Date().toISOString(),
  });

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Smart Worker QR Code</Text>
        <View style={[styles.badge, activeShift ? styles.badgeIn : styles.badgeOut]}>
          <Text style={[styles.badgeText, activeShift ? styles.badgeTextIn : styles.badgeTextOut]}>
            {activeShift ? 'IN' : 'OUT'}
          </Text>
        </View>
      </View>
      <Text style={styles.subtitle}>Scan at entrance gate or kiosk to manage IN/OUT attendance</Text>

      <View style={styles.qrContainer}>
        <QRCode
          value={qrPayload}
          size={size}
          color="#0F172A"
          backgroundColor="#FFFFFF"
        />
      </View>

      <View style={styles.idBox}>
        <Text style={styles.idLabel}>UNIQUE ID:</Text>
        <Text style={styles.idValue}>{worker.id}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeIn: {
    backgroundColor: '#DCFCE7',
  },
  badgeOut: {
    backgroundColor: '#F1F5F9',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextIn: {
    color: '#15803D',
  },
  badgeTextOut: {
    color: '#64748B',
  },
  qrContainer: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  idBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  idLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginRight: 6,
  },
  idValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
});
