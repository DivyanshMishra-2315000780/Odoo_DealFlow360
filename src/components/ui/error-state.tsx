import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load enterprise data',
  message,
  onRetry,
}) => {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-900 shadow-enterprise">
      <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold">{title}</h4>
        <p className="mt-0.5 text-rose-700 leading-relaxed">{message}</p>
        {onRetry && (
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={onRetry} className="bg-white border-rose-300 text-rose-800 hover:bg-rose-50">
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
