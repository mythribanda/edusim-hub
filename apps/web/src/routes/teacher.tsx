import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/teacher')({
  beforeLoad: ({ location }) => {
    // Avoid redirect loops if we are already navigating to the login page
    if (location.pathname === "/teacher/login") {
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("teacher_token") : null;
    const userStr = typeof window !== "undefined" ? localStorage.getItem("teacher_user") : null;
    const user = userStr ? JSON.parse(userStr) : null;
    const allowedRoles = ["faculty", "teacher", "educator", "admin", "superadmin"];

    if (!token || !user || !allowedRoles.includes(user.role)) {
      const loginUrl = import.meta.env.VITE_TEACHER_LOGIN_URL || "/teacher/login";

      if (loginUrl.startsWith("http://") || loginUrl.startsWith("https://")) {
        if (typeof window !== "undefined") {
          window.location.href = `${loginUrl}?redirect=${encodeURIComponent(location.href)}`;
        }
        throw redirect({
          to: "/teacher/login",
          search: {
            redirect: undefined,
            error: undefined,
          },
        });
      } else {
        throw redirect({
          to: loginUrl as any,
          search: {
            redirect: location.pathname,
            error: undefined,
          } as any,
        });
      }
    }
  },
  component: () => <Outlet />,
});
