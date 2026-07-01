/**
 * AuthProvider — manages Supabase auth state for the entire app.
 *
 * Wraps the component tree in a React Context that exposes the current
 * session, user, role, and all auth operations (signIn, signUp, signOut,
 * resetPassword, updatePassword).
 *
 * Session is resolved on mount via `getClaims()` and kept in sync through
 * `onAuthStateChange`. The provider also listens for `PASSWORD_RECOVERY`
 * events to trigger the reset-password flow.
 */

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { useRouter, useSegments } from 'expo-router';

import { supabase } from '@/lib/supabase';
import type { AppRole, AuthResult, SignUpParams } from '@/types/auth';
import type { Session, User } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

export type AuthContextType = {
  session: Session | null;
  user: User | null;
  userRole: AppRole | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (params: SignUpParams) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
};

const INITIAL_CONTEXT: AuthContextType = {
  session: null,
  user: null,
  userRole: null,
  isLoading: true,
  signIn: async () => ({ success: false, error: 'Not initialised' }),
  signUp: async () => ({ success: false, error: 'Not initialised' }),
  signOut: async () => {},
  resetPassword: async () => ({ success: false, error: 'Not initialised' }),
  updatePassword: async () => ({ success: false, error: 'Not initialised' }),
};

export const AuthContext = createContext<AuthContextType>(INITIAL_CONTEXT);

// ---------------------------------------------------------------------------
// Helper — extract role from user metadata
// ---------------------------------------------------------------------------

function extractRoleFromUser(user: User | null): AppRole | null {
  if (!user) return null;
  
  // The role is stored in raw_user_meta_data during signUp
  const role = user.user_metadata?.role;
  
  if (role === 'senior' || role === 'caregiver') {
    return role;
  }
  
  return null;
}

// ---------------------------------------------------------------------------
// Provider component
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const segments = useSegments();

  // -----------------------------------------------------------------------
  // Keep session tokens fresh when the app returns to the foreground
  // -----------------------------------------------------------------------
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });
    return () => subscription.remove();
  }, []);

  // -----------------------------------------------------------------------
  // Bootstrap session on mount + listen for auth changes
  // -----------------------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        const role = extractRoleFromUser(currentSession.user);
        setUserRole(role);
      }
      setIsLoading(false);
    }

    bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession) {
          const role = extractRoleFromUser(newSession.user);
          setUserRole(role);
        } else {
          setUserRole(null);
        }

        if (event === 'PASSWORD_RECOVERY') {
          router.replace('/(auth)/reset-password' as never);
        }

        setIsLoading(false);
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // -----------------------------------------------------------------------
  // Protect routes — redirect based on auth state
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login' as never);
    } else if (session && inAuthGroup) {
      if (userRole === 'caregiver') {
        router.replace('/(app)/(caregiver)' as never);
      } else {
        router.replace('/(app)/(senior)' as never);
      }
    }
  }, [session, segments, isLoading, userRole]); // eslint-disable-line react-hooks/exhaustive-deps

  // -----------------------------------------------------------------------
  // Auth operations
  // -----------------------------------------------------------------------

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  }, []);

  const signUp = useCallback(async (params: SignUpParams): Promise<AuthResult> => {
    const { email, password, firstName, middleName, lastName, role } = params;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          middle_name: middleName ?? null,
          last_name: lastName,
          role,
        },
      },
    });
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  }, []);

  const signOutFn = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Sign Out Error', error.message);
  }, []);

  const resetPasswordFn = useCallback(async (email: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'memolink://reset-password',
    });
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  }, []);

  const updatePasswordFn = useCallback(async (newPassword: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  }, []);

  // -----------------------------------------------------------------------
  // Memoised context value
  // -----------------------------------------------------------------------
  const value = useMemo<AuthContextType>(() => ({
    session,
    user,
    userRole,
    isLoading,
    signIn,
    signUp,
    signOut: signOutFn,
    resetPassword: resetPasswordFn,
    updatePassword: updatePasswordFn,
  }), [session, user, userRole, isLoading, signIn, signUp, signOutFn, resetPasswordFn, updatePasswordFn]);

  return <AuthContext value={value}>{children}</AuthContext>;
}
