"use client";

const SESSION_KEY = "sage_eng_session_v1";
const SEEN_ADMISSION_VIEW = "sage_eng_seen_admission_v1";
const SEEN_FORM_START = "sage_eng_seen_form_start_v1";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `sg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `fb-${Date.now()}`;
  }
}

let identityCache: { email: string; phone: string } | null = null;
let identityPromise: Promise<void> | null = null;

async function ensureIdentity(): Promise<void> {
  if (identityCache) return;
  if (!identityPromise) {
    identityPromise = fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { success?: boolean; user?: { email?: string; phone?: string } } | null) => {
        if (data?.success && data.user?.email) {
          identityCache = {
            email: data.user.email ?? "",
            phone: data.user.phone ?? "",
          };
        } else {
          identityCache = { email: "", phone: "" };
        }
      })
      .catch(() => {
        identityCache = { email: "", phone: "" };
      });
  }
  await identityPromise;
}

export type TrackEngagementArgs = {
  eventType: "admission_page_view" | "admission_form_started" | "cta_click";
  label?: string;
  path?: string;
  /** Dedupe within browser tab session */
  oncePerSession?: "admission_view" | "form_start";
};

export async function trackEngagementEvent(payload: TrackEngagementArgs): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    if (payload.oncePerSession === "admission_view") {
      if (sessionStorage.getItem(SEEN_ADMISSION_VIEW)) return;
      sessionStorage.setItem(SEEN_ADMISSION_VIEW, "1");
    }
    if (payload.oncePerSession === "form_start") {
      if (sessionStorage.getItem(SEEN_FORM_START)) return;
      sessionStorage.setItem(SEEN_FORM_START, "1");
    }
  } catch {
    /* sessionStorage blocked */
  }

  await ensureIdentity();

  const body = {
    eventType: payload.eventType,
    sessionId: getSessionId(),
    path: payload.path ?? window.location.pathname,
    label: payload.label ?? "",
    referrer: typeof document !== "undefined" ? document.referrer ?? "" : "",
    contactEmail: identityCache?.email ?? "",
    contactPhone: identityCache?.phone ?? "",
  };

  try {
    await fetch("/api/engagement-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    /* offline / blocked */
  }
}
