import { NextResponse } from 'next/server';

export class BusinessError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(message: string, code: string, status = 400, details?: unknown) {
    super(message);
    this.name = 'BusinessError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class ValidationError extends BusinessError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthorizationError extends BusinessError {
  constructor(message: string = 'Not authorized', status = 403) {
    super(message, 'AUTHORIZATION_ERROR', status);
    this.name = 'AuthorizationError';
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof BusinessError) {
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status: error.status }
    );
  }
  
  console.error('Unhandled Error:', error);
  return NextResponse.json(
    { error: 'Internal server error', code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}

export const errorResponse = handleApiError;
