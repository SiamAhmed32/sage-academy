"use client";

import type { GridTile } from "@/components/admin/grid/GridTiles";

export type CachedGridPage = {
  rows: unknown[];
  total: number;
  tiles?: GridTile[];
  meta?: Record<string, unknown>;
  at: number;
};

const pages = new Map<string, CachedGridPage>();
const FRESH_MS = 20_000;

export function gridCacheKey(source: string, body: Record<string, unknown>) {
  const params = body.params && typeof body.params === "object" && Object.keys(body.params as object).length > 0 ? body.params : undefined;
  return JSON.stringify({
    source,
    startRow: body.startRow ?? 0,
    endRow: body.endRow ?? 25,
    sortModel: body.sortModel ?? [],
    filterModel: body.filterModel ?? {},
    search: body.search ?? "",
    preset: body.preset ?? "",
    ...(params ? { params } : {}),
  });
}

export function readGridCache(key: string) {
  const hit = pages.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > FRESH_MS) return null;
  return hit;
}

export function writeGridCache(key: string, value: Omit<CachedGridPage, "at">) {
  pages.set(key, { ...value, at: Date.now() });
}

export function clearGridCache(source?: string) {
  if (!source) {
    pages.clear();
    return;
  }
  for (const key of pages.keys()) {
    if (key.includes(`"source":"${source}"`)) pages.delete(key);
  }
}

/** Default first page, matching a grid that has just opened. */
export function defaultGridBody(source: string) {
  return {
    source,
    startRow: 0,
    endRow: 25,
    sortModel: [],
    filterModel: {},
    search: "",
    preset: "",
    params: {},
    withTiles: true,
  };
}

const SOURCE_BY_HREF: Record<string, string> = {
  "/admin/admissions": "admissions",
  "/admin/academy/classes": "academy-classes",
  "/admin/academy/subjects": "academy-subjects",
  "/admin/academy/batches": "academy-batches",
  "/admin/teachers": "teachers",
  "/admin/academy/students": "academy-students",
  "/admin/academy/dues": "academy-dues",
  "/admin/academy/receipts": "academy-receipts",
};

const payloads = new Map<string, { body: unknown; at: number }>();
const jsonInflight = new Map<string, Promise<unknown>>();
const gridInflight = new Map<string, Promise<CachedGridPage>>();

export function readJsonCache<T>(url: string): T | null {
  const hit = payloads.get(url);
  if (!hit || Date.now() - hit.at > FRESH_MS) return null;
  return hit.body as T;
}

export function writeJsonCache(url: string, body: unknown) {
  payloads.set(url, { body, at: Date.now() });
}

/** One network request per URL, shared by hover prefetch and the page that opens. */
export function loadJson<T>(url: string): Promise<T> {
  const cached = readJsonCache<T>(url);
  if (cached) return Promise.resolve(cached);
  const pending = jsonInflight.get(url);
  if (pending) return pending as Promise<T>;
  const request = fetch(url)
    .then(async (response) => {
      if (!response.ok) throw new Error("failed");
      const body = (await response.json()) as T;
      writeJsonCache(url, body);
      return body;
    })
    .finally(() => {
      jsonInflight.delete(url);
    });
  jsonInflight.set(url, request);
  return request;
}

/**
 * One network request per table query. A later caller can abort its own wait
 * without cancelling the shared request, so a hover prefetch still fills the cache.
 */
export function loadGridPage(source: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<CachedGridPage> {
  const key = gridCacheKey(source, body);
  const cached = readGridCache(key);
  if (cached) return Promise.resolve(cached);
  let pending = gridInflight.get(key);
  if (!pending) {
    pending = fetch(`/api/admin/grid/${source}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as {
          message?: string;
          rows?: unknown[];
          total?: number;
          tiles?: CachedGridPage["tiles"];
          meta?: Record<string, unknown>;
        };
        if (!response.ok) throw new Error(data.message || "Could not load this table.");
        if (!Array.isArray(data.rows) || typeof data.total !== "number") throw new Error("Could not load this table.");
        const page: Omit<CachedGridPage, "at"> = { rows: data.rows, total: data.total, tiles: data.tiles, meta: data.meta };
        writeGridCache(key, page);
        return { ...page, at: Date.now() };
      })
      .finally(() => {
        gridInflight.delete(key);
      });
    gridInflight.set(key, pending);
  }
  if (!signal) return pending;
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(new DOMException("Aborted", "AbortError"));
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
    pending.then(
      (page) => {
        signal.removeEventListener("abort", onAbort);
        resolve(page);
      },
      (error: unknown) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      }
    );
  });
}

const JSON_BY_HREF: Record<string, string> = {
  "/admin": "/api/admin/dashboard",
  "/admin/academy/timetable": "/api/admin/timetable",
  "/admin/academy/admission": "/api/admin/admission-form",
};

function prefetchJson(url: string) {
  void loadJson(url).catch(() => undefined);
}

/** Start the table request before the click, so the page can paint from cache. */
export function prefetchAdminGrid(href: string) {
  const jsonUrl = JSON_BY_HREF[href];
  if (jsonUrl) {
    prefetchJson(jsonUrl);
    return;
  }
  const source = SOURCE_BY_HREF[href];
  if (!source) return;
  const body = defaultGridBody(source);
  const { source: _source, ...payload } = body;
  void loadGridPage(source, payload).catch(() => undefined);
}
