import { z } from "zod";

export const subjectSyllabusItemSchema = z.object({
  name: z.string().trim().min(1, "Subject name is required").max(120),
  syllabus: z.string().trim().max(3000).optional().default(""),
});

export const subjectSyllabusItemsSchema = z.array(subjectSyllabusItemSchema).max(20);

export type SubjectSyllabusItemInput = z.infer<typeof subjectSyllabusItemSchema>;

export type NormalizedSubjectSyllabusItem = {
  name: string;
  syllabus: string;
  topics: string[];
};

export function parseSyllabusTopics(text?: string) {
  return (text || "")
    .split("\n")
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}

export function normalizeSubjectSyllabus(doc: {
  subjectSyllabusItems?: Array<{ name?: string; syllabus?: string } | null> | null;
  subjectSyllabus?: string | null;
}): NormalizedSubjectSyllabusItem[] {
  const rawItems = doc.subjectSyllabusItems;
  if (Array.isArray(rawItems) && rawItems.length > 0) {
    return rawItems
      .filter((item): item is { name?: string; syllabus?: string } => Boolean(item))
      .map((item) => {
        const name = (item.name || "").trim();
        const syllabus = (item.syllabus || "").trim();
        return {
          name,
          syllabus,
          topics: parseSyllabusTopics(syllabus),
        };
      })
      .filter((item) => item.name.length > 0);
  }

  return (doc.subjectSyllabus || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((name) => ({
      name,
      syllabus: "",
      topics: [] as string[],
    }));
}

export function syncLegacySubjectSyllabus(items: SubjectSyllabusItemInput[]) {
  return items
    .map((item) => item.name.trim())
    .filter(Boolean)
    .join("\n");
}

export function parseSubjectSyllabusItems(raw: unknown): SubjectSyllabusItemInput[] {
  if (Array.isArray(raw)) {
    return subjectSyllabusItemsSchema.parse(raw);
  }
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return subjectSyllabusItemsSchema.parse(parsed);
  } catch {
    return [];
  }
}

export function sanitizeSubjectSyllabusItems(items: SubjectSyllabusItemInput[]) {
  return subjectSyllabusItemsSchema.parse(
    items
      .map((item) => ({
        name: item.name.trim(),
        syllabus: (item.syllabus || "").trim(),
      }))
      .filter((item) => item.name.length > 0)
  );
}
