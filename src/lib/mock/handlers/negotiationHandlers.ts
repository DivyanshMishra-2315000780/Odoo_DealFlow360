import { delay } from '@/lib/api/apiClient';
import { getDB, saveDB, nextId, enrichQuote } from '@/lib/mock/db';

export const mockNegotiationHandlers = {
  async getMessages(quotationId: string) {
    await delay(300);
    const db = getDB();
    return db.negotiations.filter(n => n.quotationId === quotationId);
  },

  async sendMessage(data: { quotationId: string; message: string; authorId: string; authorName: string; authorRole: any; isInternal: boolean }) {
    await delay(400);
    const db = getDB();
    
    const newMessage = {
        id: `msg-${Date.now()}`,
        ...data,
        timestamp: new Date().toISOString()
    };
    
    db.negotiations.push(newMessage);
    saveDB();
    return newMessage;
  },

  async requestNegotiation(data: {
      quotationId: string;
      customerId: string;
      requestedDiscount?: number;
      requestedDeliveryDate?: string;
      comment: string;
  }) {
      await delay(700);
      const db = getDB();
      
      const qIdx = db.quotes.findIndex(q => q.id === data.quotationId);
      if (qIdx === -1) throw new Error('Quote not found');

      // Change quote status to NEGOTIATION
      db.quotes[qIdx] = { ...db.quotes[qIdx], status: 'NEGOTIATION', updatedAt: new Date().toISOString() };

      // Add a message representing the request
      db.negotiations.push({
          id: `msg-${Date.now()}`,
          quotationId: data.quotationId,
          authorId: data.customerId, // Using customer ID as author ID for the request
          authorName: 'Customer', // Would look up real name in practice
          authorRole: 'CUSTOMER',
          message: `Requested Changes: ${data.comment} ${data.requestedDiscount ? `(Requested Discount: ${data.requestedDiscount}%)` : ''}`,
          timestamp: new Date().toISOString(),
          isInternal: false,
      });

      // Notify Sales Exec
      db.notifications.push({
          id: `n-${Date.now()}`,
          userId: db.quotes[qIdx].salesExecutiveId,
          title: 'Customer Negotiation Request',
          message: `Customer requested changes for ${db.quotes[qIdx].quoteNumber}`,
          type: 'NEGOTIATION',
          isRead: false,
          link: `/quotes/${data.quotationId}`,
          createdAt: new Date().toISOString(),
      });

      saveDB();
      return enrichQuote(db.quotes[qIdx], db);
  }
};
