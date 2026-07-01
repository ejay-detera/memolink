import { Database } from './database.types';

export type RoutineRow = Database['public']['Tables']['routines']['Row'];
export type RoutineInsert = Database['public']['Tables']['routines']['Insert'];
export type RoutineUpdate = Database['public']['Tables']['routines']['Update'];

// Optional: you can define a frontend-friendly Routine type if it differs from the Row type, 
// but for now they can be identical.
export type Routine = RoutineRow;
