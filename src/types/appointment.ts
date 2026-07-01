import { Database } from './database.types';

export type AppointmentRow = Database['public']['Tables']['medical_appointments']['Row'];
export type AppointmentInsert = Database['public']['Tables']['medical_appointments']['Insert'];
export type AppointmentUpdate = Database['public']['Tables']['medical_appointments']['Update'];

export type MedicalAppointment = AppointmentRow;
