import { createFileRoute } from '@tanstack/react-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import UserManagement from '@/pages/admin/UserManagement';

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersRoute,
});

function AdminUsersRoute() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <UserManagement />
    </ProtectedRoute>
  );
}
