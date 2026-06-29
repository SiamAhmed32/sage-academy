const MAX_PATH_LENGTH = 300;

/** Strip dangerous or junk characters from a URL path before logging or display. */
export function sanitizeRequestPath(raw: string | null | undefined) {
  if (!raw || typeof raw !== "string") return "/";

  let path = raw.trim();
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\\/g, "/");
  path = path.replace(/\/+/g, "/");
  path = path.replace(/[^\w\-/.%]/gi, "");
  path = path.replace(/\.{2,}/g, ".");

  if (path.length > MAX_PATH_LENGTH) {
    path = path.slice(0, MAX_PATH_LENGTH);
  }

  return path || "/";
}
