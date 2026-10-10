import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppProvider, AppContext } from './context/AppContext';
import LoginScreen from './screens/LoginScreen';
import EmployeeDashboard from './employee/EmployeeDashboard';
import AdminDashboard from './admin/AdminDashboard';
import BuyerDashboard from './buyer/BuyerDashboard';

function MainAppRouter() {
  const { userRole } = useContext(AppContext);

  if (!userRole) {
    return <LoginScreen />;
  }

  switch (userRole) {
    case 'employee':
      return <EmployeeDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'buyer':
      return <BuyerDashboard />;
    default:
      return <LoginScreen />;
  }
}

export default function AppEntry() {
  return (
    <AppProvider>
      <MainAppRouter />
    </AppProvider>
  );
}
