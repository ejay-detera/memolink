import { Database } from './database.types';

export type ConnectionRow = Database['public']['Tables']['caregiver_senior_connections']['Row'];
export type ConnectionInsert = Database['public']['Tables']['caregiver_senior_connections']['Insert'];
export type ConnectionUpdate = Database['public']['Tables']['caregiver_senior_connections']['Update'];

export type Connection = ConnectionRow;
