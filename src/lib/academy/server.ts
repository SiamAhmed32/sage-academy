import "server-only";

import mongoose, { type ClientSession } from "mongoose";

import type { AuthRole } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { connectDB } from "@/lib/mongodb";
import { adminRoles, requireRole, staffRoles } from "@/lib/rbac";
import AcademyActivity from "@/models/academy/AcademyActivity";

export type Actor = { id: string; name: string };

export type ActionResult<T = undefined> =
  | { ok: true; message: string; data?: T }
  | { ok: false; message: string };

/** A user-facing failure. Its message is shown as-is in the admin panel. */
export class AcademyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AcademyError";
  }
}

function friendlyError(error: unknown): string {
  if (error instanceof AcademyError || error instanceof AppError) return error.message;
  if (error && typeof error === "object") {
    const record = error as { code?: number; name?: string; message?: string; errors?: Record<string, { message: string }> };
    if (record.code === 11000) return "That record already exists. Refresh the page and try again.";
    if (record.name === "ValidationError" && record.errors) {
      const first = Object.values(record.errors)[0];
      if (first?.message) return first.message;
    }
    if (record.name === "ZodError" && "issues" in record) {
      const issues = (record as unknown as { issues: { message: string }[] }).issues;
      if (issues[0]?.message) return issues[0].message;
    }
  }
  console.error("[academy action]", error);
  return "Something went wrong. Please try again.";
}

async function actorFor(roles: AuthRole[]): Promise<Actor> {
  const user = await requireRole(roles);
  await connectDB();
  return { id: user.id, name: user.name };
}

/**
 * Runs a server action body with auth + database + error handling.
 * `level: "staff"` = managers and above (daily work); `"admin"` = setup and money reversal.
 */
export async function runAction<T>(
  level: "staff" | "admin",
  body: (actor: Actor) => Promise<ActionResult<T>>
): Promise<ActionResult<T>> {
  try {
    const actor = await actorFor(level === "admin" ? adminRoles : staffRoles);
    return await body(actor);
  } catch (error) {
    return { ok: false, message: friendlyError(error) };
  }
}

export async function withTransaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result as T;
  } finally {
    await session.endSession();
  }
}

export async function logActivity(
  entry: {
    action: string;
    message: string;
    studentId?: string | null;
    batchId?: string | null;
    subjectId?: string | null;
  },
  actor: Actor,
  session?: ClientSession
) {
  await AcademyActivity.create(
    [
      {
        action: entry.action,
        message: entry.message,
        studentId: entry.studentId ?? null,
        batchId: entry.batchId ?? null,
        subjectId: entry.subjectId ?? null,
        by: actor,
      },
    ],
    { session }
  );
}

export function isObjectId(value: unknown): value is string {
  return typeof value === "string" && mongoose.isValidObjectId(value);
}

export function requireObjectId(value: unknown, label: string): string {
  if (!isObjectId(value)) throw new AcademyError(`Choose a valid ${label}.`);
  return value;
}

/** Plain JSON copy of lean Mongo docs (ObjectIds and Dates to strings) for client props. */
export function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
