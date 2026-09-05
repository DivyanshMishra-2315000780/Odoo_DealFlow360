import { PortalSidebar } from '@/components/layout/PortalSidebar';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full bg-background overflow-hidden">
      <PortalSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Minimal portal header */}
        <header className="flex h-16 shrink-0 items-center border-b bg-background px-6 shadow-sm justify-between">
          <span className="text-sm text-muted-foreground">Customer Portal</span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-foreground">Acme Corp</span>
            <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">A</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          {children}
        </main>
      </div>
    </div>
  );
}
