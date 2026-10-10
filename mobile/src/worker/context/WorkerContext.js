import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const WorkerContext = createContext();

const STORAGE_KEY = '@worker_app_data_v1';

const DEFAULT_WORKER = {
  id: 'WRK-2026-8942',
  name: 'Ramesh Kumar',
  role: 'Master Weaver',
  department: 'Weaving Unit 2',
  hourlyRate: 150, // ₹150 per hour
  phone: '+91 98765 43210',
};

const INITIAL_ATTENDANCE = [
  {
    id: 'att-101',
    date: '09 Oct 2026',
    inTime: '09:00 AM',
    outTime: '06:00 PM',
    hoursWorked: 9,
    earned: 1350,
    status: 'Completed',
  },
  {
    id: 'att-102',
    date: '08 Oct 2026',
    inTime: '09:30 AM',
    outTime: '05:30 PM',
    hoursWorked: 8,
    earned: 1200,
    status: 'Completed',
  },
  {
    id: 'att-103',
    date: '07 Oct 2026',
    inTime: '09:00 AM',
    outTime: '07:00 PM',
    hoursWorked: 10,
    earned: 1500,
    status: 'Completed',
  },
];

const INITIAL_PAYMENTS = [
  {
    id: 'pay-501',
    date: '09 Oct 2026',
    amount: 2500,
    method: 'UPI (GPay)',
    txnId: 'TXN984321876',
    status: 'Paid',
  },
  {
    id: 'pay-502',
    date: '05 Oct 2026',
    amount: 5000,
    method: 'Bank Transfer',
    txnId: 'TXN451239871',
    status: 'Paid',
  },
];

export const WorkerProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [worker, setWorker] = useState(DEFAULT_WORKER);
  const [activeShift, setActiveShift] = useState(null); // null if checked out, or object { inTime, rawInTime, date }
  const [attendanceLogs, setAttendanceLogs] = useState(INITIAL_ATTENDANCE);
  const [paymentLogs, setPaymentLogs] = useState(INITIAL_PAYMENTS);

  // Load persisted data on startup
  useEffect(() => {
    loadStoredData();
  }, []);

  // Save state changes to AsyncStorage
  useEffect(() => {
    if (isLoggedIn) {
      saveStoredData();
    }
  }, [isLoggedIn, activeShift, attendanceLogs, paymentLogs]);

  const loadStoredData = async () => {
    try {
      const dataStr = await AsyncStorage.getItem(STORAGE_KEY);
      if (dataStr) {
        const data = JSON.parse(dataStr);
        setIsLoggedIn(data.isLoggedIn ?? false);
        setWorker(data.worker || DEFAULT_WORKER);
        setActiveShift(data.activeShift || null);
        setAttendanceLogs(data.attendanceLogs || INITIAL_ATTENDANCE);
        setPaymentLogs(data.paymentLogs || INITIAL_PAYMENTS);
      }
    } catch (e) {
      console.error('Failed to load worker data from storage', e);
    }
  };

  const saveStoredData = async () => {
    try {
      const dataToSave = {
        isLoggedIn,
        worker,
        activeShift,
        attendanceLogs,
        paymentLogs,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save worker data to storage', e);
    }
  };

  const loginDemoWorker = (customName, customRole) => {
    const randomId = 'WRK-2026-' + Math.floor(1000 + Math.random() * 9000);
    const newWorker = {
      ...DEFAULT_WORKER,
      id: randomId,
      name: customName || DEFAULT_WORKER.name,
      role: customRole || DEFAULT_WORKER.role,
    };
    setWorker(newWorker);
    setIsLoggedIn(true);
  };

  const logoutWorker = () => {
    setIsLoggedIn(false);
  };

  // Smart Attendance Punching (Toggle IN / OUT)
  const punchAttendance = () => {
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateFormatted = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    if (!activeShift) {
      // PUNCH IN
      const newShift = {
        date: dateFormatted,
        inTime: timeFormatted,
        rawInTime: now.toISOString(),
      };
      setActiveShift(newShift);
      return { action: 'IN', time: timeFormatted, date: dateFormatted };
    } else {
      // PUNCH OUT
      const startTime = new Date(activeShift.rawInTime);
      const diffMs = now - startTime;
      const diffMins = Math.max(1, Math.round(diffMs / (1000 * 60)));
      // Calculate hours formatted (minimum 0.1 hour or actual hours)
      const hoursWorked = Math.max(0.1, parseFloat((diffMins / 60).toFixed(2)));
      const earned = Math.round(hoursWorked * worker.hourlyRate);

      const newRecord = {
        id: 'att-' + Date.now(),
        date: activeShift.date,
        inTime: activeShift.inTime,
        outTime: timeFormatted,
        hoursWorked,
        earned,
        status: 'Completed',
      };

      setAttendanceLogs([newRecord, ...attendanceLogs]);
      setActiveShift(null);
      return { action: 'OUT', time: timeFormatted, date: dateFormatted, hoursWorked, earned };
    }
  };

  // Payment Gateway / Payout request
  const processPayout = (amount, method) => {
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const txnId = 'TXN' + Math.floor(100000000 + Math.random() * 900000000);

    const newPayment = {
      id: 'pay-' + Date.now(),
      date: dateFormatted,
      amount: Number(amount),
      method,
      txnId,
      status: 'Paid',
    };

    setPaymentLogs([newPayment, ...paymentLogs]);
    return newPayment;
  };

  // Derived financial statistics
  const totalEarned = attendanceLogs.reduce((acc, curr) => acc + (curr.earned || 0), 0);
  const totalPaid = paymentLogs.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const pendingWages = Math.max(0, totalEarned - totalPaid);
  const totalHoursWorked = attendanceLogs.reduce((acc, curr) => acc + (curr.hoursWorked || 0), 0).toFixed(1);

  return (
    <WorkerContext.Provider
      value={{
        isLoggedIn,
        worker,
        activeShift,
        attendanceLogs,
        paymentLogs,
        totalEarned,
        totalPaid,
        pendingWages,
        totalHoursWorked,
        loginDemoWorker,
        logoutWorker,
        punchAttendance,
        processPayout,
      }}
    >
      {children}
    </WorkerContext.Provider>
  );
};
