// Auto-generated Supabase Database types
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'student' | 'faculty' | 'admin' | 'government';
export type AttendanceStatus = 'Present' | 'Absent' | 'Late';
export type SubmissionStatus = 'Pending' | 'Approved' | 'Rejected' | 'Escalated';
export type ActivityStatus = 'Pending' | 'Approved' | 'Rejected';
export type NotificationType = 'info' | 'warning' | 'success' | 'error' | 'announcement';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: UserRole;
          avatar_url: string | null;
          department: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      students: {
        Row: {
          id: string;
          profile_id: string;
          roll_number: string;
          semester: string;
          section: string;
          gpa: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['students']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['students']['Insert']>;
      };
      faculty: {
        Row: {
          id: string;
          profile_id: string;
          department: string;
          subjects: string[];
          experience_years: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['faculty']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['faculty']['Insert']>;
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          code: string;
          faculty_id: string;
          department: string;
          semester: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['subjects']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['subjects']['Insert']>;
      };
      attendance_records: {
        Row: {
          id: string;
          student_id: string;
          subject_id: string;
          faculty_id: string;
          date: string;
          status: AttendanceStatus;
          time: string | null;
          room: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['attendance_records']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['attendance_records']['Insert']>;
      };
      assignments: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          subject_id: string;
          faculty_id: string;
          due_date: string;
          max_marks: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['assignments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['assignments']['Insert']>;
      };
      submissions: {
        Row: {
          id: string;
          assignment_id: string;
          student_id: string;
          file_url: string | null;
          submitted_at: string;
          status: SubmissionStatus;
          grade: string | null;
          feedback: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['submissions']['Row'], 'id' | 'submitted_at'>;
        Update: Partial<Database['public']['Tables']['submissions']['Insert']>;
      };
      activities: {
        Row: {
          id: string;
          student_id: string;
          title: string;
          type: string;
          description: string | null;
          file_url: string | null;
          status: ActivityStatus;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['activities']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['activities']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: NotificationType;
          read: boolean;
          action_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      announcements: {
        Row: {
          id: string;
          created_by: string;
          title: string;
          message: string;
          target_role: UserRole | 'all';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['announcements']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['announcements']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      attendance_status: AttendanceStatus;
      submission_status: SubmissionStatus;
    };
  };
}
