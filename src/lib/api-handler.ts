import { withTransaction } from '@/db';
import { z } from 'zod';
import { handleApiError, ValidationError } from './errors';

export async function apiHandler(operation: () => Promise<Response>): Promise<Response> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleApiError(new ValidationError('Invalid request', error.issues));
    }
    return handleApiError(error);
  }
}

export const mutationHandler = (operation: () => Promise<Response>) => apiHandler(() => withTransaction(operation));
