import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { User, UserRole, AgeTier } from "@edusim/shared-types";

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  
  // Actions
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  loginWithGoogle: (idToken: string) => Promise<boolean>;
  register: (data: { name: string; email: string; password: string; role?: UserRole; age_tier?: AgeTier }) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  
  // OTP Verification
  sendOtp: (countryCode: string, mobileNumber: string) => Promise<boolean>;
  verifyOtp: (mobileNumber: string, otpCode: string) => Promise<boolean>;
  
  // Password Reset & Email Verification
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<boolean>;
  setHasHydrated: (hydrated: boolean) => void;
}

const authStorage =
  typeof window !== "undefined"
    ? createJSONStorage<any>(() => localStorage)
    : undefined;

const TOKEN_STORAGE_KEY = "token";

const syncLegacyToken = (token: string | null) => {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,

      setHasHydrated: (hydrated) => {
        set({ hasHydrated: hydrated });
      },

      login: async ({ email, password }) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          const session = data.session;
          if (!session) throw new Error("No session returned");

          // Retrieve user profile details from public.users table
          const { data: profile } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          const userObj: User = {
            id: session.user.id,
            email: session.user.email!,
            name: profile?.name || session.user.user_metadata?.name || "",
            role: (profile?.role || session.user.user_metadata?.role || "student") as UserRole,
            age_tier: (profile?.age_tier || session.user.user_metadata?.age_tier || "primary") as AgeTier,
            class_id: profile?.class_id || null,
            institution_id: profile?.institution_id || null,
            board: profile?.board || null,
            created_at: profile?.created_at || session.user.created_at,
          };

          set({
            user: userObj,
            token: session.access_token,
            refreshToken: session.refresh_token,
            isAuthenticated: true,
            isLoading: false,
          });
          syncLegacyToken(session.access_token);
          toast.success("Logged in successfully");
          return true;
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.message || "Invalid email or password");
          return false;
        }
      },

      loginWithGoogle: async (idToken) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: idToken,
          });

          if (error) throw error;

          const session = data.session;
          if (!session) throw new Error("No session returned");

          const { data: profile } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          const userObj: User = {
            id: session.user.id,
            email: session.user.email!,
            name: profile?.name || session.user.user_metadata?.name || "",
            role: (profile?.role || session.user.user_metadata?.role || "student") as UserRole,
            age_tier: (profile?.age_tier || session.user.user_metadata?.age_tier || "primary") as AgeTier,
            class_id: profile?.class_id || null,
            institution_id: profile?.institution_id || null,
            board: profile?.board || null,
            created_at: profile?.created_at || session.user.created_at,
          };

          set({
            user: userObj,
            token: session.access_token,
            refreshToken: session.refresh_token,
            isAuthenticated: true,
            isLoading: false,
          });
          syncLegacyToken(session.access_token);
          return true;
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.message || "Failed to sign in with Google");
          return false;
        }
      },

      register: async ({ name, email, password, role, age_tier }) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
                role: role || "student",
                age_tier: age_tier || "primary",
              },
            },
          });

          if (error) throw error;
          toast.success("Registration successful! Please check your email to verify.");
          return true;
        } catch (error: any) {
          toast.error(error.message || "Registration failed. Please try again");
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        syncLegacyToken(null);
        toast.success("Logged out successfully");
      },

      checkAuth: async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error || !session) {
            set({ isAuthenticated: false, user: null, token: null, refreshToken: null });
            syncLegacyToken(null);
            return false;
          }

          const { data: profile } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          const userObj: User = {
            id: session.user.id,
            email: session.user.email!,
            name: profile?.name || session.user.user_metadata?.name || "",
            role: (profile?.role || session.user.user_metadata?.role || "student") as UserRole,
            age_tier: (profile?.age_tier || session.user.user_metadata?.age_tier || "primary") as AgeTier,
            class_id: profile?.class_id || null,
            institution_id: profile?.institution_id || null,
            board: profile?.board || null,
            created_at: profile?.created_at || session.user.created_at,
          };

          set({
            user: userObj,
            token: session.access_token,
            refreshToken: session.refresh_token,
            isAuthenticated: true,
          });
          syncLegacyToken(session.access_token);
          return true;
        } catch (e) {
          set({ isAuthenticated: false, user: null, token: null, refreshToken: null });
          syncLegacyToken(null);
          return false;
        }
      },

      sendOtp: async (countryCode, mobileNumber) => {
        set({ isLoading: true });
        try {
          const phone = `${countryCode}${mobileNumber}`;
          const { error } = await supabase.auth.signInWithOtp({ phone });
          if (error) throw error;
          set({ isLoading: false });
          return true;
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.message || "Failed to send OTP");
          return false;
        }
      },

      verifyOtp: async (mobileNumber, otpCode) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            phone: mobileNumber,
            token: otpCode,
            type: "sms",
          });
          if (error) throw error;
          
          const session = data.session;
          if (!session) throw new Error("No session returned");

          const { data: profile } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          const userObj: User = {
            id: session.user.id,
            email: session.user.email!,
            name: profile?.name || session.user.user_metadata?.name || "",
            role: (profile?.role || session.user.user_metadata?.role || "student") as UserRole,
            age_tier: (profile?.age_tier || session.user.user_metadata?.age_tier || "primary") as AgeTier,
            class_id: profile?.class_id || null,
            institution_id: profile?.institution_id || null,
            board: profile?.board || null,
            created_at: profile?.created_at || session.user.created_at,
          };

          set({
            user: userObj,
            token: session.access_token,
            refreshToken: session.refresh_token,
            isAuthenticated: true,
            isLoading: false,
          });
          syncLegacyToken(session.access_token);
          return true;
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.message || "Invalid OTP or verification failed");
          return false;
        }
      },

      forgotPassword: async (email) => {
        set({ isLoading: true });
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/login?type=recovery`,
          });
          if (error) throw error;
          set({ isLoading: false });
          toast.success("Password reset link sent to your email!");
          return true;
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.message || "Unable to send reset link");
          return false;
        }
      },

      resetPassword: async (token, newPassword) => {
        set({ isLoading: true });
        try {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) throw error;
          set({ isLoading: false });
          toast.success("Password reset successful!");
          return true;
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.message || "Unable to reset password");
          return false;
        }
      },

      verifyEmail: async (token) => {
        return true;
      },
    }),
    {
      name: "edusim-auth",
      storage: authStorage,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      version: 2,
    }
  )
);
