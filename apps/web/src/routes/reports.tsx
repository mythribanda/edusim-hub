import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/useAuthStore";
import { ReportsDashboard } from "@/pages/ReportsDashboard";
import { PageWrapper } from "@/components/Card";

export const Route = createFileRoute("/reports")({
  beforeLoad: () => {
    // 1. Get authentication status directly from store
    const { isAuthenticated } = useAuthStore.getState();

    // 2. Redirect to /login if not authenticated
    if (!isAuthenticated) {
      throw redirect({
        to: "/login",
      });
    }
  },
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <PageWrapper>
      <ReportsDashboard />
    </PageWrapper>
  );
}
