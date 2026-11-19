import { CLASSES } from "@/data/curriculum";
import { getApiUrl } from "@/config/api";
import { joinUrl } from "@/utils/urlUtils";
import { fetchJsonWithRetry } from "@/services/apiClient";

export interface DBClass {
  id: number;
  name: string;
  description: string;
}

export interface DBSubject {
  id: string;
  class_id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
}

export interface DBChapter {
  id: string;
  subject_id: string;
  name: string;
  description: string;
}

export interface DBTopic {
  id: string;
  chapter_id: string;
  name: string;
  description: string;
  has_simulation: boolean;
  simulation_route: string | null;
}

export const CurriculumService = {
  getClasses: async (): Promise<DBClass[]> => {
    try {
      const url = joinUrl(getApiUrl(""), "/api/curriculum/classes");
      const remote = await fetchJsonWithRetry<DBClass[]>(url, {
        timeoutMs: 5000,
        retries: 1,
        scope: "CurriculumService.getClasses"
      });
      if (Array.isArray(remote) && remote.length > 0) {
        return remote.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description || ""
        }));
      }
    } catch (e) {
      console.warn("[CurriculumService] Backend unavailable for getClasses, falling back to local JSON:", e);
    }

    return CLASSES.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description
    }));
  },

  getSubjects: async (classId: number): Promise<DBSubject[]> => {
    try {
      const url = joinUrl(getApiUrl(""), `/api/curriculum/classes/${classId}/subjects`);
      const remote = await fetchJsonWithRetry<DBSubject[]>(url, {
        timeoutMs: 5000,
        retries: 1,
        scope: "CurriculumService.getSubjects"
      });
      if (Array.isArray(remote) && remote.length > 0) {
        return remote.map(s => ({
          id: s.id,
          class_id: s.class_id,
          code: s.code || s.id,
          name: s.name,
          description: s.description || "",
          icon: s.icon || "Book"
        }));
      }
    } catch (e) {
      console.warn(`[CurriculumService] Backend unavailable for getSubjects(${classId}), falling back to local JSON:`, e);
    }

    const cls = CLASSES.find(c => c.id === classId);
    if (!cls) return [];
    return cls.subjects.map(s => ({
      id: s.id,
      class_id: cls.id,
      code: s.id,
      name: s.name,
      description: s.description,
      icon: s.icon
    }));
  },

  getChapters: async (subjectId: string, classId?: number): Promise<DBChapter[]> => {
    try {
      const queryParam = classId ? `?class_id=${classId}` : "";
      const url = joinUrl(getApiUrl(""), `/api/curriculum/subjects/${encodeURIComponent(subjectId)}/chapters${queryParam}`);
      const remote = await fetchJsonWithRetry<DBChapter[]>(url, {
        timeoutMs: 5000,
        retries: 1,
        scope: "CurriculumService.getChapters"
      });
      if (Array.isArray(remote) && remote.length > 0) {
        return remote.map(ch => ({
          id: ch.id,
          subject_id: ch.subject_id,
          name: ch.name,
          description: ch.description || ""
        }));
      }
    } catch (e) {
      console.warn(`[CurriculumService] Backend unavailable for getChapters(${subjectId}), falling back to local JSON:`, e);
    }

    let subject: any = null;
    const normSubjectId = (subjectId || "").toLowerCase();
    for (const c of CLASSES) {
      if (classId !== undefined && c.id !== classId) continue;
      const s = c.subjects.find(sub => (sub.id || "").toLowerCase() === normSubjectId);
      if (s) {
        subject = s;
        break;
      }
    }
    if (!subject || typeof subject.chapters === 'number' || !Array.isArray(subject.chapters)) {
      return [];
    }

    return subject.chapters.map((ch: any) => ({
      id: ch.name,
      subject_id: subjectId,
      name: ch.name,
      description: ""
    }));
  },

  getTopics: async (chapterId: string, classId?: number): Promise<DBTopic[]> => {
    try {
      const url = joinUrl(getApiUrl(""), `/api/curriculum/chapters/${encodeURIComponent(chapterId)}/topics`);
      const remote = await fetchJsonWithRetry<DBTopic[]>(url, {
        timeoutMs: 5000,
        retries: 1,
        scope: "CurriculumService.getTopics"
      });
      if (Array.isArray(remote) && remote.length > 0) {
        return remote.map(t => ({
          id: t.id,
          chapter_id: t.chapter_id,
          name: t.name,
          description: t.description || "",
          has_simulation: Boolean(t.has_simulation),
          simulation_route: t.simulation_route || null
        }));
      }
    } catch (e) {
      console.warn(`[CurriculumService] Backend unavailable for getTopics(${chapterId}), falling back to local JSON:`, e);
    }

    let chapter: any = null;
    let decodedChapterId = chapterId || "";
    try {
      decodedChapterId = decodeURIComponent(chapterId);
    } catch (e) {
      // ignore decode error
    }
    const normChapterId = decodedChapterId.toLowerCase();

    for (const c of CLASSES) {
      if (classId !== undefined && c.id !== classId) continue;
      for (const s of c.subjects) {
        if (s && typeof s.chapters !== 'number' && Array.isArray(s.chapters)) {
          const ch = s.chapters.find((chap: any) => (chap.name || "").toLowerCase() === normChapterId);
          if (ch) {
            chapter = ch;
            break;
          }
        }
      }
      if (chapter) break;
    }
    if (!chapter || !Array.isArray(chapter.topics)) return [];

    return chapter.topics.map((t: any) => ({
      id: t.name,
      chapter_id: chapterId,
      name: t.name,
      description: "",
      has_simulation: t.hasSimulation || false,
      simulation_route: t.simulationRoute || null
    }));
  }
};
