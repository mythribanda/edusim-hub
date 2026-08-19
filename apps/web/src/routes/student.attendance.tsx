import { createFileRoute } from "@tanstack/react-router";
import { StudentAttendancePage } from "@/institutional/pages/attendance/StudentAttendancePage";

export const Route = createFileRoute("/student/attendance")({
  component: StudentAttendancePage,
});
