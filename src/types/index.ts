
export type UserRole = 'admin' | 'staff' | 'client';

export interface User {
  id: string;
  email: string;
  role?: UserRole;
  full_name?: string;
  created_at?: string;
  last_sign_in?: string;
}

export type CandidateStatus = 'active' | 'inactive' | 'blocked' | 'unavailable';

export type PipelineStage = 'new_candidate' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';

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
  status: CandidateStatus;
  pipeline_stage?: PipelineStage;
  assigned_to_clients?: string[];
  liked_by_clients?: string[];
  embedding?: number[];
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

export interface SearchQuery {
  term: string;
  mode: 'basic' | 'semantic' | 'boolean';
  filters?: Record<string, any>;
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
