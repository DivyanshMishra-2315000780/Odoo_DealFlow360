import Link from 'next/link';
import { 
  ArrowRight, CheckCircle2, ShieldCheck, Zap, 
  BarChart3, Users, Building2, Package, CreditCard 
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-teal-100">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none tracking-tighter">D</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">DealFlow360</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link href="#features" className="hover:text-teal-600 transition-colors">Features</Link>
            <Link href="#workflow" className="hover:text-teal-600 transition-colors">Workflow</Link>
            <Link href="#tiers" className="hover:text-teal-600 transition-colors">Customer Tiers</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">
              Log in
            </Link>
            <Link 
              href="/signup" 
              className="text-sm font-medium bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow-sm shadow-teal-600/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-sm font-medium mb-8 border border-teal-100">
          <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
          Now with intelligent risk analysis
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
          From quotation to payment <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">
            one connected workflow.
          </span>
        </h1>
        <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
          Manage quotations, approvals, customer negotiations, fulfillment, invoices and payments from a single intelligent platform. Build for modern enterprise sales.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/signup"
            className="flex items-center gap-2 bg-teal-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/25 hover:shadow-teal-600/40 hover:-translate-y-0.5"
          >
            Start Managing Deals <ArrowRight className="w-5 h-5" />
          </Link>
          <Link 
            href="#workflow"
            className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-medium hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            Explore Platform
          </Link>
        </div>

        {/* Mockup Image/Graphic */}
        <div className="mt-20 relative mx-auto max-w-5xl">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent z-10"></div>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl p-2 md:p-4 bg-white/50 backdrop-blur-xl">
            <div className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50 aspect-[16/9] flex items-center justify-center relative">
               <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
               <div className="z-10 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl px-8">
                  {/* Abstract dashboard cards */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 col-span-2">
                    <div className="h-4 w-32 bg-slate-100 rounded mb-6"></div>
                    <div className="space-y-3">
                      <div className="h-8 w-full bg-slate-50 rounded"></div>
                      <div className="h-8 w-full bg-slate-50 rounded"></div>
                      <div className="h-8 w-3/4 bg-slate-50 rounded"></div>
                    </div>
                  </div>
                  <div className="bg-teal-600 p-6 rounded-xl shadow-lg shadow-teal-600/20 text-white flex flex-col justify-between">
                    <div>
                      <div className="text-teal-100 text-sm font-medium mb-1">Total Revenue</div>
                      <div className="text-3xl font-bold">$1.24M</div>
                    </div>
                    <div className="h-16 mt-6 bg-teal-500/50 rounded-lg"></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">The Complete Quote-to-Cash Workflow</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We've digitized every step of the enterprise sales cycle, breaking down silos between sales, finance, and fulfillment.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 md:gap-2">
            {[
              { icon: BarChart3, label: "Quotation" },
              { icon: ShieldCheck, label: "Approval" },
              { icon: Users, label: "Negotiation" },
              { icon: Package, label: "Fulfillment" },
              { icon: Building2, label: "Invoice" },
              { icon: CreditCard, label: "Payment" },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 group-hover:border-teal-200 transition-all mb-4 relative">
                  <step.icon className="w-8 h-8" />
                  {i < 5 && (
                    <ArrowRight className="hidden md:block w-5 h-5 absolute -right-5 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-teal-300" />
                  )}
                </div>
                <span className="font-medium text-slate-900">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Smart Quotations', desc: 'Create complex quotes with tier-based pricing and automated discount boundaries.', icon: Zap },
              { title: 'Risk-Based Approvals', desc: 'Auto-route approvals based on margin risk. High risk? Finance gets involved automatically.', icon: ShieldCheck },
              { title: 'Customer Portal', desc: 'Give customers a dedicated space to view quotes, negotiate, and pay invoices.', icon: Users },
              { title: 'Inventory-Aware', desc: 'Split fulfillment across multiple warehouses based on real-time inventory allocation.', icon: Package },
              { title: 'Deal Health', desc: 'AI-driven insights highlight stalled deals and anomalous discount patterns.', icon: BarChart3 },
              { title: 'Role-Based Dashboards', desc: 'Distinct, tailored experiences for Sales, Managers, Finance, Admins, and Customers.', icon: Building2 },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-6">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Tiers */}
      <section id="tiers" className="py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Intelligent Customer Prioritization</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Automatically prioritize your most valuable relationships across the entire workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { tier: 'BRONZE', title: 'Standard Priority', color: 'bg-amber-100 text-amber-800 border-amber-200' },
              { tier: 'SILVER', title: 'Elevated Priority', color: 'bg-slate-100 text-slate-700 border-slate-200' },
              { tier: 'GOLD', title: 'High Priority', color: 'bg-yellow-100 text-yellow-800 border-yellow-300 ring-4 ring-yellow-50' },
            ].map((t) => (
              <div key={t.tier} className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-200">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-6 border ${t.color}`}>
                  {t.tier}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{t.title}</h3>
                <ul className="space-y-3 text-sm text-slate-600 text-left mt-6">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500"/> Custom price lists</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500"/> Specific discount rules</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500"/> Sort priority in tables</li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-teal-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to streamline your sales workflow?</h2>
          <p className="text-xl text-teal-100 mb-10">Join the platform built for modern B2B revenue teams.</p>
          <Link 
            href="/signup"
            className="inline-flex flex-col sm:flex-row items-center gap-2 bg-white text-teal-900 px-8 py-4 rounded-xl font-bold hover:bg-teal-50 transition-colors shadow-xl"
          >
            Start Managing Deals
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 text-center border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2 mb-4">
          <div className="w-6 h-6 rounded bg-teal-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">D</span>
          </div>
          <span className="font-bold text-slate-100">DealFlow360</span>
        </div>
        <p className="text-sm">© {new Date().getFullYear()} DealFlow360. Functional Frontend Rebuild Demo.</p>
      </footer>
    </div>
  );
}
