import { Schema, model, models, type ClientSession, type Model } from "mongoose";

type CounterDoc = { _id: string; seq: number };

const CounterSchema = new Schema<CounterDoc>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { collection: "academy_counters", versionKey: false }
);

const Counter =
  (models.AcademyCounter as Model<CounterDoc>) || model<CounterDoc>("AcademyCounter", CounterSchema);

/** Atomically reserve the next number for a key. Numbers are never reused. */
export async function nextSequence(key: string, session?: ClientSession) {
  const doc = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, session }
  ).lean<CounterDoc>();
  return doc?.seq ?? 1;
}

/** The number the next `nextSequence` call would return, without reserving it. */
export async function peekSequence(key: string) {
  const doc = await Counter.findById(key).lean<CounterDoc>();
  return (doc?.seq ?? 0) + 1;
}

export default Counter;
