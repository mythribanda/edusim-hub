import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "EduSim Teacher Portal",
  description: "Create and manage assignments for your students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50`}
      >
        {/* Top nav bar */}
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6 shadow-sm">
          <span className="text-sm font-extrabold text-indigo-600 tracking-tight">
            📚 EduSim Teacher Portal
          </span>
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-indigo-600 font-medium transition-colors"
          >
            Home
          </Link>
          <Link
            href="/assignments"
            className="text-sm text-gray-600 hover:text-indigo-600 font-medium transition-colors"
          >
            Create Assignment
          </Link>
          <Link
            href="/assignments/grading"
            className="text-sm text-gray-600 hover:text-indigo-600 font-medium transition-colors"
          >
            Grade Submissions
          </Link>
          <Link
            href="/monitoring"
            className="text-sm text-gray-600 hover:text-indigo-600 font-medium transition-colors"
          >
            Class Monitor
          </Link>
          <Link
            href="/feed"
            className="text-sm text-gray-600 hover:text-indigo-600 font-medium transition-colors"
          >
            Class Feed
          </Link>
          <Link
            href="/attendance"
            className="text-sm text-gray-600 hover:text-indigo-600 font-medium transition-colors"
          >
            Attendance
          </Link>
        </nav>

        <main className="max-w-4xl mx-auto px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
