/**
 * emitEvent — fire-and-forget session event recorder.
 *
 * Inserts one row into `session_events` for every meaningful student action:
 *   'started'     — simulation or formula lab opened
 *   'answered'    — student tapped/submitted an answer
 *   'completed'   — simulation or formula completed correctly
 *   'asked_tutor' — student sent a message in TutorChat
 *
 * Never throws. If the request fails (no auth, offline, server error) it logs
 * a warning and returns gracefully so it never disrupts the calling component.
 */

export type SessionEventType = "started" | "answered" | "completed" | "asked_tutor";

export interface EmitEventOptions {
  /** module_id from the modules table (UUID string). Defaults to "00000000-0000-0000-0000-000000000000" when unknown. */
  moduleId?: string;
  /** Free-form key→value data associated with the event. */
  payload?: Record<string, unknown>;
  /** JWT bearer token for auth (reads localStorage "token" as fallback). */
  token?: string | null;
  /** Override the API base URL. Defaults to relative "/api". */
  apiBaseUrl?: string;
}

const FALLBACK_MODULE_ID = "00000000-0000-0000-0000-000000000000";

/**
 * Resolves the bearer token: prop → localStorage → null.
 */
function resolveToken(token?: string | null): string | null {
  if (token) return token;
  if (typeof window !== "undefined") {
    return window.localStorage.getItem("token");
  }
  return null;
}

/**
 * Posts a single session event row.
 *
 * @param type    Canonical event type string.
 * @param options Optional configuration (moduleId, payload, token, apiBaseUrl).
 */
export function emitEvent(type: SessionEventType, options: EmitEventOptions = {}): void {
  // Never run on the server (SSR)
  if (typeof window === "undefined") return;

  const {
    moduleId = FALLBACK_MODULE_ID,
    payload = {},
    apiBaseUrl = "",
    token: tokenProp,
  } = options;

  const token = resolveToken(tokenProp);

  // Build URL
  const base = apiBaseUrl ? apiBaseUrl.replace(/\/$/, "") : "";
  const url = `${base}/api/session-event`;

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Fire and forget — deliberately not awaited
  fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      module_id: moduleId,
      event_type: type,
      payload,
    }),
    // Use keepalive so the request survives page unloads (e.g. 'completed' on nav away)
    keepalive: true,
  }).catch((err) => {
    // eslint-disable-next-line no-console
    console.warn("[emitEvent] Failed to record session event:", type, err);
  });
}
