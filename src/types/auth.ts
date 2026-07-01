/**
 * Auth type definitions for MemoLink RBAC system.
 * Roles: 'senior' (primary user) and 'caregiver' (secondary user).
 */

/** Application roles matching the `public.app_role` Postgres enum. */
export type AppRole = 'senior' | 'caregiver';

/** Standardized result for all auth operations. */
export type AuthResult = {
  success: boolean;
  error: string | null;
};

/** Shape of a row in the `public.profiles` table. */
export type Profile = {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  role: AppRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

/** Parameters for the signup function. */
export type SignUpParams = {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  role: AppRole;
};
