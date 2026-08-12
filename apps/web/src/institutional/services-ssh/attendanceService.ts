import { supabase } from '@/institutional/lib-ssh/supabase';
import type { Database } from '@/institutional/lib-ssh/database.types';

type AttendanceRecord = Database['public']['Tables']['attendance_records']['Row'];
type AttendanceInsert = Database['public']['Tables']['attendance_records']['Insert'];

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: '1', student_id: 's1', subject_id: 'sub1', faculty_id: 'f1', date: '2024-01-15', status: 'Present', time: '09:00 AM', room: 'CS-101', created_at: '' },
  { id: '2', student_id: 's1', subject_id: 'sub2', faculty_id: 'f2', date: '2024-01-15', status: 'Absent',  time: '11:00 AM', room: 'CS-102', created_at: '' },
  { id: '3', student_id: 's1', subject_id: 'sub3', faculty_id: 'f3', date: '2024-01-16', status: 'Late',    time: '10:00 AM', room: 'CS-103', created_at: '' },
  { id: '4', student_id: 's1', subject_id: 'sub1', faculty_id: 'f1', date: '2024-01-16', status: 'Present', time: '02:00 PM', room: 'CS-101', created_at: '' },
  { id: '5', student_id: 's1', subject_id: 'sub4', faculty_id: 'f4', date: '2024-01-17', status: 'Present', time: '01:00 PM', room: 'CS-104', created_at: '' },
  { id: '6', student_id: 's1', subject_id: 'sub2', faculty_id: 'f2', date: '2024-01-18', status: 'Present', time: '11:00 AM', room: 'CS-102', created_at: '' },
];

const isMockMode = () =>
  !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co';

// ─── Attendance Service ───────────────────────────────────────────────────────

export const attendanceService = {
  /**
   * Fetch all attendance records for a specific student.
   */
  async getStudentAttendance(studentId: string): Promise<AttendanceRecord[]> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 500));
      return MOCK_ATTENDANCE.filter((r) => r.student_id === studentId || studentId === 'mock');
    }

    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  /**
   * Fetch attendance records for a faculty's class on a given date.
   */
  async getClassAttendance(subjectId: string, date: string): Promise<AttendanceRecord[]> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 500));
      return MOCK_ATTENDANCE.filter((r) => r.subject_id === subjectId && r.date === date);
    }

    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('date', date);

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  /**
   * Bulk insert / upsert attendance records (faculty use case).
   */
  async submitAttendance(records: AttendanceInsert[]): Promise<void> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 600));
      return;
    }

    const { error } = await supabase
      .from('attendance_records')
      .upsert(records, { onConflict: 'student_id,subject_id,date' });

    if (error) throw new Error(error.message);
  },

  /**
   * Compute attendance summary for a student across all subjects.
   */
  computeSummary(records: AttendanceRecord[]) {
    const total = records.length;
    const present = records.filter((r) => r.status === 'Present').length;
    const late = records.filter((r) => r.status === 'Late').length;
    const absent = records.filter((r) => r.status === 'Absent').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, late, absent, percentage };
  },

  /**
   * Group records by subject.
   */
  groupBySubject(records: AttendanceRecord[]) {
    const map = new Map<string, AttendanceRecord[]>();
    for (const rec of records) {
      const existing = map.get(rec.subject_id) ?? [];
      map.set(rec.subject_id, [...existing, rec]);
    }
    return map;
  },
};
