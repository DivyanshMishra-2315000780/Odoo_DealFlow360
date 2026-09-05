import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import { db, withTransaction } from '@/db';
import { authLoginAttempts, authSessions, customers, refreshTokens, users } from '@/db/schema';

export async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user ?? null;
}

export async function insertUser(values: typeof users.$inferInsert) {
  const [user] = await db.insert(users).values(values).returning();
  return user;
}

export async function findUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

export async function findCustomerByUserId(userId: string) {
  const [customer] = await db.select().from(customers).where(eq(customers.userId, userId)).limit(1);
  return customer ?? null;
}

export async function insertCustomer(values: typeof customers.$inferInsert) {
  const [customer] = await db.insert(customers).values(values).returning();
  return customer;
}

export async function insertSignupIdentity(
  userValues: typeof users.$inferInsert,
  customerValues: typeof customers.$inferInsert,
) {
  const [createdUsers, createdCustomers] = await withTransaction(async () => {
    const createdUsers = await db.insert(users).values(userValues).returning();
    const createdCustomers = await db.insert(customers).values(customerValues).returning();
    return [createdUsers, createdCustomers] as const;
  });
  return { user: createdUsers[0], customer: createdCustomers[0] };
}

export async function insertAuthSession(values: typeof authSessions.$inferInsert) {
  const [session] = await db.insert(authSessions).values(values).returning();
  return session;
}

export async function insertRefreshToken(values: typeof refreshTokens.$inferInsert) {
  const [token] = await db.insert(refreshTokens).values(values).returning();
  return token;
}

export async function findRefreshContext(tokenId: string) {
  const [record] = await db.select({ token: refreshTokens, session: authSessions, user: users, customer: customers })
    .from(refreshTokens)
    .innerJoin(authSessions, eq(refreshTokens.sessionId, authSessions.id))
    .innerJoin(users, eq(authSessions.userId, users.id))
    .leftJoin(customers, eq(customers.userId, users.id))
    .where(eq(refreshTokens.id, tokenId)).limit(1);
  return record ?? null;
}

export async function findActiveSession(sessionId: string) {
  const [record] = await db.select({ session: authSessions, user: users, customer: customers })
    .from(authSessions)
    .innerJoin(users, eq(authSessions.userId, users.id))
    .leftJoin(customers, eq(customers.userId, users.id))
    .where(and(
      eq(authSessions.id, sessionId), isNull(authSessions.revokedAt), gt(authSessions.expiresAt, new Date()), eq(users.active, true),
    )).limit(1);
  return record ?? null;
}

export async function rotateRefreshToken(tokenId: string, replacementId: string) {
  const [token] = await db.update(refreshTokens).set({ revokedAt: new Date(), replacedByTokenId: replacementId })
    .where(and(eq(refreshTokens.id, tokenId), isNull(refreshTokens.revokedAt))).returning();
  return token ?? null;
}

export async function revokeAuthSession(sessionId: string) {
  const now = new Date();
  await db.update(authSessions).set({ revokedAt: now, updatedAt: now })
    .where(and(eq(authSessions.id, sessionId), isNull(authSessions.revokedAt)));
  await db.update(refreshTokens).set({ revokedAt: now })
    .where(and(eq(refreshTokens.sessionId, sessionId), isNull(refreshTokens.revokedAt)));
}

export function listUserSessions(userId: string) {
  return db.select({
    id: authSessions.id, userAgent: authSessions.userAgent, ipAddress: authSessions.ipAddress,
    createdAt: authSessions.createdAt, updatedAt: authSessions.updatedAt, expiresAt: authSessions.expiresAt,
  }).from(authSessions).where(and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt)))
    .orderBy(desc(authSessions.updatedAt));
}

export async function findUserSession(userId: string, sessionId: string) {
  const [session] = await db.select().from(authSessions)
    .where(and(eq(authSessions.userId, userId), eq(authSessions.id, sessionId))).limit(1);
  return session ?? null;
}

export async function findLoginAttempt(identifierHash: string) {
  const [attempt] = await db.select().from(authLoginAttempts)
    .where(eq(authLoginAttempts.identifierHash, identifierHash)).limit(1);
  return attempt ?? null;
}

export async function saveLoginAttempt(identifierHash: string, attempts: number, windowStartedAt: Date, blockedUntil: Date | null) {
  await db.insert(authLoginAttempts).values({
    id: identifierHash, identifierHash, attempts, windowStartedAt, blockedUntil, updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: authLoginAttempts.identifierHash,
    set: { attempts, windowStartedAt, blockedUntil, updatedAt: new Date() },
  });
}

export async function clearLoginAttempts(identifierHash: string) {
  await db.delete(authLoginAttempts).where(eq(authLoginAttempts.identifierHash, identifierHash));
}
