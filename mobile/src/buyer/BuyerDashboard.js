import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../styles/theme';
import BuyerExplore from './BuyerExplore';
import BuyerOrders from './BuyerOrders';
import BuyerProfile from './BuyerProfile';

export default function BuyerDashboard() {
  const [currentTab, setCurrentTab] = useState('Explore'); // 'Explore' | 'Orders' | 'Profile'

  const renderActiveScreen = () => {
    switch (currentTab) {
      case 'Explore':
        return <BuyerExplore onNavigateToOrders={() => setCurrentTab('Orders')} />;
      case 'Orders':
        return <BuyerOrders />;
      case 'Profile':
        return <BuyerProfile />;
      default:
        return <BuyerExplore onNavigateToOrders={() => setCurrentTab('Orders')} />;
    }
  };

  const TABS = [
    { id: 'Explore', label: 'Explore & Order', icon: 'grid-outline', activeIcon: 'grid' },
    { id: 'Orders', label: 'My Orders', icon: 'bag-handle-outline', activeIcon: 'bag-handle' },
    { id: 'Profile', label: 'Buyer Profile', icon: 'person-outline', activeIcon: 'person' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>

      {/* Clean Vector Icon Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => setCurrentTab(tab.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={22}
                color={isActive ? COLORS.primary : COLORS.muted}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderColor: COLORS.line,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  tabLabel: {
    fontSize: 10,
    color: COLORS.muted,
    fontWeight: '600',
    marginTop: 3,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
});
