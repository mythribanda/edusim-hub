import { createFileRoute } from '@tanstack/react-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageWrapper } from '@/components/Card';
import { ShieldCheck } from 'lucide-react';

export const Route = createFileRoute('/admin/$')({
  component: AdminCatchAllPage,
});

function AdminCatchAllPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <PageWrapper>
        <div className="glass-strong rounded-3xl p-8 max-w-4xl mx-auto text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <ShieldCheck className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Administrator Panel</h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto mb-6">
            Welcome to the central administrator environment. Only administrators can view this control interface.
          </p>
          <div className="grid md:grid-cols-2 gap-4 text-left max-w-lg mx-auto">
            <div className="glass rounded-2xl p-4 border border-border">
              <h3 className="font-semibold text-sm mb-1">User Management</h3>
              <p className="text-xs text-muted-foreground">Approve new educators and manage institutional student rosters.</p>
            </div>
            <div className="glass rounded-2xl p-4 border border-border">
              <h3 className="font-semibold text-sm mb-1">Global Configuration</h3>
              <p className="text-xs text-muted-foreground">Adjust physics models, simulation tolerances, and API limits.</p>
            </div>
          </div>
        </div>
      </PageWrapper>
    </ProtectedRoute>
  );
}
