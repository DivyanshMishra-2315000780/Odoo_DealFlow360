import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

export interface TimelineStep {
  id: string;
  title: string;
  description?: string;
  date?: string;
  status: 'COMPLETED' | 'CURRENT' | 'UPCOMING' | 'REJECTED';
}

interface TimelineProps {
  steps: TimelineStep[];
  className?: string;
}

export function Timeline({ steps, className }: TimelineProps) {
  return (
    <div className={cn("flow-root", className)}>
      <ul role="list" className="-mb-8">
        {steps.map((step, stepIdx) => (
          <li key={step.id}>
            <div className="relative pb-8">
              {stepIdx !== steps.length - 1 ? (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-border"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-card",
                      step.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-600" :
                      step.status === 'CURRENT' ? "bg-primary/20 text-primary border-2 border-primary" :
                      step.status === 'REJECTED' ? "bg-red-100 text-red-600" :
                      "bg-muted text-muted-foreground"
                    )}
                  >
                    {step.status === 'COMPLETED' ? <CheckCircle2 className="h-5 w-5" /> :
                     step.status === 'REJECTED' ? <XCircle className="h-5 w-5" /> :
                     step.status === 'CURRENT' ? <Clock className="h-5 w-5" /> :
                     <div className="h-2.5 w-2.5 rounded-full bg-current" />}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className={cn("text-sm font-medium", step.status === 'UPCOMING' ? "text-muted-foreground" : "text-foreground")}>
                      {step.title}
                    </p>
                    {step.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
                    )}
                  </div>
                  {step.date && (
                    <div className="whitespace-nowrap text-right text-sm text-muted-foreground">
                      <time dateTime={step.date}>{new Date(step.date).toLocaleDateString()}</time>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
