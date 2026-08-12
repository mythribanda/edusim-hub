import { createFileRoute, Outlet } from '@tanstack/react-router'
import { RoleLayout } from '@/components/layout/RoleLayout'

export const Route = createFileRoute('/institutional')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <RoleLayout>
      <Outlet />
    </RoleLayout>
  )
}
