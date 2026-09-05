import { createHash, timingSafeEqual } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import type { AuthenticatedUser } from './types';

const ACCESS_COOKIE = 'df360_access';
const REFRESH_COOKIE = 'df360_refresh';
const ISSUER = 'dealflow360';
const AUDIENCE = 'dealflow360-api';
export const ACCESS_TOKEN_TTL_SECONDS = 10 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

function secret(name: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET') {
  const configured = process.env[name];
  if (configured) return configured;
  if (process.env.NODE_ENV === 'production') throw new Error(`${name} is required in production`);
  return `dealflow360-dev-${name.toLowerCase()}-change-me`;
}

interface AccessClaims extends AuthenticatedUser { type: 'access' }
interface RefreshClaims { type: 'refresh'; userId: string; sessionId: string; jti: string }

export function signAccessToken(user: AuthenticatedUser) {
  return jwt.sign({ ...user, type: 'access' } satisfies AccessClaims, secret('JWT_ACCESS_SECRET'), {
    algorithm: 'HS256', expiresIn: ACCESS_TOKEN_TTL_SECONDS, issuer: ISSUER, audience: AUDIENCE,
  });
}

export function signRefreshToken(userId: string, sessionId: string, tokenId: string) {
  return jwt.sign({ type: 'refresh', userId, sessionId } satisfies Omit<RefreshClaims, 'jti'>, secret('JWT_REFRESH_SECRET'), {
    algorithm: 'HS256', expiresIn: REFRESH_TOKEN_TTL_SECONDS, issuer: ISSUER, audience: AUDIENCE, jwtid: tokenId,
  });
}

export function verifyAccessToken(token: string): AuthenticatedUser {
  const claims = jwt.verify(token, secret('JWT_ACCESS_SECRET'), {
    algorithms: ['HS256'], issuer: ISSUER, audience: AUDIENCE,
  }) as AccessClaims;
  if (claims.type !== 'access' || !claims.sessionId) throw new Error('Invalid access token');
  return claims;
}

export function verifyRefreshToken(token: string): RefreshClaims {
  const claims = jwt.verify(token, secret('JWT_REFRESH_SECRET'), {
    algorithms: ['HS256'], issuer: ISSUER, audience: AUDIENCE,
  }) as RefreshClaims;
  if (claims.type !== 'refresh' || !claims.jti || !claims.sessionId) throw new Error('Invalid refresh token');
  return claims;
}

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export function tokenHashesMatch(left: string, right: string) {
  const a = Buffer.from(left, 'hex');
  const b = Buffer.from(right, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function readAccessToken() {
  const authorization = (await headers()).get('authorization');
  if (authorization?.startsWith('Bearer ')) return authorization.slice(7);
  return (await cookies()).get(ACCESS_COOKIE)?.value ?? null;
}

export async function readRefreshToken() {
  return (await cookies()).get(REFRESH_COOKIE)?.value ?? null;
}

export async function setTokenCookies(accessToken: string, refreshToken: string) {
  const store = await cookies();
  const secure = process.env.NODE_ENV === 'production';
  store.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true, secure, sameSite: 'strict', path: '/', maxAge: ACCESS_TOKEN_TTL_SECONDS,
  });
  store.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true, secure, sameSite: 'strict', path: '/api/auth', maxAge: REFRESH_TOKEN_TTL_SECONDS,
  });
}

export async function clearTokenCookies() {
  const store = await cookies();
  const secure = process.env.NODE_ENV === 'production';
  store.set(ACCESS_COOKIE, '', { httpOnly: true, secure, sameSite: 'strict', path: '/', maxAge: 0 });
  store.set(REFRESH_COOKIE, '', { httpOnly: true, secure, sameSite: 'strict', path: '/api/auth', maxAge: 0 });
}
