import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug logging
console.log('Environment check:')
console.log('- Supabase URL:', supabaseUrl)
console.log('- Supabase Key exists:', !!supabaseAnonKey)
console.log('- All env vars:', Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC')))

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for TypeScript
export interface Profile {
  id: string
  email: string
  full_name: string
  created_at: string
}

export interface Resume {
  id: string
  user_id: string
  filename: string
  file_path: string
  parsed_data: any
  created_at: string
}

export interface Job {
  id: string
  user_id: string
  url: string
  title: string
  company: string
  location: string
  skills: string[]
  responsibilities: string[]
  qualifications: string[]
  salary: string
  raw_data: any
  created_at: string
}