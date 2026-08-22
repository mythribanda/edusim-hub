import { createFileRoute, Outlet } from '@tanstack/react-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const Route = createFileRoute('/teacher')({
  component: () => (
    <ProtectedRoute allowedRoles={['faculty', 'teacher', 'educator', 'admin']}>
      <Outlet />
    </ProtectedRoute>
  ),
});
