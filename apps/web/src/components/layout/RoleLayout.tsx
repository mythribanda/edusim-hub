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
      if (user.age_group === "kid") return <><KidNavbar />{children}</>;
      if (user.age_group === "teen") return <><TeenNavbar />{children}</>;
      return <><UniNavbar />{children}</>;
    case "faculty":
      return <FacultyLayout>{children}</FacultyLayout>;
    case "admin":
      return <AdminLayout>{children}</AdminLayout>;
    case "parent":
      return <ParentLayout>{children}</ParentLayout>;
    default:
      return <><TeenNavbar />{children}</>;
  }
}