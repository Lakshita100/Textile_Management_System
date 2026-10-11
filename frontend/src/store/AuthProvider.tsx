import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthRole, AuthUser } from '../services/authService';
import {
  fetchCurrentUser,
  changePassword as changePasswordRequest,
  getStoredToken,
  registerAccount,
  signIn as signInRequest,
  signInWithGoogle as signInWithGoogleRequest,
  signOut as signOutRequest,
  storeToken,
  updateBuyerProfile as updateBuyerProfileRequest,
} from '../services/authService';
import type { BuyerProfileUpdateInput, RegisterInput } from '../services/authService';
import { clearBuyerWorkspace, hydrateBuyerWorkspace, setCurrentSession, syncAuthenticatedBuyer } from '../services/orderService';

/**
 * The buyer/admin portals still read their workspace session from
 * orderService's localStorage key. Keep it in sync with the real JWT session
 * so portal guards and per-buyer data keep working after a backend sign-in.
 */
function syncPortalSession(user: AuthUser | null): void {
  if (!user) {
    setCurrentSession(null);
    clearBuyerWorkspace();
    return;
  }
  if (user.role !== 'buyer' && user.role !== 'admin') {
    return;
  }
  if (user.role === 'buyer') syncAuthenticatedBuyer(user);
  const email = user.email ?? '';
  const accountDataId = `user-${user.id}`;
  setCurrentSession({
    userId: accountDataId,
    role: user.role,
    name: user.full_name,
    email,
    companyName: user.company ?? undefined,
  });
}

export interface AuthContextValue {
  user: AuthUser | null;
  /** True while the stored token is being validated against /auth/me. */
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<AuthUser>;
  signInWithGoogle: (idToken: string) => Promise<AuthUser>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthUser>;
  updateBuyerProfile: (input: BuyerProfileUpdateInput) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  hasRole: (...roles: AuthRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(getStoredToken()));

  useEffect(() => {
    let cancelled = false;
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetchCurrentUser()
      .then(async (me) => {
        if (!cancelled) {
          syncPortalSession(me);
          setUser(me);
        }
        if (me.role === 'buyer' || me.role === 'admin') {
          await hydrateBuyerWorkspace().catch(() => undefined);
        }
      })
      .catch(() => {
        // Token expired / revoked / account removed — drop it silently.
        storeToken(null);
        if (!cancelled) {
          syncPortalSession(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (identifier: string, password: string) => {
    const session = await signInRequest(identifier, password);
    storeToken(session.token);
    syncPortalSession(session.user);
    if (session.user.role === 'buyer' || session.user.role === 'admin') await hydrateBuyerWorkspace();
    setUser(session.user);
    return session.user;
  }, []);

  const signInWithGoogle = useCallback(async (idToken: string) => {
    const session = await signInWithGoogleRequest(idToken);
    storeToken(session.token);
    syncPortalSession(session.user);
    if (session.user.role === 'buyer' || session.user.role === 'admin') await hydrateBuyerWorkspace();
    setUser(session.user);
    return session.user;
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const updated = await changePasswordRequest(currentPassword, newPassword);
    syncPortalSession(updated);
    setUser(updated);
    return updated;
  }, []);

  const updateBuyerProfile = useCallback(async (input: BuyerProfileUpdateInput) => {
    const updated = await updateBuyerProfileRequest(input);
    syncPortalSession(updated);
    setUser(updated);
    return updated;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const session = await registerAccount(input);
    storeToken(session.token);
    syncPortalSession(session.user);
    if (session.user.role === 'buyer' || session.user.role === 'admin') await hydrateBuyerWorkspace();
    setUser(session.user);
    return session.user;
  }, []);

  const signOut = useCallback(async () => {
    await signOutRequest();
    syncPortalSession(null);
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (...roles: AuthRole[]) => (user ? roles.includes(user.role) : false),
    [user],
  );
  const hasPermission = useCallback(
    (permission: string) => Boolean(user && (user.role === 'admin' || user.permissions.includes(permission))),
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signIn, signInWithGoogle, changePassword, updateBuyerProfile, register, signOut, hasRole, hasPermission }),
    [user, loading, signIn, signInWithGoogle, changePassword, updateBuyerProfile, register, signOut, hasRole, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
