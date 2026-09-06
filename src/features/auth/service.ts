import { createHash, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';
import { BusinessError } from '@/lib/errors';
import {
  clearLoginAttempts, findActiveSession, findCustomerByUserId, findLoginAttempt, findRefreshContext, findUserByEmail,
  findUserSession, insertAuthSession, insertCustomer, insertRefreshToken, insertSignupIdentity, insertUser, listUserSessions,
  revokeAuthSession, rotateRefreshToken, saveLoginAttempt,
} from './repository';
import {
  ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS, clearTokenCookies, hashToken, readAccessToken,
  readRefreshToken, setTokenCookies, signAccessToken, signRefreshToken, tokenHashesMatch,
  verifyAccessToken, verifyRefreshToken,
} from './token';
import { loginInput, revokeSessionInput, signupInput, type AuthenticatedUser, type AuthResult } from './types';

type UserRecord = NonNullable<Awaited<ReturnType<typeof findUserByEmail>>>;
type CustomerRecord = Awaited<ReturnType<typeof findCustomerByUserId>> | null;

function authenticatedUser(user: UserRecord, customer: CustomerRecord, sessionId: string): AuthenticatedUser {
  return {
    userId: user.id, customerId: customer?.id ?? null, email: user.email, role: user.role,
    firstName: user.firstName, lastName: user.lastName, sessionId,
  };
}

async function requestMetadata() {
  const requestHeaders = await headers();
  return {
    userAgent: requestHeaders.get('user-agent'),
    ipAddress: requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ?? requestHeaders.get('x-real-ip'),
  };
}

async function createLoginSession(user: UserRecord, customer: CustomerRecord): Promise<AuthResult> {
  const sessionId = randomUUID();
  const tokenId = randomUUID();
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);
  await insertAuthSession({ id: sessionId, userId: user.id, expiresAt: refreshExpiresAt, ...(await requestMetadata()) });
  const identity = authenticatedUser(user, customer, sessionId);
  const accessToken = signAccessToken(identity);
  const refreshToken = signRefreshToken(user.id, sessionId, tokenId);
  await insertRefreshToken({ id: tokenId, sessionId, tokenHash: hashToken(refreshToken), expiresAt: refreshExpiresAt });
  await setTokenCookies(accessToken, refreshToken);
  return { user: identity, accessToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS };
}

export async function login(input: unknown) {
  const credentials = loginInput.parse(input);
  const metadata = await requestMetadata();
  const identifierHash = createHash('sha256').update(`${credentials.email}|${metadata.ipAddress ?? 'unknown'}`).digest('hex');
  const existingAttempt = await findLoginAttempt(identifierHash);
  if (existingAttempt?.blockedUntil && existingAttempt.blockedUntil > new Date()) {
    throw new BusinessError('Too many login attempts. Try again later.', 'LOGIN_RATE_LIMITED', 429);
  }
  const user = await findUserByEmail(credentials.email);
  if (!user || !(await bcrypt.compare(credentials.password, user.passwordHash))) {
    const now = new Date();
    const currentWindow = existingAttempt && now.getTime() - existingAttempt.windowStartedAt.getTime() < 15 * 60 * 1000;
    const attempts = currentWindow ? existingAttempt.attempts + 1 : 1;
    await saveLoginAttempt(identifierHash, attempts, currentWindow ? existingAttempt.windowStartedAt : now, attempts >= 5 ? new Date(now.getTime() + 15 * 60 * 1000) : null);
    throw new BusinessError('Invalid credentials', 'INVALID_CREDENTIALS', 401);
  }
  if (!user.active) {
    throw new BusinessError('Your position is not still decided by the administrator.', 'ACCOUNT_PENDING_APPROVAL', 403);
  }
  await clearLoginAttempts(identifierHash);
  return createLoginSession(user, await findCustomerByUserId(user.id));
}

