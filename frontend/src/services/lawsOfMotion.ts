import type {
  LawAnalyticsSnapshot,
  LawChallenge,
  LawGenerationResponse,
  LawKey,
  LawQuizQuestion,
  LawSimulationConfig,
  LawTutorResponse,
  LearningMode,
  LawWhatIfResponse,
} from "@/types/lawsOfMotion";
import { getApiUrl } from "@/config/api";
import { joinUrl } from "@/utils/urlUtils";
import { useAuthStore } from "@/stores/authStore";

function getRequestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = useAuthStore.getState().token;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

class LawsOfMotionService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = getApiUrl("");
  }

  async generateSimulation(
    prompt: string,
    law: LawKey,
    learningMode: LearningMode,
    context?: string,
  ): Promise<LawGenerationResponse> {
    try {
      const response = await fetch(joinUrl(this.apiBaseUrl, "/api/laws-of-motion/generate"), {
        method: "POST",
        headers: getRequestHeaders(),
        body: JSON.stringify({ prompt, law_key: law, learning_mode: learningMode, context }),
      });

      const data = (await response.json()) as LawGenerationResponse;

      if (!response.ok) {
        return { success: false, error: data.error || `API error: ${response.status}` };
      }

      return data;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Network error" };
    }
  }

  async askTutor(
    question: string,
    law: LawKey,
    learningMode: LearningMode,
    context?: string,
  ): Promise<LawTutorResponse> {
    try {
      const response = await fetch(joinUrl(this.apiBaseUrl, "/api/laws-of-motion/tutor"), {
        method: "POST",
        headers: getRequestHeaders(),
        body: JSON.stringify({ question, law_key: law, learning_mode: learningMode, context }),
      });

      return (await response.json()) as LawTutorResponse;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Network error" };
    }
  }

  async generateChallenge(
    law: LawKey,
    learningMode: LearningMode,
    context?: string,
  ): Promise<{ success: boolean; challenge?: LawChallenge; error?: string }> {
    try {
      const response = await fetch(joinUrl(this.apiBaseUrl, "/api/laws-of-motion/challenge"), {
        method: "POST",
        headers: getRequestHeaders(),
        body: JSON.stringify({ law_key: law, learning_mode: learningMode, context }),
      });

      return await response.json();
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Network error" };
    }
  }

  async generateQuiz(
    law: LawKey,
    learningMode: LearningMode,
    context?: string,
  ): Promise<{ success: boolean; quiz?: LawQuizQuestion[]; error?: string }> {
    try {
      const response = await fetch(joinUrl(this.apiBaseUrl, "/api/laws-of-motion/quiz"), {
        method: "POST",
        headers: getRequestHeaders(),
        body: JSON.stringify({ law_key: law, learning_mode: learningMode, context }),
      });

      return await response.json();
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Network error" };
    }
  }

  async analyzeLearning(
    law: LawKey,
    payload: Record<string, unknown>,
  ): Promise<{ success: boolean; analytics?: LawAnalyticsSnapshot; error?: string }> {
    try {
      const response = await fetch(joinUrl(this.apiBaseUrl, "/api/laws-of-motion/analytics"), {
        method: "POST",
        headers: getRequestHeaders(),
        body: JSON.stringify({ law_key: law, profile: payload }),
      });

      return await response.json();
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Network error" };
    }
  }

  async explainWhatIf(
    law: LawKey,
    prompt: string,
    learningMode: LearningMode,
    context?: string,
  ): Promise<{ success: boolean; whatIf?: LawWhatIfResponse; error?: string }> {
    try {
      const response = await fetch(joinUrl(this.apiBaseUrl, "/api/laws-of-motion/what-if"), {
        method: "POST",
        headers: getRequestHeaders(),
        body: JSON.stringify({ law_key: law, prompt, learning_mode: learningMode, context }),
      });

      return await response.json();
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Network error" };
    }
  }

  async getCatalog(): Promise<{
    success: boolean;
    laws?: Array<Pick<LawSimulationConfig, "law" | "title" | "subtitle" | "formula">>;
    error?: string;
  }> {
    try {
      const response = await fetch(joinUrl(this.apiBaseUrl, "/api/laws-of-motion/catalog"), {
        headers: getRequestHeaders(),
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Network error" };
    }
  }
}

export const lawsOfMotionService = new LawsOfMotionService();
