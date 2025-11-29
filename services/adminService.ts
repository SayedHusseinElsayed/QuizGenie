import { supabase, isSupabaseConfigured } from './supabase';
import { User } from '../types';

interface PlatformStatistics {
    totalUsers: number;
    totalTeachers: number;
    totalStudents: number;
    totalQuizzes: number;
    totalSubmissions: number;
    activeUsers: number;
    suspendedUsers: number;
}

interface UserWithStats extends User {
    quiz_count?: number;
    submission_count?: number;
    last_activity?: string;
}

export const adminService = {
    // Get all users with statistics
    getAllUsers: async (): Promise<UserWithStats[]> => {
        if (!isSupabaseConfigured || !supabase) {
            return [];
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
          *,
          quizzes:quizzes(count),
          submissions:submissions(count)
        `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching users:', error);
                return [];
            }

            return data || [];
        } catch (e) {
            console.error('Error in getAllUsers:', e);
            return [];
        }
    },

    // Get platform statistics
    getStatistics: async (): Promise<PlatformStatistics> => {
        if (!isSupabaseConfigured || !supabase) {
            return {
                totalUsers: 0,
                totalTeachers: 0,
                totalStudents: 0,
                totalQuizzes: 0,
                totalSubmissions: 0,
                activeUsers: 0,
                suspendedUsers: 0
            };
        }

        try {
            // Get user counts
            const { count: totalUsers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            const { count: totalTeachers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'TEACHER');

            const { count: totalStudents } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'STUDENT');

            const { count: suspendedUsers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('is_suspended', true);

            // Get quiz count
            const { count: totalQuizzes } = await supabase
                .from('quizzes')
                .select('*', { count: 'exact', head: true });

            // Get submission count
            const { count: totalSubmissions } = await supabase
                .from('submissions')
                .select('*', { count: 'exact', head: true });

            // Get active users (logged in within last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { count: activeUsers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .gte('last_sign_in_at', sevenDaysAgo.toISOString());

            return {
                totalUsers: totalUsers || 0,
                totalTeachers: totalTeachers || 0,
                totalStudents: totalStudents || 0,
                totalQuizzes: totalQuizzes || 0,
                totalSubmissions: totalSubmissions || 0,
                activeUsers: activeUsers || 0,
                suspendedUsers: suspendedUsers || 0
            };
        } catch (e) {
            console.error('Error getting statistics:', e);
            return {
                totalUsers: 0,
                totalTeachers: 0,
                totalStudents: 0,
                totalQuizzes: 0,
                totalSubmissions: 0,
                activeUsers: 0,
                suspendedUsers: 0
            };
        }
    },

    // Suspend user account
    suspendUser: async (userId: string, reason: string, ownerId: string): Promise<void> => {
        if (!isSupabaseConfigured || !supabase) {
            throw new Error('Supabase not configured');
        }

        // Prevent owner from suspending themselves
        if (userId === ownerId) {
            throw new Error('You cannot suspend your own account');
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    is_suspended: true,
                    suspended_at: new Date().toISOString(),
                    suspended_by: ownerId,
                    suspension_reason: reason
                })
                .eq('id', userId);

            if (error) {
                console.error('Error suspending user:', error);
                throw new Error('Failed to suspend user');
            }
        } catch (e) {
            console.error('Error in suspendUser:', e);
            throw e;
        }
    },

    // Unsuspend user account
    unsuspendUser: async (userId: string): Promise<void> => {
        if (!isSupabaseConfigured || !supabase) {
            throw new Error('Supabase not configured');
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    is_suspended: false,
                    suspended_at: null,
                    suspended_by: null,
                    suspension_reason: null
                })
                .eq('id', userId);

            if (error) {
                console.error('Error unsuspending user:', error);
                throw new Error('Failed to unsuspend user');
            }
        } catch (e) {
            console.error('Error in unsuspendUser:', e);
            throw e;
        }
    },

    // Get recent quizzes across platform
    getRecentQuizzes: async (limit: number = 10) => {
        if (!isSupabaseConfigured || !supabase) {
            return [];
        }

        try {
            const { data, error } = await supabase
                .from('quizzes')
                .select(`
          *,
          creator:profiles!quizzes_created_by_fkey(full_name, email),
          submissions:submissions(count)
        `)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error fetching recent quizzes:', error);
                return [];
            }

            return data || [];
        } catch (e) {
            console.error('Error in getRecentQuizzes:', e);
            return [];
        }
    },

    // Get recent submissions across platform
    getRecentSubmissions: async (limit: number = 10) => {
        if (!isSupabaseConfigured || !supabase) {
            return [];
        }

        try {
            const { data, error } = await supabase
                .from('submissions')
                .select(`
          *,
          student:profiles!submissions_student_id_fkey(full_name, email),
          quiz:quizzes(title)
        `)
                .order('submitted_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error fetching recent submissions:', error);
                return [];
            }

            return data || [];
        } catch (e) {
            console.error('Error in getRecentSubmissions:', e);
            return [];
        }
    }
};

export type { PlatformStatistics, UserWithStats };
