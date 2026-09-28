import { Schema } from "mongoose";

/** Fields every soft-deletable schema declares (kept inline so types stay exact). */
export const softDeleteFields = {
  deletedAt: { type: Date, default: null },
  deletedBy: { type: new Schema({ id: String, name: String }, { _id: false }), default: null },
  /** The unique value (class level, subject name) a deleted record gave up, kept for history. */
  deletedKey: { type: String, default: "" },
};

/**
 * Soft delete for academy records (class, subject, batch, student).
 *
 * "Deleting" sets `deletedAt` — the document stays in MongoDB but every
 * query hides it automatically, so it disappears from the whole app.
 * Pass `{ withDeleted: true }` as a query / aggregate option to see them.
 */
export function softDelete(schema: Schema) {
  const queryHooks = [
    "find",
    "findOne",
    "countDocuments",
    "distinct",
    "findOneAndUpdate",
    "updateOne",
    "updateMany",
  ] as const;

  for (const hook of queryHooks) {
    schema.pre(hook, function () {
      if (this.getOptions().withDeleted) return;
      if (this.getFilter().deletedAt !== undefined) return;
      this.where({ deletedAt: null });
    });
  }

  schema.pre("aggregate", function () {
    if ((this.options as { withDeleted?: boolean }).withDeleted) return;
    this.pipeline().unshift({ $match: { deletedAt: null } });
  });
}
