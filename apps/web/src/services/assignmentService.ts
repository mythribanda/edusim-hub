/**
 * assignmentService.ts — API helpers for the assignments & submissions feature.
 *
 * All requests go to the FastAPI backend (same base URL as TutorService, etc.).
 * Auth token is passed as a Bearer header.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export interface PendingAssignment {
  assignment_id: string;
  module_id: string;
  module_title: string;
  class_id: string;
  due_date: string | null;
  instructions: string | null;
  created_at: string;
}

export interface SubmissionPayload {
  assignment_id: string;
  answers: Record<string, unknown>;
  score?: number | null;
  completed_at?: string;
}

export interface SubmissionResult {
  success: boolean;
  submission_id: string;
  assignment_id?: string;
  score?: number | null;
  completed_at?: string | null;
  already_submitted?: boolean;
}

/**
 * Fetch all pending assignments for the logged-in student.
 * Returns an empty array on auth failure or network error — never throws.
 */
export async function getPendingAssignments(
  token: string | null
): Promise<PendingAssignment[]> {
  if (!token) return [];
  try {
    const res = await fetch(`${API_BASE}/api/assignments/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.assignments as PendingAssignment[]) ?? [];
  } catch {
    return [];
  }
}

/**
 * Record a student's module completion as an assignment submission.
 * Fire-and-forget safe — logs warnings but never throws.
 */
export async function createSubmission(
  token: string | null,
  payload: SubmissionPayload
): Promise<SubmissionResult | null> {
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn("[assignmentService] createSubmission failed:", res.status);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn("[assignmentService] createSubmission error:", err);
    return null;
  }
}

export interface StudentSubmission {
  submission_id: string;
  assignment_id: string;
  module_id: string;
  module_title: string;
  score: number | null;
  comment: string | null;
  completed_at: string | null;
  graded_at: string | null;
}

/**
 * Fetch all completed submissions for the logged-in student.
 */
export async function getMySubmissions(
  token: string | null
): Promise<StudentSubmission[]> {
  if (!token) return [];
  try {
    const res = await fetch(`${API_BASE}/api/submissions/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.submissions as StudentSubmission[]) ?? [];
  } catch {
    return [];
  }
}

