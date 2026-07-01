/**
 * Convenience hook for consuming the AuthContext.
 *
 * Usage:
 *   const { user, userRole, signIn, signOut } = useAuth();
 */

import React from 'react';
import { AuthContext } from '@/providers/auth-provider';
import type { AuthContextType } from '@/providers/auth-provider';

export function useAuth(): AuthContextType {
  return React.use(AuthContext);
}
