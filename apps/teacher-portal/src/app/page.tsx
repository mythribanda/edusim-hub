import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
      <div className="text-6xl">📚</div>
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
        EduSim Teacher Portal
      </h1>
      <p className="text-gray-500 max-w-md text-base">
        Create assignments for your students, link them to interactive modules,
        and track completions — all in one place.
      </p>
      <Link
        href="/assignments"
        className="mt-2 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors shadow-md"
      >
        ➕ Create an Assignment
      </Link>
    </div>
  );
}
