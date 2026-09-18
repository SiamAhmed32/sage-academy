import { readFile, readdir, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const targets = [
  "src/app/admin",
  "src/app/api/admin",
  "src/components/admin",
  "src/constants/admin.ts",
  "src/constants/admin-display.ts",
  "src/lib/admin-dashboard.ts",
  "src/lib/admin-routine.ts",
  "src/lib/admin-notices.ts",
];
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const nonEnglishScript = /[\u0900-\u09ff]/u;
const allowMarker = "admin-language-allow";

async function sourceFiles(path) {
  const info = await stat(path);
  if (info.isFile()) return sourceExtensions.has(extname(path)) ? [path] : [];

  const entries = await readdir(path, { withFileTypes: true });
  const nested = await Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith("."))
      .map((entry) => sourceFiles(join(path, entry.name)))
  );
  return nested.flat();
}

const files = (
  await Promise.all(targets.map((target) => sourceFiles(join(root, target))))
).flat();
const failures = [];

for (const file of files) {
  const lines = (await readFile(file, "utf8")).split(/\r?\n/u);
  let allowBlock = false;
  lines.forEach((line, index) => {
    if (line.includes(`${allowMarker}-start`)) {
      allowBlock = true;
      return;
    }
    if (line.includes(`${allowMarker}-end`)) {
      allowBlock = false;
      return;
    }
    if (nonEnglishScript.test(line) && !allowBlock && !line.includes(allowMarker)) {
      failures.push(`${relative(root, file)}:${index + 1}: ${line.trim()}`);
    }
  });
}

if (failures.length) {
  console.error("Non-English Bengali/Devanagari source text remains in the admin surface:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  console.error(`\nAdd '${allowMarker}' only for intentional persisted/public content.`);
  process.exit(1);
}

console.log(`Admin language audit passed (${files.length} source files checked).`);
