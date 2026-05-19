/**
 * Base application error — all custom errors extend this.
 * Carry an HTTP status code so the api-handler can respond correctly.
 */
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 400 — request body / query is malformed */
export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(message, 400, "BAD_REQUEST");
    this.name = "BadRequestError";
  }
}

/** 401 — missing or invalid credentials */
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

/** 403 — authenticated but not allowed */
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

/** 404 — resource does not exist */
export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

/** 409 — resource already exists / conflict */
export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409, "CONFLICT");
    this.name = "ConflictError";
  }
}

/** 422 — schema / zod validation failed */
export class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super(message, 422, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

/** 422 — login ok but account needs a verified-format mobile before session is issued */
export class PhoneRequiredError extends AppError {
  constructor(
    message = "আপনার অ্যাকাউন্টে সঠিক মোবাইল নেই। বাংলাদেশি ১১ ডিজিটের নম্বর দিন।"
  ) {
    super(message, 422, "PHONE_REQUIRED");
    this.name = "PhoneRequiredError";
  }
}
