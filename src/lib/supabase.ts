
import { createClient } from '@supabase/supabase-js';

// These environment variables must be set in deployment environment
const supabaseUrl = 'https://kivpijajoxfbkmakykho.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdnBpamFqb3hmYmttYWt5a2hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3Njc3MzgsImV4cCI6MjA2MzM0MzczOH0.1WzPEFh0rzg4QntxZfWiGSicrJqij7S1WGdm6CWtgqk';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Types for our database schema
export type UserRole = 'admin' | 'staff' | 'client';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  created_at: string;
  last_sign_in?: string;
}

export interface Candidate {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  other_links?: string[];
  social_media?: Record<string, string>;
  resume_summary?: string;
  objective?: string;
  skills?: string[];
  languages?: string[];
  education?: Education[];
  experience?: WorkExperience[];
  projects?: Project[];
  publications?: Publication[];
  resume_id?: string;
  resume_url?: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive' | 'blocked' | 'unavailable';
  pipeline_stage?: string;
  assigned_to_clients?: string[];
  liked_by_clients?: string[];
  embedding?: number[];
}

export interface Education {
  institution: string;
  degree: string;
  field_of_study: string;
  start_date?: string;
  end_date?: string;
  grade?: string;
}

export interface WorkExperience {
  company: string;
  title: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  current?: boolean;
  responsibilities?: string[];
}

export interface Project {
  name: string;
  description?: string;
  technologies?: string[];
  url?: string;
  start_date?: string;
  end_date?: string;
}

export interface Publication {
  title: string;
  publisher?: string;
  date?: string;
  url?: string;
  description?: string;
}

export interface Client {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone?: string;
  address?: string;
  industry?: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive';
  assigned_candidates?: string[];
  liked_candidates?: string[];
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  location?: string;
  salary_range?: string;
  job_type: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'remote';
  status: 'draft' | 'published' | 'archived' | 'closed' | 'halted';
  created_at: string;
  updated_at: string;
  created_by: string;
  client_id?: string;
  embedding?: number[];
}

export interface CandidateNote {
  id: string;
  candidate_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  type: 'general' | 'interview' | 'feedback' | 'rejection' | 'other';
}

export interface RejectionReason {
  id: string;
  candidate_id: string;
  client_id: string;
  reason: string;
  created_at: string;
}

// Database helpers
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  return data as User | null;
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
    
  return data?.role || null;
}

export async function checkAuthorization(
  userId: string, 
  requiredRoles: UserRole[]
): Promise<boolean> {
  const userRole = await getUserRole(userId);
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}
