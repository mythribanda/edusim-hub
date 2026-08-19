const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
  reactions: Record<string, string[]>;
}

export interface ClassPost {
  id: string;
  class_id: string;
  content: string;
  created_at: string;
  author: Author;
  replies: Reply[];
  reactions: Record<string, string[]>;
  is_reflection?: boolean;
}

export async function getClassPosts(token: string | null, classId?: string): Promise<ClassPost[]> {
  if (!token) return [];
  try {
    const url = classId 
      ? `${API_BASE}/api/class-posts?class_id=${classId}` 
      : `${API_BASE}/api/class-posts`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function createClassPost(token: string | null, classId: string, content: string, isReflection?: boolean) {
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/class-posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ class_id: classId || undefined, content, is_reflection: isReflection }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function replyToClassPost(token: string | null, postId: string, content: string) {
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
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function reactToClassPost(token: string | null, postId: string, emoji: string) {
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
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function deleteClassPost(token: string | null, postId: string) {
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/class-posts/${postId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
