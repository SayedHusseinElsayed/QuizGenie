import { supabase } from './supabase';
import { User } from '../types';

export const SUBSCRIPTION_LIMITS = {
    free: 5,
    pro: 100,
    school: Infinity
};

export const subscriptionService = {

    /**
     * Get user's current subscription details
     */
    getSubscriptionDetails: async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('subscription_tier, subscription_status, quizzes_created_this_month, billing_cycle_start')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching subscription:', error);
            return null;
        }

        return data;
    },

    /**
     * Check if user can create a new quiz based on their tier limits
     */
    canCreateQuiz: async (userId: string): Promise<{ allowed: boolean; reason?: 'limit_reached' | 'error'; currentCount?: number; limit?: number }> => {
        const details = await subscriptionService.getSubscriptionDetails(userId);

        if (!details) return { allowed: false, reason: 'error' };

        const tier = (details.subscription_tier || 'free') as keyof typeof SUBSCRIPTION_LIMITS;
        const limit = SUBSCRIPTION_LIMITS[tier];
        const currentCount = details.quizzes_created_this_month || 0;

        if (currentCount >= limit) {
            return { allowed: false, reason: 'limit_reached', currentCount, limit };
        }

        return { allowed: true, currentCount, limit };
    },

    /**
     * Increment the quiz count for the user
     */
    incrementQuizCount: async (userId: string) => {
        // First get current count to ensure atomic-like update (or use RPC if available)
        const { data } = await supabase.from('profiles').select('quizzes_created_this_month').eq('id', userId).single();
        const current = data?.quizzes_created_this_month || 0;

        const { error } = await supabase
            .from('profiles')
            .update({ quizzes_created_this_month: current + 1 })
            .eq('id', userId);

        if (error) console.error('Error incrementing quiz count:', error);
    },

    /**
     * Simulate a payment and upgrade subscription
     */
    upgradeSubscription: async (userId: string, tier: 'pro' | 'school'): Promise<{ success: boolean; error?: string }> => {
        // SIMULATE PAYMOB PAYMENT DELAY
        await new Promise(resolve => setTimeout(resolve, 2000));

        // In a real app, this would be a backend call to create a Paymob payment session
        // For this demo, we directly update the database

        const { error } = await supabase
            .from('profiles')
            .update({
                subscription_tier: tier,
                subscription_status: 'active',
                billing_cycle_start: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    }
};
