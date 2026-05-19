import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { AppError, ValidationError } from "@/lib/errors";
import { errorResponse } from "@/lib/api-response";

type RouteHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

/**
 * Wraps any API route handler with centralized error handling.
 *
 * Catches:
 *  - AppError subclasses (BadRequest, NotFound, …) → their own status + code
 *  - ZodError                                       → 422 ValidationError
 *  - Unknown errors                                 → 500 Internal Server Error
 */
export function withApiHandler(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(error.message, error.statusCode, error.code);
      }

      if (error instanceof ZodError) {
        const message = error.issues[0]?.message ?? "Validation failed";
        const ve = new ValidationError(message);
        return errorResponse(ve.message, ve.statusCode, ve.code);
      }

      if (error && typeof error === "object" && "name" in error && error.name === "ValidationError") {
        return errorResponse((error as any).message, 422, "VALIDATION_ERROR");
      }

      console.error("[API Error]", error);
      return errorResponse("Internal server error", 500, "INTERNAL_ERROR");
    }
  };
}
