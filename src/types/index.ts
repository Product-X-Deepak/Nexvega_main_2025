export type UserRole = 'admin' | 'staff' | 'client';

export type CandidateStatus = 'active' | 'inactive' | 'blocked' | 'unavailable';

export type JobStatus = 'draft' | 'published' | 'archived' | 'closed' | 'halted';

export type JobType = 'full-time' | 'part-time' | 'contract' | 'freelance' | 'remote';

export type NoteType = 'general' | 'interview' | 'feedback' | 'rejection' | 'other';

export type PipelineStage = 
  'new_candidate' | 
  'screening' | 
  'interview_scheduled' | 
  'interview_completed' | 
  'technical_assessment' | 
  'reference_check' | 
  'offer_pending' | 
  'offer_sent' | 
  'offer_accepted' | 
  'offer_rejected' | 
  'onboarding' | 
  'hired' | 
  'rejected';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  created_at: string;
  last_sign_in?: string;
  company?: string;
  position?: string;
  phone?: string;
  is_active?: boolean;
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
  created_by?: string;
  modified_by?: string;
  liked?: boolean; // For UI purposes when viewed by a client
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
  created_by?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  location?: string;
  salary_range?: string;
  job_type: JobType;
  status: JobStatus;
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
  type: NoteType;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export interface RejectionReason {
  id: string;
  candidate_id: string;
  client_id: string;
  reason: string;
  created_at: string;
}

export interface Interview {
  id: string;
  candidate_id: string;
  job_id: string;
  scheduled_at: string;
  duration: number;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  interview_type: string;
  interviewer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  id: string;
  job_id: string;
  candidate_ids: string[];
  scores: number[];
  created_at: string;
  created_by?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name: string;
  record_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  created_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: any;
  description?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}
