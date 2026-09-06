interface BillingQuotation { id: string; customerId: string }
interface BillingLine {
  type: 'ONE_TIME' | 'RECURRING'; productId: string; description: string; quantity: number;
  unitPrice: string | number; netAmount: string | number; cycle?: string;
}

export function generateInvoiceFromQuotation(quotation: BillingQuotation, lines: BillingLine[]) {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = `INV-${dateStr}-${randNum}`;

  const invoiceLines = [];
  const billingSchedule = [];

  for (const line of lines) {
    if (line.type === 'ONE_TIME') {
      invoiceLines.push({
        productId: line.productId,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        netAmount: line.netAmount
      });
    } else if (line.type === 'RECURRING') {
      billingSchedule.push({
        productId: line.productId,
        cycle: line.cycle,
        amount: line.netAmount,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next month roughly
      });
      
      // Initial invoice line for first cycle
      invoiceLines.push({
        productId: line.productId,
        description: `${line.description} (Initial Cycle)`,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        netAmount: line.netAmount
      });
    }
  }

  return {
    invoice: {
      invoiceNumber,
      quotationId: quotation.id,
      customerId: quotation.customerId,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      totalAmount: invoiceLines.reduce((sum, l) => sum + Number(l.netAmount || 0), 0),
      lines: invoiceLines
    },
    billingSchedule
  };
}
