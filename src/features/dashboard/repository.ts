import { and, count, eq, ne } from 'drizzle-orm';
import { db } from '@/db';
import { approvalRequests, invoices, quotations, subscriptions } from '@/db/schema';

async function countRows(table: typeof quotations | typeof approvalRequests | typeof subscriptions | typeof invoices, condition?: ReturnType<typeof eq>) {
  const query = db.select({ value: count() }).from(table);
  const [row] = condition ? await query.where(condition) : await query;
  return row.value;
}

export async function dashboardCounts(userId: string, role: string) {
  const quoteCondition = role === 'CUSTOMER' ? eq(quotations.customerId, userId)
    : role === 'SALES_EXECUTIVE' ? eq(quotations.salesExecId, userId) : undefined;
  const subscriptionCondition = role === 'CUSTOMER'
    ? and(eq(subscriptions.customerId, userId), eq(subscriptions.status, 'ACTIVE'))
    : eq(subscriptions.status, 'ACTIVE');
  const invoiceCondition = role === 'CUSTOMER'
    ? and(eq(invoices.customerId, userId), ne(invoices.status, 'PAID'))
    : ne(invoices.status, 'PAID');
  const [quotes, pendingApprovals, activeSubscriptions, unpaidInvoices] = await Promise.all([
    countRows(quotations, quoteCondition),
    role === 'CUSTOMER' ? Promise.resolve(0) : countRows(approvalRequests, eq(approvalRequests.status, 'PENDING')),
    countRows(subscriptions, subscriptionCondition as ReturnType<typeof eq>),
    countRows(invoices, invoiceCondition as ReturnType<typeof eq>),
  ]);
  return { quotes, pendingApprovals, activeSubscriptions, unpaidInvoices };
}
