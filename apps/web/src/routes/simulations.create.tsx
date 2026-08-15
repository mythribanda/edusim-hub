import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageWrapper } from '@/components/Card';
import { useState } from 'react';

export const Route = createFileRoute('/simulations/create')({
  component: CreateSimulationPage,
});

function CreateSimulationPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Simulation "${title}" created successfully! (Simulated)`);
    navigate({ to: '/simulations' as any });
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'educator']}>
      <PageWrapper>
        <div className="glass-strong rounded-3xl p-8 max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Create New Simulation</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Define a new interactive physics simulation for students to explore.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Simulation Title</label>
              <input
                type="text"
                placeholder="e.g. Wave Interference"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl border border-border bg-card p-4 focus-ring text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                placeholder="Describe the simulation rules, physics formulas, and visual objectives."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full h-32 rounded-2xl border border-border bg-card p-4 focus-ring text-sm"
                required
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate({ to: '/simulations' as any })}
                className="flex-1 inline-flex items-center justify-center rounded-2xl border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-secondary/40 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center rounded-2xl bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold hover:opacity-95 transition-opacity cursor-pointer shadow-md"
              >
                Save Simulation
              </button>
            </div>
          </form>
        </div>
      </PageWrapper>
    </ProtectedRoute>
  );
}
