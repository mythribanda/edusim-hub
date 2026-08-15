import { createFileRoute, Link } from '@tanstack/react-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageWrapper } from '@/components/Card';
import { Play } from 'lucide-react';

export const Route = createFileRoute('/simulations/')({
  component: SimulationsPage,
});

function SimulationsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'educator', 'student']}>
      <PageWrapper>
        <div className="glass-strong rounded-3xl p-8 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Simulations Library</h1>
              <p className="text-muted-foreground text-sm max-w-xl">
                Explore and launch educational physics simulations. Select a topic to start interactive learning.
              </p>
            </div>
            <Link
              to="/simulations/create"
              className="inline-flex items-center justify-center rounded-2xl bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold hover:opacity-95 transition-opacity cursor-pointer shadow-md"
            >
              Create Simulation
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: 'projectile-motion', title: 'Projectile Motion', desc: 'Simulate forces, angles, and velocity vectors of flying projectiles.' },
            { id: 'electromagnetism', title: 'Electromagnetism Lab', desc: 'Experiment with magnetic field lines and current flow induction.' },
            { id: 'quantum-tunneling', title: 'Quantum Tunneling', desc: 'Observe particles passing through energy barrier levels.' }
          ].map((sim) => (
            <div key={sim.id} className="glass rounded-3xl p-6 border border-border flex flex-col justify-between h-52 hover:neon-border transition-all">
              <div>
                <h3 className="font-bold text-lg mb-2">{sim.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-3">{sim.desc}</p>
              </div>
              <Link
                to={`/simulation/$topic`}
                params={{ topic: sim.title }}
                className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:translate-x-1 transition-transform mt-4"
              >
                Launch Simulation <Play className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </PageWrapper>
    </ProtectedRoute>
  );
}
