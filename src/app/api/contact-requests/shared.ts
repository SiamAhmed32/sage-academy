import mongoose from "mongoose";
import { ZodError } from "zod";

import { BadRequestError, NotFoundError, ValidationError } from "@/lib/errors";
import type { ContactRequestUpdatePayload } from "@/schemas/contact-request";

export function resolveContactRequestId(id: string): string {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("Invalid contact request id");
  }

  return id;
}

export function assertContactRequestFound<T>(doc: T | null): T {
  if (!doc) throw new NotFoundError("Contact request not found");
  return doc;
}

export function throwContactRequestValidation(error: ZodError): never {
  const message = error.issues[0]?.message ?? "Validation failed";
  throw new ValidationError(message);
}

export function buildContactRequestUpdate(
  body: ContactRequestUpdatePayload
): ContactRequestUpdatePayload {
  const update: ContactRequestUpdatePayload = {};

  if (body.name !== undefined) update.name = body.name.trim();
  if (body.phone !== undefined) update.phone = body.phone.trim();
  if (body.message !== undefined) update.message = body.message.trim();
  if (body.source !== undefined) update.source = body.source.trim();
  if (body.status !== undefined) update.status = body.status;
  if (body.isRead !== undefined) update.isRead = body.isRead;
  if (body.adminNote !== undefined) update.adminNote = body.adminNote.trim();

  return update;
}
