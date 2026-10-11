import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getBackendTextiles,
  createBackendRequirement,
  postBackendAttendancePunch,
  getBackendLiveAttendanceStatus,
  getBackendAttendanceLogs,
} from '../services/api';

export const AppContext = createContext();

const STORAGE_KEY = '@textile_app_master_state_v4';

// Central Station QR Code Payload that Employee Head displays
export const STATION_QR_DATA = JSON.stringify({
  stationId: 'TEX-GATE-01',
  location: 'Main Weaving Unit Gate',
  company: 'Smart Coders Textile Ltd',
  timestamp: 'STATION_LIVE',
});

// HIGH RESOLUTION TEXTILE FABRIC CATALOG FOR BUYERS
const INITIAL_TEXTILES = [
  {
    id: 'tex-1',
    name: '14oz Indigo Ring Denim',
    category: 'Denim & Heavyweight',
    gsm: 380,
    price: '₹220 / meter',
    moq: '500 meters',
    image: 'https://images.unsplash.com/photo-1542272604-780c36856d64?auto=format&fit=crop&w=1000&q=80',
    description: '100% Pure Cotton 14oz deep indigo dyed selvedge denim fabric. Engineered for durable jeans, jackets, and workwear.',
    specs: 'Weave: 3/1 Right Hand Twill | Width: 58 inches | Finish: Sanforized',
  },
  {
    id: 'tex-2',
    name: 'Mulberry Gold Zari Silk',
    category: 'Silk & Luxury',
    gsm: 95,
    price: '₹680 / meter',
    moq: '100 meters',
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80',
    description: 'Handwoven pure mulberry silk with traditional gold zari borders. Exceptional lustre for sarees and ethnic couture.',
    specs: 'Weave: Handloom Plain | Width: 44 inches | Yarn: 20/22 Denier Raw Silk',
  },
  {
    id: 'tex-3',
    name: 'French Flax Organic Linen',
    category: 'Linen & Natural',
    gsm: 185,
    price: '₹340 / meter',
    moq: '250 meters',
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1000&q=80',
    description: 'Ultra breathable 100% European flax organic linen. Soft washed finish for shirts, summer dresses, and home linen.',
    specs: 'Weave: 1/1 Plain Weave | Width: 56 inches | Dye: Azo-Free Organic',
  },
  {
    id: 'tex-4',
    name: 'Combed Cotton Yarn-Dyed Stripe',
    category: 'Cotton Apparel',
    gsm: 140,
    price: '₹190 / meter',
    moq: '400 meters',
    image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=1000&q=80',
    description: 'High thread count 40s compact combed cotton poplin with yarn-dyed stripes. Pre-shrunk for formal shirting.',
    specs: 'Weave: Poplin | Width: 58 inches | Finish: Mercerized Soft',
  },
  {
    id: 'tex-5',
    name: 'Handspun Khadi Raw Cotton',
    category: 'Handloom & Sustainable',
    gsm: 160,
    price: '₹260 / meter',
    moq: '200 meters',
    image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1000&q=80',
    description: 'Artisanal handspun 100% unbleached organic cotton khadi. Textured weave with natural thermal regulation.',
    specs: 'Weave: Village Handloom | Width: 48 inches | Color: Natural Off-White',
  },
  {
    id: 'tex-6',
    name: 'Plush Ribbed Velvet Corduroy',
    category: 'Velvet & Outerwear',
    gsm: 310,
    price: '₹410 / meter',
    moq: '300 meters',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1000&q=80',
    description: 'Heavyweight 8-wale plush cotton velvet corduroy fabric. Rich pile texture for blazers, trousers, and upholstery.',
    specs: 'Weave: 8-Wale Corduroy | Width: 56 inches | Color: Deep Emerald',
  },
];

