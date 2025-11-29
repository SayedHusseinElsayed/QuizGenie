
import { supabase, isSupabaseConfigured } from './supabase';
import { UserRole, User } from '../types';

export const authService = {

  // Login
  login: async (email: string, password: string): Promise<{ user: User | null; error: string | null }> => {
    if (!isSupabaseConfigured || !supabase) {
      // Fallback for Dev Mode login check (Mock)
      const storedUser = localStorage.getItem('qura_user');
      if (storedUser) return { user: JSON.parse(storedUser), error: null };

      // Allow any login in Dev Mode for testing
      return {
        user: { id: 'dev-1', email, full_name: 'Dev User', role: UserRole.TEACHER },
        error: null
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { user: null, error: error.message };

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          // Check if user is suspended
          if (profile.is_suspended) {
            await supabase.auth.signOut();
            const reason = profile.suspension_reason || 'Please contact site admin for more information.';
            return {
              user: null,
              error: `Your account has been suspended. ${reason}`
            };
          }

          return { user: { ...profile }, error: null };
        }
      }
      return { user: null, error: "User profile not found." };
    } catch (e: any) {
      console.error("Login Error", e);
      if (e.message && e.message.includes("Failed to fetch")) {
        return { user: null, error: "Connection Failed (CORS). Please use the 'Dev Mode' toggle in the bottom left corner to switch to Local Storage." };
      }
      return { user: null, error: "Unexpected error occurred." };
    }
  },

  // Signup Teacher
  signUpTeacher: async (email: string, password: string, fullName: string): Promise<{ success: boolean; error: string | null }> => {
    if (!isSupabaseConfigured || !supabase) return { success: true, error: null }; // Mock success

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: UserRole.TEACHER },
          emailRedirectTo: window.location.origin + '/dashboard'
        }
      });

      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    } catch (e: any) {
      return { success: false, error: e.message || "Connection failed" };
    }
  },

  // Signup Student
  signUpStudent: async (email: string, password: string, fullName: string): Promise<{ success: boolean; error: string | null }> => {
    if (!isSupabaseConfigured || !supabase) return { success: true, error: null }; // Mock success

    try {
      // 1. Check invite
      const { data: isInvited, error: rpcError } = await supabase.rpc('check_is_invited', { email_input: email.toLowerCase().trim() });

      if (rpcError) return { success: false, error: "Failed to verify invitation." };
      if (!isInvited) return { success: false, error: "This email has not been invited." };

      // 2. Signup
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: UserRole.STUDENT },
          emailRedirectTo: window.location.origin + '/dashboard'
        }
      });

      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    } catch (e: any) {
      return { success: false, error: e.message || "Connection failed" };
    }
  },

  logout: async () => {
    if (isSupabaseConfigured && supabase) await supabase.auth.signOut();
  }
};
