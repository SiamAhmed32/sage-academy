import "server-only";

import type { AuthUser } from "@/lib/auth";
import type { GridRequest, GridResponse } from "@/lib/grid/query";

export type GridSource = {
  /** "staff" = managers and above, "admin" = admins only. */
  access: "staff" | "admin";
  run: (request: GridRequest, user: AuthUser) => Promise<GridResponse<unknown>>;
};

type Loader = () => Promise<GridSource>;

// Each table's server query lives in its own file, loaded only when asked for.
const SOURCES: Record<string, Loader> = {
  "academy-students": async () => (await import("./sources/academy")).studentsSource,
  "academy-batches": async () => (await import("./sources/academy")).batchesSource,
  "academy-subjects": async () => (await import("./sources/academy")).subjectsSource,
  "academy-classes": async () => (await import("./sources/academy")).classesSource,
  "academy-dues": async () => (await import("./sources/academy")).duesSource,
  "academy-receipts": async () => (await import("./sources/academy")).receiptsSource,
  admissions: async () => (await import("./sources/leads")).admissionsSource,
  contacts: async () => (await import("./sources/leads")).contactsSource,
  "free-class-leads": async () => (await import("./sources/leads")).freeClassLeadsSource,
  "assessment-registrations": async () => (await import("./sources/leads")).assessmentRegistrationsSource,
  "quiz-leads": async () => (await import("./sources/leads")).quizLeadsSource,
  teachers: async () => (await import("./sources/content")).teachersSource,
  users: async () => (await import("./sources/content")).usersSource,
  notices: async () => (await import("./sources/content")).noticesSource,
  "promotion-cards": async () => (await import("./sources/content")).promotionCardsSource,
  testimonials: async () => (await import("./sources/content")).testimonialsSource,
  "website-batches": async () => (await import("./sources/content")).websiteBatchesSource,
  "student-subjects": async () => (await import("./sources/student")).studentSubjectsSource,
  "student-dues": async () => (await import("./sources/student")).studentDuesSource,
  "student-receipts": async () => (await import("./sources/student")).studentReceiptsSource,
  "student-activity": async () => (await import("./sources/student")).studentActivitySource,
  exams: async () => (await import("./sources/assessments")).examsSource,
  "model-tests": async () => (await import("./sources/assessments")).modelTestsSource,
  "quiz-questions": async () => (await import("./sources/assessments")).quizQuestionsSource,
  "exam-programs": async () => (await import("./sources/exam-hub")).examProgramsSource,
  "exam-enrollments": async () => (await import("./sources/exam-hub")).examEnrollmentsSource,
  "exam-attempts": async () => (await import("./sources/exam-hub")).examAttemptsSource,
  "exam-questions": async () => (await import("./sources/exam-hub")).examQuestionsSource,
};

export async function getGridSource(name: string): Promise<GridSource | null> {
  const loader = SOURCES[name];
  return loader ? loader() : null;
}