// Initial Employee Roster for Admin tracking
const INITIAL_EMPLOYEES = [
  {
    id: 'EMP-101',
    name: 'Ramesh Kumar',
    role: 'Master Weaver',
    dept: 'Weaving Section',
    hourlyRate: 150,
    status: 'OFF DUTY',
    lastCheckIn: '09 Oct, 09:00 AM',
    lastCheckOut: '09 Oct, 06:00 PM',
    hoursToday: 9,
    earnedToday: 1350,
  },
  {
    id: 'EMP-102',
    name: 'Suresh Patel',
    role: 'Dyeing Operator',
    dept: 'Dyeing Unit',
    hourlyRate: 140,
    status: 'ON DUTY',
    lastCheckIn: '10 Oct, 08:30 AM',
    lastCheckOut: '-',
    hoursToday: 5.5,
    earnedToday: 770,
  },
  {
    id: 'EMP-103',
    name: 'Priya Sharma',
    role: 'Quality Inspector',
    dept: 'QC Department',
    hourlyRate: 160,
    status: 'OFF DUTY',
    lastCheckIn: '09 Oct, 09:15 AM',
    lastCheckOut: '09 Oct, 05:45 PM',
    hoursToday: 8.5,
    earnedToday: 1360,
  },
];

export const AppProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null); // 'employee' | 'admin' | 'buyer'
  const [currentUser, setCurrentUser] = useState(null);
  const [activeShift, setActiveShift] = useState(null);
  const [employeeAttendanceLogs, setEmployeeAttendanceLogs] = useState([]);
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [textiles, setTextiles] = useState(INITIAL_TEXTILES);
  const [buyerRequirements, setBuyerRequirements] = useState([]);

  // Safe Load state on startup
  useEffect(() => {
    loadState();
    syncBackendTextiles();
    syncBackendAttendance();
  }, []);

  // Sync attendance when user logs in or switches role
  useEffect(() => {
    if (currentUser) {
      syncBackendAttendance();
    }
  }, [currentUser]);

  // Safe Save state on change
  useEffect(() => {
    if (userRole) {
      saveState();
    }
  }, [userRole, currentUser, activeShift, employeeAttendanceLogs, buyerRequirements, employees]);

  const syncBackendTextiles = async () => {
    const remoteData = await getBackendTextiles();
    if (remoteData && Array.isArray(remoteData) && remoteData.length > 0) {
      setTextiles(remoteData);
    }
  };

  const syncBackendAttendance = async () => {
    try {
      const data = await getBackendLiveAttendanceStatus(currentUser?.token);
      if (data && data.success) {
        if (Array.isArray(data.employees) && data.employees.length > 0) {
          setEmployees(data.employees);
        }
        if (Array.isArray(data.records)) {
          setEmployeeAttendanceLogs(data.records);
        }
        // If logged in as employee, sync active shift state with backend
        if (userRole === 'employee' && currentUser?.id) {
          const myEmp = data.employees?.find(
            (e) => e.id === currentUser.id || e.name === currentUser.name
          );
          if (myEmp && myEmp.status === 'ON DUTY' && !activeShift) {
            setActiveShift({
              date: myEmp.lastCheckIn.split(',')[0],
              inTime: myEmp.lastCheckIn.split(',')[1]?.trim() || '09:00 AM',
              rawInTime: new Date().toISOString(),
            });
          } else if (myEmp && myEmp.status === 'OFF DUTY' && activeShift) {
            setActiveShift(null);
          }
        }
      }
    } catch (e) {
      // Silent error fallback
    }
  };

  const loadState = async () => {
    try {
      if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setUserRole(parsed.userRole || null);
          setCurrentUser(parsed.currentUser || null);
          setActiveShift(parsed.activeShift || null);
          setEmployeeAttendanceLogs(parsed.employeeAttendanceLogs || []);
          setBuyerRequirements(parsed.buyerRequirements || []);
          if (parsed.employees) setEmployees(parsed.employees);
        }
      }
    } catch (e) {
      console.warn('AsyncStorage load skipped:', e?.message);
    }
  };

  const saveState = async () => {
    try {
      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        const payload = {
          userRole,
          currentUser,
          activeShift,
          employeeAttendanceLogs,
          buyerRequirements,
          employees,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      }
    } catch (e) {
      console.warn('AsyncStorage save skipped:', e?.message);
    }
  };

  const loginAsRole = (role, userData) => {
    setUserRole(role);
    setCurrentUser(userData);
  };

  const logout = () => {
    setUserRole(null);
    setCurrentUser(null);
  };

  // Employee Punch IN / OUT when scanning Station QR (Syncs with Backend API)
  const punchAttendance = async () => {
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateFormatted = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const empName = currentUser?.name || 'Ramesh Kumar';
    const empId = currentUser?.id || 'EMP-000021';
    const hourlyRate = currentUser?.hourlyRate || 150;
    const isPunchIn = !activeShift;

    // 1. Post to backend API immediately
    const res = await postBackendAttendancePunch(
      {
        worker_id: empId,
        worker_name: empName,
        action: isPunchIn ? 'PUNCH_IN' : 'PUNCH_OUT',
        timestamp: now.toISOString(),
      },
      currentUser?.token
    );

    if (isPunchIn) {
      // PUNCH IN
      const newShift = {
        date: dateFormatted,
        inTime: timeFormatted,
        rawInTime: now.toISOString(),
      };
      setActiveShift(newShift);

      // Update employee roster status for Admin
      setEmployees(prev =>
        prev.map(emp =>
          emp.id === empId || emp.name === empName
            ? { ...emp, status: 'ON DUTY', lastCheckIn: `${dateFormatted}, ${timeFormatted}` }
            : emp
        )
      );

      // Trigger full background sync
      setTimeout(() => syncBackendAttendance(), 300);

      return { action: 'IN', time: timeFormatted, date: dateFormatted, workerName: empName };
    } else {
      // PUNCH OUT
      const startTime = new Date(activeShift.rawInTime);
      const diffMs = now - startTime;
      const diffMins = Math.max(1, Math.round(diffMs / (1000 * 60)));
      const hoursWorked = res?.hours_worked || Math.max(0.1, parseFloat((diffMins / 60).toFixed(2)));
      const earned = Math.round(hoursWorked * hourlyRate);

      const newRecord = {
        id: 'att-' + Date.now(),
        workerId: empId,
        workerName: empName,
        date: activeShift.date,
        inTime: activeShift.inTime,
        outTime: timeFormatted,
        hoursWorked,
        earned,
        status: 'Completed',
      };

      setEmployeeAttendanceLogs(prev => [newRecord, ...prev]);
      setActiveShift(null);

      // Update employee roster status for Admin
      setEmployees(prev =>
        prev.map(emp =>
          emp.id === empId || emp.name === empName
            ? {
                ...emp,
                status: 'OFF DUTY',
                lastCheckOut: `${dateFormatted}, ${timeFormatted}`,
                hoursToday: hoursWorked,
                earnedToday: earned,
              }
            : emp
        )
      );

      // Trigger full background sync
      setTimeout(() => syncBackendAttendance(), 300);

      return { action: 'OUT', time: timeFormatted, date: dateFormatted, hoursWorked, earned, workerName: empName };
    }
  };

  // Buyer posts bulk requirement (Syncs with Backend API)
  const postBuyerRequirement = (reqData) => {
    const newReq = {
      id: 'REQ-' + Math.floor(1000 + Math.random() * 9000),
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      buyerName: currentUser?.name || 'Buyer',
      buyerCompany: reqData.company || 'Vogue Garments Ltd',
      fabricType: reqData.fabricType,
      quantity: reqData.quantity,
      targetPrice: reqData.targetPrice,
      deliveryDate: reqData.deliveryDate,
      notes: reqData.notes,
      status: 'Inquiry Submitted',
    };

    setBuyerRequirements([newReq, ...buyerRequirements]);

    // Sync with FastAPI Backend if reachable
    createBackendRequirement(newReq);

    return newReq;
  };

  return (
    <AppContext.Provider
      value={{
        userRole,
        currentUser,
        activeShift,
        employeeAttendanceLogs,
        employees,
        textiles,
        buyerRequirements,
        loginAsRole,
        logout,
        punchAttendance,
        syncBackendAttendance,
        postBuyerRequirement,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
