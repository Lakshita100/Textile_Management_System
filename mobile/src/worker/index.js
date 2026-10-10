import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { WorkerProvider, WorkerContext } from './context/WorkerContext';
import WorkerLoginScreen from './screens/WorkerLoginScreen';
import WorkerDashboardScreen from './screens/WorkerDashboardScreen';
import AttendanceScreen from './screens/AttendanceScreen';
import WagesScreen from './screens/WagesScreen';
import HistoryScreen from './screens/HistoryScreen';

function MainWorkerApp() {
  const { isLoggedIn } = useContext(WorkerContext);
  const [currentTab, setCurrentTab] = useState('Dashboard');

  if (!isLoggedIn) {
    return <WorkerLoginScreen />;
  }

  const renderTabScreen = () => {
    switch (currentTab) {
      case 'Dashboard':
        return (
          <WorkerDashboardScreen
            navigation={{ navigate: (tabName) => setCurrentTab(tabName) }}
          />
        );
      case 'Attendance':
        return <AttendanceScreen />;
      case 'Wages':
        return <WagesScreen />;
      case 'History':
        return <HistoryScreen />;
      default:
        return <WorkerDashboardScreen />;
    }
  };

  const TABS = [
    { name: 'Dashboard', icon: '🏠', label: 'Home' },
    { name: 'Attendance', icon: '📷', label: 'QR Attendance' },
    { name: 'Wages', icon: '💰', label: 'Wages' },
    { name: 'History', icon: '📜', label: 'History' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenArea}>{renderTabScreen()}</View>

      {/* Bottom Navigation Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => setCurrentTab(tab.name)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabIcon,
                currentTab === tab.name && styles.tabIconActive,
              ]}
            >
              {tab.icon}
            </Text>
            <Text
              style={[
                styles.tabLabel,
                currentTab === tab.name && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
            {currentTab === tab.name && <View style={styles.activeDot} />}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

export default function WorkerModule() {
  return (
    <WorkerProvider>
      <MainWorkerApp />
    </WorkerProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  screenArea: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderColor: '#1E293B',
    paddingBottom: 4,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#60A5FA',
    fontWeight: '800',
  },
  activeDot: {
    position: 'absolute',
    top: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#60A5FA',
  },
});
