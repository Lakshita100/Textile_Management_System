import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { WorkerContext } from '../context/WorkerContext';

export default function WorkerLoginScreen() {
  const { loginDemoWorker } = useContext(WorkerContext);
  const [workerName, setWorkerName] = useState('');
  const [workerRole, setWorkerRole] = useState('Master Weaver');

  const SAMPLE_PROFILES = [
    { name: 'Ramesh Kumar', role: 'Master Weaver', dept: 'Weaving Unit 1' },
    { name: 'Suresh Patel', role: 'Dyeing Technician', dept: 'Dyeing Section' },
    { name: 'Priya Sharma', role: 'Quality Inspector', dept: 'QC Department' },
  ];

  const handleCustomLogin = () => {
    loginDemoWorker(workerName || 'Ramesh Kumar', workerRole);
  };

  const handleQuickSelect = (profile) => {
    loginDemoWorker(profile.name, profile.role);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Branding */}
        <View style={styles.brandBox}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>🧵</Text>
          </View>
          <Text style={styles.brandTitle}>Textile Worker Portal</Text>
          <Text style={styles.brandSubtitle}>Smart QR Attendance & Wages Tracker</Text>
        </View>

        {/* Demo Login Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Worker Quick Login</Text>
          <Text style={styles.cardDesc}>
            Enter worker details or choose a sample profile to generate a unique Smart QR ID.
          </Text>

          <Text style={styles.inputLabel}>Worker Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ramesh Kumar"
            value={workerName}
            onChangeText={setWorkerName}
          />

          <Text style={styles.inputLabel}>Department / Role</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Master Weaver"
            value={workerRole}
            onChangeText={setWorkerRole}
          />

          <TouchableOpacity style={styles.loginBtn} onPress={handleCustomLogin} activeOpacity={0.8}>
            <Text style={styles.loginBtnText}>LOGIN & GENERATE UNIQUE QR</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Sample Profiles */}
        <View style={styles.sampleSection}>
          <Text style={styles.sampleSectionTitle}>Or select a Demo Worker Profile:</Text>
          {SAMPLE_PROFILES.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.sampleCard}
              onPress={() => handleQuickSelect(item)}
              activeOpacity={0.7}
            >
              <View style={styles.sampleAvatar}>
                <Text style={styles.sampleAvatarText}>{item.name[0]}</Text>
              </View>
              <View style={styles.sampleInfo}>
                <Text style={styles.sampleName}>{item.name}</Text>
                <Text style={styles.sampleSub}>{item.role} • {item.dept}</Text>
              </View>
              <Text style={styles.arrowText}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
    marginBottom: 12,
  },
  iconEmoji: {
    fontSize: 30,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 14,
  },
  loginBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sampleSection: {
    marginTop: 4,
  },
  sampleSectionTitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  sampleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sampleAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sampleAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sampleInfo: {
    flex: 1,
  },
  sampleName: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 15,
  },
  sampleSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  arrowText: {
    color: '#60A5FA',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
