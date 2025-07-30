'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
    const router = useRouter();

    const createUserProfile = async (user: any) => {
        try {
            console.log('Creating profile for user:', user.id, user.email);
            console.log('User metadata:', user.user_metadata);
            
            // Check if profile already exists
            const { data: existingProfile, error: selectError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .single();

            if (selectError && selectError.code !== 'PGRST116') {
                // PGRST116 is "not found" error, which is expected for new users
                console.error('Error checking existing profile:', selectError);
                return;
            }

            if (!existingProfile) {
                console.log('Profile does not exist, creating new profile...');
                
                // Create profile if it doesn't exist
                const profileData = {
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.display_name || '',
                    created_at: new Date().toISOString()
                };
                
                console.log('Inserting profile data:', profileData);
                
                const { data: insertedProfile, error: profileError } = await supabase
                    .from('profiles')
                    .insert(profileData)
                    .select();

                if (profileError) {
                    console.error('Error creating profile:', profileError);
                    console.error('Profile error details:', profileError.details, profileError.hint);
                } else {
                    console.log('Profile created successfully:', insertedProfile);
                }
            } else {
                console.log('Profile already exists for user:', user.id);
            }
        } catch (error) {
            console.error('Error in createUserProfile:', error);
        }
    };

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Get the current session after OAuth redirect
                const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                
                if (sessionError) {
                    console.error('Session error:', sessionError);
                    router.replace('/login?error=' + encodeURIComponent(sessionError.message));
                    return;
                }

                if (sessionData.session?.user) {
                    console.log('User authenticated successfully:', sessionData.session.user.email);
                    console.log('User metadata:', sessionData.session.user.user_metadata);
                    
                    // Create user profile if needed
                    await createUserProfile(sessionData.session.user);
                    
                    // Successfully authenticated - redirect to home
                    console.log('Redirecting to home...');
                    router.replace('/home');
                } else {
                    console.log('No session found, checking auth state...');
                    
                    // Listen for auth state changes as fallback
                    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                        console.log('Auth state change:', event, session?.user?.email);
                        
                        if (event === 'SIGNED_IN' && session?.user) {
                            await createUserProfile(session.user);
                            router.replace('/home');
                            subscription.unsubscribe();
                        } else if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
                            router.replace('/login');
                            subscription.unsubscribe();
                        }
                    });

                    // Clean up subscription after 10 seconds if nothing happens
                    setTimeout(() => {
                        subscription.unsubscribe();
                        router.replace('/login?error=' + encodeURIComponent('Authentication timeout'));
                    }, 10000);
                }
            } catch (err) {
                console.error('Callback error:', err);
                router.replace('/login?error=' + encodeURIComponent('Authentication failed'));
            }
        };

        // Only run the callback handler once
        handleAuthCallback();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Completing sign in...</p>
            </div>
        </div>
    );
}