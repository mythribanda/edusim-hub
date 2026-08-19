import { useAuthStore } from "@/store/useAuthStore";
import { KidNavbar } from "./KidNavbar";
import { TeenNavbar } from "./TeenNavbar";
import { UniNavbar } from "./UniNavbar";
import { FacultyLayout } from "./FacultyLayout";
import { AdminLayout } from "./AdminLayout";
import { ParentLayout } from "./ParentLayout";

export function RoleLayout({ children }: { children?: React.ReactNode }) {
  const { user } = useAuthStore();
  
  if (!user) return <div>Loading...</div>;
  
  switch (user.role) {
    case "student":
      if (user.age_tier === "primary") return <><KidNavbar />{children}</>;
      if (user.age_tier === "middle" || user.age_tier === "high_school") return <><TeenNavbar />{children}</>;
      return <><UniNavbar />{children}</>;
    case "teacher":
      return <FacultyLayout>{children}</FacultyLayout>;
    case "admin":
    case "superadmin":
      return <AdminLayout>{children}</AdminLayout>;
    case "parent":
      return <ParentLayout>{children}</ParentLayout>;
    default:
      return <><TeenNavbar />{children}</>;
  }
}