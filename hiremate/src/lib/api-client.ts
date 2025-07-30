import { supabase } from './supabase'

export async function makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
  // Get the current session
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session?.access_token) {
    throw new Error('Authentication required')
  }

  // Add authorization header
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    ...options.headers,
  }

  return fetch(url, {
    ...options,
    headers,
  })
}