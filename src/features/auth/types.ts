import { z } from 'zod';

export const loginInput = z.object({
  email: z.email().transform((value) => value.toLowerCase().trim()), password: z.string().min(1).max(128),
}).strict();
export const signupInput = z.object({
  email: z.email().transform((value) => value.toLowerCase().trim()),
  password: z.string().min(10).max(128)
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
  firstName: z.string().trim().min(1), lastName: z.string().trim().min(1),
  companyName: z.string().trim().min(1).optional(),
}).strict();
export const revokeSessionInput = z.object({ sessionId: z.string().uuid() }).strict();

export type LoginInput = z.infer<typeof loginInput>;
export type SignupInput = z.infer<typeof signupInput>;

export interface AuthenticatedUser {
  userId: string;
  customerId: string | null;
  email: string;
  role: 'CUSTOMER' | 'ADMIN' | 'SALES_MANAGER' | 'SALES_EXECUTIVE' | 'FINANCE_OFFICER';
  firstName: string;
  lastName: string;
  sessionId: string;
}

export interface AuthResult {
  user: AuthenticatedUser;
  accessToken: string;
  expiresIn: number;
}
