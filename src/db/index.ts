import { AsyncLocalStorage } from 'node:async_hooks';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
const database = drizzle({ client: pool });
type Transaction = Parameters<Parameters<typeof database.transaction>[0]>[0];
const transactions = new AsyncLocalStorage<Transaction>();
export const db: typeof database = new Proxy(database, {
  get(target, property) {
    const connection = transactions.getStore() ?? target;
    const value = Reflect.get(connection, property);
    return typeof value === 'function' ? value.bind(connection) : value;
  },
});
export async function withTransaction<T>(operation: () => Promise<T>): Promise<T> {
  if (transactions.getStore()) return operation();
  return database.transaction(async transaction => {
    // Serialize commercial writes so decisions, reservations, and balances cannot race.
    await transaction.execute(sql`select pg_advisory_xact_lock(3602026)`);
    return transactions.run(transaction, operation);
  });
}
