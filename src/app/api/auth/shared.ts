import { ZodError } from "zod";

import { ValidationError } from "@/lib/errors";

export function throwAuthValidation(error: ZodError): never {
  const message = error.issues[0]?.message ?? "Validation failed";
  throw new ValidationError(message);
}
