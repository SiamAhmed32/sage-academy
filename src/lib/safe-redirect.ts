/** Allow only same-site relative paths (blocks open redirects). */
export function sanitizeRedirectPath(next: string | null | undefined, fallback: string) {
  if (!next) return fallback;
  const path = next.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  return path;
}
