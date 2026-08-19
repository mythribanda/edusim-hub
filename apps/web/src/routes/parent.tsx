import { createFileRoute } from "@tanstack/react-router";
import { ParentDashboard } from "@/institutional/pages/parent/ParentDashboard";

export const Route = createFileRoute("/parent")({
  component: ParentDashboardPage,
});

function ParentDashboardPage() {
  return <ParentDashboard />;
}
