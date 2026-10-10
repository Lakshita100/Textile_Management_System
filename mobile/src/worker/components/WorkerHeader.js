import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { WorkerContext } from '../context/WorkerContext';

export default function WorkerHeader({ title }) {
  const { worker, activeShift, logoutWorker } = useContext(WorkerContext);

  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        <View style={styles.profileSection}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>
              {worker.name ? worker.name.split(' ').map(n => n[0]).join('') : 'W'}
            </Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.workerName}>{worker.name}</Text>
            <Text style={styles.workerRole}>{worker.role} • {worker.department}</Text>
            <Text style={styles.workerIdBadge}>ID: {worker.id}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logoutWorker} activeOpacity={0.7}>
          <Text style={styles.logoutBtnText}>Exit</Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Status Bar */}
      <View style={[styles.statusBanner, activeShift ? styles.statusBannerActive : styles.statusBannerInactive]}>
        <View style={[styles.dot, activeShift ? styles.dotActive : styles.dotInactive]} />
        <Text style={styles.statusText}>
          {activeShift
            ? `ON DUTY - Checked In at ${activeShift.inTime}`
            : 'OFF DUTY - Scan QR to Check In'}
        </Text>
      </View>

      {title && <Text style={styles.pageTitle}>{title}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#1E293B',
    paddingTop: 45,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  infoBox: {
    flex: 1,
  },
  workerName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  workerRole: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 1,
  },
  workerIdBadge: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  statusBannerActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  statusBannerInactive: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dotActive: {
    backgroundColor: '#22C55E',
  },
  dotInactive: {
    backgroundColor: '#94A3B8',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  pageTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 14,
  },
});
