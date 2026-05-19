import { NextResponse } from "next/server";

type SuccessPayload<T> = {
  success: true;
  message: string;
  data?: T;
};

type ErrorPayload = {
  success: false;
  message: string;
  code?: string;
};

/** Standard success response */
export function successResponse<T>(
  data: T,
  message: string,
  status: 200 | 201 | 204 = 200
) {
  const body: SuccessPayload<T> = { success: true, message, data };
  return NextResponse.json(body, { status });
}

/** Standard error response — used internally by withApiHandler */
export function errorResponse(message: string, status: number, code?: string) {
  const body: ErrorPayload = { success: false, message, ...(code && { code }) };
  return NextResponse.json(body, { status });
}
