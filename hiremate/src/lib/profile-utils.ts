import { supabase } from '@/lib/supabase'

export const createUserProfile = async (user: any) => {
    try {
        // Check if profile already exists
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

        if (!existingProfile) {
            // Create profile if it doesn't exist
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
                    created_at: new Date().toISOString()
                });

            if (profileError) {
                console.error('Error creating profile:', profileError);
                return { success: false, error: profileError };
            } else {
                console.log('Profile created successfully for user:', user.id);
                return { success: true };
            }
        }

        return { success: true }; // Profile already exists
    } catch (error) {
        console.error('Error in createUserProfile:', error);
        return { success: false, error };
    }
};

export const ensureUserProfile = async (userId: string) => {
    try {
        // Get user from auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'User not authenticated' };
        }

        return await createUserProfile(user);
    } catch (error) {
        console.error('Error in ensureUserProfile:', error);
        return { success: false, error };
    }
};