export async function signup(input: unknown) {
  const values = signupInput.parse(input);
  const isInternal = values.userType === 'INTERNAL';
  const existingUser = await findUserByEmail(values.email);
  if (existingUser) {
    const existingCustomer = await findCustomerByUserId(existingUser.id);
    const canRecover = existingUser.role === 'CUSTOMER' && existingUser.active && !existingCustomer &&
      await bcrypt.compare(values.password, existingUser.passwordHash);
    if (!canRecover) throw new BusinessError('Email already in use', 'EMAIL_IN_USE', 409);
    const customer = await insertCustomer({
      id: randomUUID(), userId: existingUser.id,
      name: values.companyName ?? `${values.firstName} ${values.lastName}`,
      contactEmail: values.email, tier: 'BRONZE',
    });
    return createLoginSession(existingUser, customer);
  }
  const userId = randomUUID();
  if (isInternal) {
    // Internal user created with active = false (pending role approval) and default role SALES_EXECUTIVE
    const user = await insertUser({
      id: userId,
      email: values.email,
      passwordHash: await bcrypt.hash(values.password, 12),
      firstName: values.firstName,
      lastName: values.lastName,
      role: 'SALES_EXECUTIVE',
      active: false,
    });
    return {
      user: {
        userId: user.id,
        customerId: null,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        sessionId: '',
      },
      accessToken: '',
      expiresIn: 0,
      isPendingApproval: true,
      message: 'Your position is not still decided by the administrator.',
    };
  }

  const customerId = randomUUID();
  const identity = await insertSignupIdentity({
    id: userId, email: values.email, passwordHash: await bcrypt.hash(values.password, 12),
    firstName: values.firstName, lastName: values.lastName, role: 'CUSTOMER', active: true,
  }, {
    id: customerId, userId, name: values.companyName ?? `${values.firstName} ${values.lastName}`,
    contactEmail: values.email, tier: 'BRONZE',
  });
  return createLoginSession(identity.user, identity.customer);
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const token = await readAccessToken();
  if (!token) return null;
  try {
    const claims = verifyAccessToken(token);
    const context = await findActiveSession(claims.sessionId);
    if (!context || context.user.id !== claims.userId) return null;
    return authenticatedUser(context.user, context.customer, context.session.id);
  } catch {
    return null;
  }
}

export async function refreshSession(): Promise<AuthResult> {
  const presentedToken = await readRefreshToken();
  if (!presentedToken) throw new BusinessError('Refresh token is required', 'REFRESH_TOKEN_REQUIRED', 401);
  let claims;
  try {
    claims = verifyRefreshToken(presentedToken);
  } catch {
    await clearTokenCookies();
    throw new BusinessError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN', 401);
  }
  const context = await findRefreshContext(claims.jti);
  if (!context || context.session.id !== claims.sessionId || context.user.id !== claims.userId ||
      !tokenHashesMatch(context.token.tokenHash, hashToken(presentedToken))) {
    await clearTokenCookies();
    throw new BusinessError('Invalid refresh token', 'INVALID_REFRESH_TOKEN', 401);
  }
  if (context.token.revokedAt) {
    await revokeAuthSession(context.session.id);
    await clearTokenCookies();
    throw new BusinessError('Refresh token reuse detected', 'REFRESH_TOKEN_REUSE', 401);
  }
  if (context.session.revokedAt || context.session.expiresAt <= new Date() || context.token.expiresAt <= new Date() || !context.user.active) {
    await revokeAuthSession(context.session.id);
    await clearTokenCookies();
    throw new BusinessError('Session expired', 'SESSION_EXPIRED', 401);
  }
  const replacementId = randomUUID();
  const replacementToken = signRefreshToken(context.user.id, context.session.id, replacementId);
  await insertRefreshToken({
    id: replacementId, sessionId: context.session.id, tokenHash: hashToken(replacementToken), expiresAt: context.session.expiresAt,
  });
  if (!(await rotateRefreshToken(context.token.id, replacementId))) {
    await revokeAuthSession(context.session.id);
    await clearTokenCookies();
    throw new BusinessError('Refresh token reuse detected', 'REFRESH_TOKEN_REUSE', 401);
  }
  const identity = authenticatedUser(context.user, context.customer, context.session.id);
  const accessToken = signAccessToken(identity);
  await setTokenCookies(accessToken, replacementToken);
  return { user: identity, accessToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS };
}

export async function logout() {
  const token = await readRefreshToken();
  if (token) {
    try {
      await revokeAuthSession(verifyRefreshToken(token).sessionId);
    } catch {
      // Always clear local credentials, even when the refresh token is already invalid.
    }
  }
  await clearTokenCookies();
}

export async function getMySessions() {
  const user = await getCurrentUser();
  if (!user) throw new BusinessError('Not authenticated', 'AUTHORIZATION_ERROR', 401);
  const sessions = await listUserSessions(user.userId);
  return sessions.map((session) => ({ ...session, current: session.id === user.sessionId }));
}

export async function revokeMySession(input: unknown) {
  const user = await getCurrentUser();
  if (!user) throw new BusinessError('Not authenticated', 'AUTHORIZATION_ERROR', 401);
  const values = revokeSessionInput.parse(input);
  if (!(await findUserSession(user.userId, values.sessionId))) throw new BusinessError('Session not found', 'NOT_FOUND', 404);
  await revokeAuthSession(values.sessionId);
  if (values.sessionId === user.sessionId) await clearTokenCookies();
  return { revoked: true };
}
