/**
 * classFeedService.ts — API helpers for the class feed feature.
 *
 * All requests go to the FastAPI backend.
 * Auth token is passed as a Bearer header.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export interface Author {
  id: string;
  name: string | null;
  email: string;
  role: string;
  age_tier: string;
}

export interface Reply {
  id: string;
  parent_id: string;
  content: string;
  created_at: string;
  author: Author;
}

export interface ClassPost {
  id: string;
  class_id: string;
  content: string;
  created_at: string;
  author: Author;
  replies: Reply[];
}

/**
 * Fetch all announcements/prompts and replies for a class group.
 */
export async function getClassPosts(
  token: string | null,
  classId?: string
): Promise<ClassPost[]> {
  if (!token) return [];
  try {
    const url = classId 
      ? `${API_BASE}/api/class-posts?class_id=${classId}` 
      : `${API_BASE}/api/class-posts`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.warn("[classFeedService] getClassPosts failed:", res.status);
      return [];
    }
    const data = await res.json();
    return (data as ClassPost[]) ?? [];
  } catch (err) {
    console.error("[classFeedService] getClassPosts error:", err);
    return [];
  }
}

/**
 * Post an announcement or prompt (Teacher only).
 */
export async function createClassPost(
  token: string | null,
  classId: string,
  content: string
): Promise<{ success: boolean; post_id?: string } | null> {
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/class-posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ class_id: classId, content }),
    });
    if (!res.ok) {
      console.warn("[classFeedService] createClassPost failed:", res.status);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("[classFeedService] createClassPost error:", err);
    return null;
  }
}

/**
 * Post a reply to an announcement or prompt.
 */
export async function replyToClassPost(
  token: string | null,
  postId: string,
  content: string
): Promise<{ success: boolean; reply_id?: string } | null> {
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/class-posts/${postId}/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      console.warn("[classFeedService] replyToClassPost failed:", res.status);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("[classFeedService] replyToClassPost error:", err);
    return null;
  }
}

/**
 * Toggle a reaction emoji on a class post or reply.
 */
export async function reactToClassPost(
  token: string | null,
  postId: string,
  emoji: string
): Promise<{ success: boolean; reactions: Record<string, string[]> } | null> {
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/class-posts/${postId}/react`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ emoji }),
    });
    if (!res.ok) {
      console.warn("[classFeedService] reactToClassPost failed:", res.status);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("[classFeedService] reactToClassPost error:", err);
    return null;
  }
}

/**
 * Delete an announcement/prompt or reply.
 */
export async function deleteClassPost(
  token: string | null,
  postId: string
): Promise<{ success: boolean; message?: string } | null> {
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/class-posts/${postId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      console.warn("[classFeedService] deleteClassPost failed:", res.status);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("[classFeedService] deleteClassPost error:", err);
    return null;
  }
}

export interface ActiveReflection {
  active: boolean;
  post: ClassPost | null;
  has_replied: boolean;
}

/**
 * Get active daily reflection prompt.
 */
export async function getActiveReflection(token: string | null): Promise<ActiveReflection | null> {
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/class-posts/active-reflection`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      console.warn("[classFeedService] getActiveReflection failed:", res.status);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("[classFeedService] getActiveReflection error:", err);
    return null;
  }
}
