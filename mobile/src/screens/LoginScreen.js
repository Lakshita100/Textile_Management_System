import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { COLORS } from '../styles/theme';
import { apiLoginUser, apiRegisterUser } from '../services/api';

export default function LoginScreen() {
  const { loginAsRole } = useContext(AppContext);
  const [selectedRole, setSelectedRole] = useState('employee'); // 'employee' | 'admin' | 'buyer'
  const [isRegisterMode, setIsRegisterMode] = useState(false); // Buyer Register toggle
  const [showPassword, setShowPassword] = useState(false); // Eye toggle for password

  // Form Inputs
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRoleSwitch = (role) => {
    setSelectedRole(role);
    setIsRegisterMode(false);
    setErrorMsg('');
    setShowPassword(false);
    setIdentifier('');
    setName('');
    setEmail('');
    setPassword('');
    setCompany('');
  };

  // 1. Primary Login Handler (Enforces strict backend DB verification)
  const handleLogin = async () => {
    setErrorMsg('');

    if (selectedRole === 'buyer') {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = password.trim();

      if (!cleanEmail) {
        setErrorMsg('Work Email is required.');
        return;
      }
      if (!cleanPass) {
        setErrorMsg('Password is required.');
        return;
      }

      setLoading(true);
      const res = await apiLoginUser(cleanEmail, cleanPass);
      setLoading(false);

      if (!res.success) {
        setErrorMsg(res.error || 'Invalid email or password.');
        return; // BLOCK LOGIN ON FAILURE
      }

      const user = res.data?.user;
      loginAsRole('buyer', {
        id: `BUYER-${user?.id || '01'}`,
        name: user?.full_name || 'Buyer Account',
        company: user?.company || company.trim() || 'Vogue Garments Ltd',
        email: user?.email || cleanEmail,
        token: res.data?.token,
      });
    } else if (selectedRole === 'employee') {
      const cleanId = identifier.trim() || email.trim();
      const cleanPass = password.trim();

      if (!cleanId) {
        setErrorMsg('Employee Email or ID is required.');
        return;
      }
      if (!cleanPass) {
        setErrorMsg('Password is required.');
        return;
      }

      setLoading(true);
      const res = await apiLoginUser(cleanId, cleanPass);
      setLoading(false);

      if (!res.success) {
        setErrorMsg(res.error || 'Incorrect Employee ID or Password.');
        return; // BLOCK LOGIN ON FAILURE
      }

      const user = res.data?.user;
      if (user?.role !== 'staff' && user?.role !== 'admin') {
        setErrorMsg('Account is registered as Buyer. Please switch to Buyer role.');
        return;
      }

      loginAsRole('employee', {
        id: user?.login_id || `EMP-${user?.id || '101'}`,
        name: user?.full_name || 'Ramesh Kumar',
        role: 'Master Weaver',
        dept: 'Weaving Section',
        token: res.data?.token,
      });
    } else if (selectedRole === 'admin') {
      const cleanId = identifier.trim() || email.trim();
      const cleanPass = password.trim();

      if (!cleanId) {
        setErrorMsg('Employee Head Email or ID is required.');
        return;
      }
      if (!cleanPass) {
        setErrorMsg('Password is required.');
        return;
      }

      setLoading(true);
      const res = await apiLoginUser(cleanId, cleanPass);
      setLoading(false);

      if (!res.success) {
        setErrorMsg(res.error || 'Incorrect Employee Head credentials.');
        return; // BLOCK LOGIN ON FAILURE
      }

      const user = res.data?.user;
      if (user?.role !== 'admin') {
        setErrorMsg('Employee Head / Admin permissions required.');
        return;
      }

      loginAsRole('admin', {
        id: user?.login_id || `ADM-${user?.id || '01'}`,
        name: user?.full_name || 'Employee Head',
        role: 'Employee Head & Factory Admin',
        dept: 'Factory Management',
        token: res.data?.token,
      });
    }
  };

  // 2. Buyer Register Handler
  const handleRegister = async () => {
    setErrorMsg('');
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();
    const cleanName = name.trim();

    if (!cleanName) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!cleanEmail) {
      setErrorMsg('Work Email is required.');
      return;
    }
    if (!cleanPass || cleanPass.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    const res = await apiRegisterUser({
      email: cleanEmail,
      password: cleanPass,
      full_name: cleanName,
      company: company.trim() || 'Garment Company',
    });
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Registration failed.');
      return;
    }

    const user = res.data?.user;
    loginAsRole('buyer', {
      id: `BUYER-${user?.id || '01'}`,
      name: user?.full_name || cleanName,
      company: user?.company || 'Garment Company',
      email: user?.email || cleanEmail,
      token: res.data?.token,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brand Header */}
        <View style={styles.brandBox}>
          <View style={styles.brandLogo}>
            <Ionicons name="grid" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.brandTitle}>TEXTILE MANAGEMENT SYSTEM</Text>
          <Text style={styles.brandSubtitle}>Factory & Buyer Portal</Text>
        </View>

        {/* Role Selector Segment */}
        <View style={styles.roleContainer}>
          <Text style={styles.roleLabel}>SELECT LOGIN ROLE</Text>
          <View style={styles.segmentRow}>
            <TouchableOpacity
              style={[styles.segmentBtn, selectedRole === 'employee' && styles.segmentActive]}
              onPress={() => handleRoleSwitch('employee')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="person"
                size={16}
                color={selectedRole === 'employee' ? '#FFFFFF' : COLORS.muted}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.segmentText, selectedRole === 'employee' && styles.segmentTextActive]}>
                Employee
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, selectedRole === 'admin' && styles.segmentActive]}
              onPress={() => handleRoleSwitch('admin')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="shield"
                size={16}
                color={selectedRole === 'admin' ? '#FFFFFF' : COLORS.muted}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.segmentText, selectedRole === 'admin' && styles.segmentTextActive]}>
                Employee Head
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, selectedRole === 'buyer' && styles.segmentActive]}
              onPress={() => handleRoleSwitch('buyer')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="cart"
                size={16}
                color={selectedRole === 'buyer' ? '#FFFFFF' : COLORS.muted}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.segmentText, selectedRole === 'buyer' && styles.segmentTextActive]}>
                Buyer
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Login Form Card */}
        <View style={styles.formCard}>
          <View style={styles.formHeaderRow}>
            <Text style={styles.formTitle}>
              {selectedRole === 'employee' && 'Worker Portal Login'}
              {selectedRole === 'admin' && 'Employee Head Portal Login'}
              {selectedRole === 'buyer' && (isRegisterMode ? 'New Buyer Registration' : 'Textile Buyer Sign In')}
            </Text>
            {selectedRole === 'buyer' && (
              <TouchableOpacity onPress={() => setIsRegisterMode(!isRegisterMode)}>
                <Text style={styles.toggleText}>
                  {isRegisterMode ? 'Sign In' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Validation Error Banner */}
          {errorMsg !== '' && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#E53935" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {selectedRole === 'buyer' ? (
            <>
              {isRegisterMode && (
                <>
                  <Text style={styles.inputLabel}>Full Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Vikram Singhania"
                    placeholderTextColor={COLORS.muted}
                    value={name}
                    onChangeText={(val) => {
                      setName(val);
                      setErrorMsg('');
                    }}
                  />
                </>
              )}

              <Text style={styles.inputLabel}>Work Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="buyer@voguegarments.com"
                placeholderTextColor={COLORS.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  setErrorMsg('');
                }}
              />

              <Text style={styles.inputLabel}>Password *</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.muted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    setErrorMsg('');
                  }}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={COLORS.muted}
                  />
                </TouchableOpacity>
              </View>

              {isRegisterMode && (
                <>
                  <Text style={styles.inputLabel}>Company / Brand Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Vogue Garments Ltd"
                    placeholderTextColor={COLORS.muted}
                    value={company}
                    onChangeText={setCompany}
                  />
                </>
              )}

              <TouchableOpacity
                style={styles.loginBtn}
                onPress={isRegisterMode ? handleRegister : handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginBtnText}>
                    {isRegisterMode ? 'CREATE BUYER ACCOUNT →' : 'SIGN IN TO BUYER PORTAL →'}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : selectedRole === 'admin' ? (
            <>
              <Text style={styles.inputLabel}>Employee Head Email / ID *</Text>
              <TextInput
                style={styles.input}
                placeholder="head@gmail.com"
                placeholderTextColor={COLORS.muted}
                autoCapitalize="none"
                value={identifier}
                onChangeText={(val) => {
                  setIdentifier(val);
                  setErrorMsg('');
                }}
              />

              <Text style={styles.inputLabel}>Password *</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.muted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    setErrorMsg('');
                  }}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={COLORS.muted}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginBtnText}>ENTER PORTAL AS EMPLOYEE HEAD →</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.inputLabel}>Employee Email / ID *</Text>
              <TextInput
                style={styles.input}
                placeholder="worker@everestmills.com"
                placeholderTextColor={COLORS.muted}
                autoCapitalize="none"
                value={identifier}
                onChangeText={(val) => {
                  setIdentifier(val);
                  setErrorMsg('');
                }}
              />

              <Text style={styles.inputLabel}>Password *</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.muted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    setErrorMsg('');
                  }}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={COLORS.muted}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginBtnText}>ENTER PORTAL AS EMPLOYEE →</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 36,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandLogo: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 2,
  },
  roleContainer: {
    marginBottom: 18,
  },
  roleLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.muted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: '#172B45',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#264268',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentActive: {
    backgroundColor: COLORS.primary,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
    elevation: 3,
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF3FA',
    borderWidth: 1,
    borderColor: '#D0E2F2',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 14,
  },
  demoChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.muted,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.canvas,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
    color: COLORS.ink,
    marginBottom: 14,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.canvas,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    height: 44,
    marginBottom: 14,
    paddingRight: 10,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
    color: COLORS.ink,
  },
  eyeBtn: {
    padding: 6,
  },
  loginBtn: {
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.line,
  },
  dividerText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.muted,
    marginHorizontal: 10,
    letterSpacing: 0.5,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    elevation: 1,
  },
  googleBtnText: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  googleCredNote: {
    fontSize: 9,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D32F2F',
    flex: 1,
  },
});
