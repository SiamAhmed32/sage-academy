import type { ClientSession } from "mongoose";

import { batchCounterKey } from "@/lib/academy/codes";
import type { BatchGender, Version } from "@/lib/academy/constants";
import AcademyBatch from "@/models/academy/AcademyBatch";
import Counter, { nextSequence, peekSequence } from "@/models/academy/Counter";

type Key = { classId: string; classLevel: number; gender: BatchGender; version: Version };

/** Highest batch number already used for this class + gender + version (older codes included). */
async function lastUsed(key: Key, session?: ClientSession) {
  const last = await AcademyBatch.findOne({ classId: key.classId, gender: key.gender, version: key.version })
    .sort({ sequence: -1 })
    .select("sequence")
    .session(session ?? null)
    .lean<{ sequence?: number }>();
  return last?.sequence ?? 0;
}

/** The batch number the next save would get, without reserving it. */
export async function peekBatchSequence(key: Key) {
  return Math.max(await peekSequence(batchCounterKey(key)), (await lastUsed(key)) + 1);
}

/** Reserve the next batch number (never below what existing batches already use). */
export async function reserveBatchSequence(key: Key, session?: ClientSession) {
  const counterKey = batchCounterKey(key);
  await Counter.updateOne({ _id: counterKey }, { $max: { seq: await lastUsed(key, session) } }, { upsert: true, session });
  return nextSequence(counterKey, session);
}
