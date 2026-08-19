import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Layout route for /demo/* pages.
 * No auth guard — demo pages are intentionally public for isolated testing.
 */
export const Route = createFileRoute("/demo")({
  component: () => <Outlet />,
});
