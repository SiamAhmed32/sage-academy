/**
 * Client-side first-touch attribution (UTM + landing context).
 * Safe to import from client components; browser APIs are guarded.
 */

const STORAGE_KEY = "sage_lead_attr_v1";
/** 90 days — aligns with typical ad attribution windows */
const TTL_MS = 90 * 24 * 60 * 60 * 1000;

export type StoredLeadAttribution = {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  attributionReferrer: string;
  attributionLandingPath: string;
  attributionCapturedAt: string;
};

function clamp(val: string, max: number): string {
  return val.trim().slice(0, max);
}

function isStoredFresh(capturedAtIso: string): boolean {
  const t = new Date(capturedAtIso).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t >= 0 && Date.now() - t < TTL_MS;
}

/**
 * Called on route changes. Saves first-touch snapshot once (or again after TTL).
 * Does not overwrite while the stored snapshot is still within TTL.
 */
export function captureLeadAttribution(
  pathname: string,
  searchParams: URLSearchParams
): void {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredLeadAttribution>;
      if (
        parsed.attributionCapturedAt &&
        isStoredFresh(parsed.attributionCapturedAt)
      ) {
        return;
      }
    }
  } catch {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  const snapshot: StoredLeadAttribution = {
    utmSource: clamp(searchParams.get("utm_source") ?? "", 200),
    utmMedium: clamp(searchParams.get("utm_medium") ?? "", 200),
    utmCampaign: clamp(searchParams.get("utm_campaign") ?? "", 200),
    utmContent: clamp(searchParams.get("utm_content") ?? "", 200),
    utmTerm: clamp(searchParams.get("utm_term") ?? "", 200),
    attributionReferrer: clamp(window.document.referrer ?? "", 500),
    attributionLandingPath: clamp(pathname || "/", 300),
    attributionCapturedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* quota / private mode */
  }
}

/**
 * Fields to merge into contact/admission API payloads. Includes submit path (current page).
 */
export function getLeadAttributionPayload(
  submitPathname: string
): Record<string, string> {
  if (typeof window === "undefined") return {};

  const submitPath = clamp(submitPathname || "/", 300);

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { attributionSubmitPath: submitPath };
    }

    const parsed = JSON.parse(raw) as Partial<StoredLeadAttribution>;
    if (
      !parsed.attributionCapturedAt ||
      !isStoredFresh(parsed.attributionCapturedAt)
    ) {
      return { attributionSubmitPath: submitPath };
    }

    return {
      utmSource: parsed.utmSource ?? "",
      utmMedium: parsed.utmMedium ?? "",
      utmCampaign: parsed.utmCampaign ?? "",
      utmContent: parsed.utmContent ?? "",
      utmTerm: parsed.utmTerm ?? "",
      attributionReferrer: parsed.attributionReferrer ?? "",
      attributionLandingPath: parsed.attributionLandingPath ?? "",
      attributionCapturedAt: parsed.attributionCapturedAt ?? "",
      attributionSubmitPath: submitPath,
    };
  } catch {
    return { attributionSubmitPath: submitPath };
  }
}
