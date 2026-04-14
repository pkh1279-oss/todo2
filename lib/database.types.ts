export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'user' | 'admin';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: UserRole;
          created_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          contact: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          contact?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          contact?: string | null;
          email?: string | null;
          created_at?: string;
        };
      };
      logs: {
        Row: {
          id: string;
          customer_id: string;
          date: string;
          coaching_time: string | null;
          sessions: number | null;
          location: string | null;
          topic: string | null;
          goal: string | null;
          action_plan: string | null;
          notes: string | null;
          remarks: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          date: string;
          coaching_time?: string | null;
          sessions?: number | null;
          location?: string | null;
          topic?: string | null;
          goal?: string | null;
          action_plan?: string | null;
          notes?: string | null;
          remarks?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          date?: string;
          coaching_time?: string | null;
          sessions?: number | null;
          location?: string | null;
          topic?: string | null;
          goal?: string | null;
          action_plan?: string | null;
          notes?: string | null;
          remarks?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
    };
  };
}
