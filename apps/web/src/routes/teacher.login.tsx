import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, Loader2, Users, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/teacher/login")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: (search.redirect as string) || undefined,
      error: (search.error as string) || undefined,
    };
  },
  component: TeacherLogin,
});

function TeacherLogin() {
  const { redirect, error: queryError } = Route.useSearch() as any;
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(queryError || "");

  // Clear query error when typing
  useEffect(() => {
    if (queryError) {
      setErrorMsg(queryError);
    }
  }, [queryError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Email and password are required.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        throw error;
      }

      if (!data.session || !data.user) {
        throw new Error("No session returned from authentication.");
      }

      // 2. Fetch public user profile to verify role
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
      }

      const role = profile?.role || data.user.user_metadata?.role || "student";
      const allowedRoles = ["faculty", "teacher", "educator", "admin", "superadmin"];

      if (!allowedRoles.includes(role)) {
        // Not a teacher/admin! Sign out and reject.
        await supabase.auth.signOut();
        setErrorMsg("Access denied. This login is only for teachers and educators.");
        setIsLoading(false);
        return;
      }

      // 3. Save teacher credentials independently in localStorage
      localStorage.setItem("teacher_token", data.session.access_token);
      localStorage.setItem(
        "teacher_user",
        JSON.stringify({
          id: data.user.id,
          email: data.user.email!,
          name: profile?.name || data.user.user_metadata?.name || "",
          role: role,
          institution_id: profile?.institution_id || null,
          class_id: profile?.class_id || null,
        })
      );

      toast.success("Welcome back, Teacher!");
      
      // 4. Redirect
      const destination = redirect || "/teacher/assignments";
      navigate({ to: destination as any });
    } catch (err: any) {
      console.error("Login error:", err);
      setErrorMsg(err.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white mb-2">
            <Users className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Teacher Portal</h1>
          <p className="text-sm text-slate-400">Sign in to your educator account</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="name@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-10 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm py-3 rounded-2xl transition-colors shadow-lg shadow-indigo-600/20 flex items-center justify-center cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-400 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Student App
          </Link>
        </div>
      </div>
    </div>
  );
}
