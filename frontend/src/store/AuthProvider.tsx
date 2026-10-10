import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthRole, AuthUser } from '../services/authService';
import {
  fetchCurrentUser,
  getStoredToken,
  registerAccount,
  signIn as signInRequest,
  signOut as signOutRequest,
  storeToken,
} from '../services/authService';
import type { RegisterInput } from '../services/authService';
import { setCurrentSession } from '../services/orderService';

/**
 * The buyer/admin portals still read their workspace session from
 * orderService's localStorage key. Keep it in sync with the real JWT session
 * so portal guards and per-buyer data keep working after a backend sign-in.
 */
function syncPortalSession(user: AuthUser | null): void {
  if (!user) {
    setCurrentSession(null);
    return;
  }
  if (user.role !== 'buyer' && user.role !== 'admin') {
    return;
  }
  // Reuse the seeded demo buyer's data key when the email matches.
  const legacyBuyerId =
    user.email.toLowerCase() === 'buyer@everestmills.com' ? 'buyer-demo' : `user-${user.id}`;
  setCurrentSession({
    userId: legacyBuyerId,
    role: user.role,
    name: user.full_name,
    email: user.email,
    companyName: user.company ?? undefined,
  });
}

export interface AuthContextValue {
  user: AuthUser | null;
  /** True while the stored token is being validated against /auth/me. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  hasRole: (...roles: AuthRole[]) => boolean;
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
      .then((me) => {
        if (!cancelled) {
          syncPortalSession(me);
          setUser(me);
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

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await signInRequest(email, password);
    storeToken(session.token);
    syncPortalSession(session.user);
    setUser(session.user);
    return session.user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const session = await registerAccount(input);
    storeToken(session.token);
    syncPortalSession(session.user);
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

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signIn, register, signOut, hasRole }),
    [user, loading, signIn, register, signOut, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
