import React from 'react';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { AlertOctagon } from 'lucide-react';
import { cn } from '../lib/utils';

// Global error fallback
function GlobalErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200 max-w-lg w-full">
        <h1 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
          <AlertOctagon className="w-6 h-6" />
          Something went wrong
        </h1>
        <pre className="text-xs font-mono text-stone-800 bg-stone-100 p-4 rounded-lg overflow-auto">
          {(error as Error)?.message}
        </pre>
        <button 
          onClick={resetErrorBoundary} 
          className="mt-4 px-4 py-2 bg-red-600 font-bold text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// Widget-level error fallback
function WidgetErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl flex flex-col items-center justify-center text-center w-full h-full min-h-[150px]">
      <AlertOctagon className="w-8 h-8 text-red-400 mb-2" />
      <p className="text-sm font-semibold text-red-800 mb-1">Widget Failed to Load</p>
      <p className="text-xs text-red-600/80 max-w-[200px] truncate mb-3">{(error as Error)?.message}</p>
      <button 
        onClick={resetErrorBoundary} 
        className="px-3 py-1.5 bg-white border border-red-200 text-red-700 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary 
      FallbackComponent={GlobalErrorFallback}
      onReset={() => window.location.reload()}
    >
      {children}
    </ReactErrorBoundary>
  );
}

export function WidgetErrorBoundary({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <ReactErrorBoundary FallbackComponent={WidgetErrorFallback}>
      <div className={cn("w-full h-full", className)}>
        {children}
      </div>
    </ReactErrorBoundary>
  );
}
