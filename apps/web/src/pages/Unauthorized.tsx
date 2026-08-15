import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <ShieldAlert className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Access Denied
      </h1>
      <p className="mt-4 text-muted-foreground max-w-md text-sm">
        You don't have access to this page. Please contact your educator or system administrator if you believe this is an error.
      </p>
      <div className="mt-8">
        <button
          onClick={() => navigate({ to: '/dashboard' as any })}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold hover:opacity-95 transition-opacity cursor-pointer shadow-md"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
