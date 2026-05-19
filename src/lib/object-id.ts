import mongoose from "mongoose";

export function normalizeObjectId(value: unknown) {
  if (!value) return null;
  const raw =
    typeof value === "object" && value !== null && "_id" in value
      ? (value as { _id: unknown })._id
      : value;
  const id = String(raw);
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
}
