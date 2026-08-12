import { supabase } from '@/institutional/lib-ssh/supabase';
import type { Database } from '@/institutional/lib-ssh/database.types';

type Submission = Database['public']['Tables']['submissions']['Row'];
type SubmissionInsert = Database['public']['Tables']['submissions']['Insert'];
type Assignment = Database['public']['Tables']['assignments']['Row'];

const isMockMode = () =>
  !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co';

const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: 'a1', title: 'Data Structures Lab Report', description: 'Implement tree traversal algorithms', subject_id: 'sub1', faculty_id: 'f1', due_date: new Date(Date.now() + 3 * 86400000).toISOString(), max_marks: 100, created_at: '' },
  { id: 'a2', title: 'Database Design Project', description: 'Design an ER diagram for a hospital system', subject_id: 'sub2', faculty_id: 'f2', due_date: new Date(Date.now() + 7 * 86400000).toISOString(), max_marks: 50, created_at: '' },
  { id: 'a3', title: 'OS Process Scheduling', description: 'Simulate CPU scheduling algorithms', subject_id: 'sub3', faculty_id: 'f3', due_date: new Date(Date.now() - 2 * 86400000).toISOString(), max_marks: 100, created_at: '' },
];

const MOCK_SUBMISSIONS: Submission[] = [
  { id: 's1', assignment_id: 'a3', student_id: 'st1', file_url: '/uploads/os_report.pdf', submitted_at: new Date().toISOString(), status: 'Approved', grade: 'A', feedback: 'Excellent work!', reviewed_by: 'f3', reviewed_at: new Date().toISOString() },
];

export const submissionService = {
  /** Get all assignments visible to the current student. */
  async getAssignments(): Promise<Assignment[]> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 400));
      return MOCK_ASSIGNMENTS;
    }

    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  /** Get all submissions by a student. */
  async getStudentSubmissions(studentId: string): Promise<Submission[]> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 300));
      return MOCK_SUBMISSIONS;
    }

    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  /** Submit or update a submission. */
  async submitAssignment(payload: SubmissionInsert): Promise<void> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 600));
      return;
    }

    const { error } = await supabase
      .from('submissions')
      .upsert(payload, { onConflict: 'assignment_id,student_id' });

    if (error) throw new Error(error.message);
  },

  /** Upload a file to Supabase Storage and return its public URL. */
  async uploadFile(file: File, path: string): Promise<string> {
    if (isMockMode()) return URL.createObjectURL(file);

    const { data, error } = await supabase.storage
      .from('submissions')
      .upload(path, file, { upsert: true });

    if (error) throw new Error(error.message);

    const { data: urlData } = supabase.storage.from('submissions').getPublicUrl(data.path);
    return urlData.publicUrl;
  },

  /** Faculty: get all submissions for an assignment. */
  async getSubmissionsForAssignment(assignmentId: string): Promise<Submission[]> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 300));
      return MOCK_SUBMISSIONS.filter((s) => s.assignment_id === assignmentId);
    }

    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('assignment_id', assignmentId);

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  /** Faculty: approve or reject a submission. */
  async reviewSubmission(
    submissionId: string,
    status: 'Approved' | 'Rejected',
    grade?: string,
    feedback?: string
  ): Promise<void> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 400));
      return;
    }

    const { error } = await supabase
      .from('submissions')
      .update({ status, grade: grade ?? null, feedback: feedback ?? null, reviewed_at: new Date().toISOString() })
      .eq('id', submissionId);

    if (error) throw new Error(error.message);
  },
};
