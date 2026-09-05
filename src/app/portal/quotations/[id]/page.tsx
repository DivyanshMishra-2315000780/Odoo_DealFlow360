'use client';

import { useParams } from 'next/navigation';
import { mockQuotes } from '@/lib/api/mockData';
import { QuoteStatusBadge } from '@/components/ui/QuoteStatusBadge';
import Link from 'next/link';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { useState } from 'react';

const NEGOTIATION_MESSAGES = [
  { id: '1', author: 'Sales Rep', date: 'Aug 20', text: 'Initial quotation shared. Please review the pricing and let us know if you have any questions.' },
  { id: '2', author: 'You', date: 'Aug 21', text: 'Can the Extended Warranty discount be 15% instead of 10%?' },
  { id: '3', author: 'Sales Rep', date: 'Aug 22', text: 'We can offer 13% on the Extended Warranty. Does that work for you?' },
];

export default function PortalQuotationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const quote = mockQuotes.find(q => q.id === id || q.quoteNumber === id);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState(NEGOTIATION_MESSAGES);
  const [submitted, setSubmitted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (!quote) return <div className="p-8 text-red-600">Quotation not found</div>;

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages(prev => [...prev, { id: String(prev.length + 1), author: 'You', date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), text: newMessage }]);
    setNewMessage('');
    setSubmitted(true);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <Link href="/portal/quotations" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Quotations
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{quote.quoteNumber}</h1>
            <QuoteStatusBadge status={quote.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Created {new Date(quote.createdAt).toLocaleDateString()} · Expires {new Date(quote.expiresAt).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Total</div>
          <div className="text-2xl font-bold text-primary">${quote.amount.toLocaleString()}</div>
        </div>
      </div>

      {submitted && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
          <div className="h-5 w-5 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
            <div className="h-2 w-2 rounded-full bg-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-blue-900">Your requested changes are being reviewed.</p>
            <p className="text-sm text-blue-700 mt-0.5">Our team will get back to you shortly with a response.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line items — customer-facing (no internal risk) */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/20 font-semibold text-foreground">Products & Pricing</div>
          <table className="w-full text-sm">
            <thead className="bg-muted/10 text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Discount</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {quote.lines.map(line => (
                <tr key={line.id} className="hover:bg-muted/10">
                  <td className="px-4 py-3 font-medium text-foreground">{line.product?.name}</td>
                  <td className="px-4 py-3 text-right">{line.quantity}</td>
                  <td className="px-4 py-3 text-right">${line.unitPrice}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{line.discountPercentage}%</td>
                  <td className="px-4 py-3 text-right font-semibold">${line.lineTotal.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Negotiation Thread */}
        <div className="rounded-xl border bg-card shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-muted/20 font-semibold text-foreground">Negotiation</div>
          <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-80">
            {messages.map(msg => {
              const isCustomer = msg.author === 'You';
              return (
                <div key={msg.id} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs rounded-xl px-4 py-3 text-sm ${
                    isCustomer ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                  }`}>
                    <div className={`text-xs font-medium mb-1 ${isCustomer ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {msg.author} · {msg.date}
                    </div>
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t p-4">
            <div className="flex gap-2">
              <textarea
                className="flex-1 rounded-md border p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={2}
                placeholder="Type your request or question..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button
                onClick={handleSendMessage}
                className="self-end rounded-md bg-primary text-primary-foreground p-2.5 hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm */}
      {!confirmed && (
        <div className="flex justify-end">
          <button
            onClick={() => setConfirmed(true)}
            className="flex items-center gap-2 rounded-md bg-emerald-600 text-white px-6 py-2.5 text-sm font-medium hover:bg-emerald-700"
          >
            <CheckCircle className="h-4 w-4" /> Confirm Quotation
          </button>
        </div>
      )}
      {confirmed && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
          <p className="font-semibold text-emerald-900">✓ Quotation Confirmed!</p>
          <p className="text-sm text-emerald-700 mt-1">Your order has been placed and our team will follow up shortly.</p>
        </div>
      )}
    </div>
  );
}
