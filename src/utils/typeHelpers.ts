
import { Candidate, Client, Job, CandidateNote, PipelineStage, CandidateStatus } from '@/types';

/**
 * Helper function to properly convert database objects to typed Candidate objects
 */
export function convertToCandidates(data: any[]): Candidate[] {
  return data.map(item => {
    // Ensure each complex object is properly typed
    const candidate: Candidate = {
      ...item,
      education: Array.isArray(item.education) ? item.education : [],
      experience: Array.isArray(item.experience) ? item.experience : [],
      projects: Array.isArray(item.projects) ? item.projects : [],
      publications: Array.isArray(item.publications) ? item.publications : [],
      skills: Array.isArray(item.skills) ? item.skills : [],
      languages: Array.isArray(item.languages) ? item.languages : [],
      assigned_to_clients: Array.isArray(item.assigned_to_clients) ? item.assigned_to_clients : [],
      liked_by_clients: Array.isArray(item.liked_by_clients) ? item.liked_by_clients : []
    };
    return candidate;
  });
}

/**
 * Helper function to properly convert database objects to typed Client objects
 */
export function convertToClients(data: any[]): Client[] {
  return data.map(item => {
    const client: Client = {
      ...item,
      assigned_candidates: Array.isArray(item.assigned_candidates) ? item.assigned_candidates : [],
      liked_candidates: Array.isArray(item.liked_candidates) ? item.liked_candidates : []
    };
    return client;
  });
}

/**
 * Helper function to properly convert database objects to typed Job objects
 */
export function convertToJobs(data: any[]): Job[] {
  return data.map(item => {
    const job: Job = {
      ...item,
      requirements: Array.isArray(item.requirements) ? item.requirements : [],
      responsibilities: Array.isArray(item.responsibilities) ? item.responsibilities : []
    };
    return job;
  });
}

/**
 * Helper function to properly convert database objects to typed CandidateNote objects
 */
export function convertToCandidateNotes(data: any[]): CandidateNote[] {
  return data.map(item => {
    const note: CandidateNote = {
      ...item
    };
    return note;
  });
}

/**
 * Helper function to convert a single database object to a typed Candidate object
 */
export function convertToCandidate(item: any): Candidate {
  // Ensure each complex object is properly typed
  const candidate: Candidate = {
    ...item,
    education: Array.isArray(item.education) ? item.education : [],
    experience: Array.isArray(item.experience) ? item.experience : [],
    projects: Array.isArray(item.projects) ? item.projects : [],
    publications: Array.isArray(item.publications) ? item.publications : [],
    skills: Array.isArray(item.skills) ? item.skills : [],
    languages: Array.isArray(item.languages) ? item.languages : [],
    assigned_to_clients: Array.isArray(item.assigned_to_clients) ? item.assigned_to_clients : [],
    liked_by_clients: Array.isArray(item.liked_by_clients) ? item.liked_by_clients : []
  };
  return candidate;
}

/**
 * Validate if the given value is a valid PipelineStage
 */
export function validatePipelineStage(value: string): PipelineStage {
  const validStages: PipelineStage[] = ['new_candidate', 'screening', 'interview', 'offer', 'hired', 'rejected'];
  return validStages.includes(value as PipelineStage) 
    ? value as PipelineStage 
    : 'new_candidate';
}

/**
 * Validate if the given value is a valid CandidateStatus
 */
export function validateCandidateStatus(value: string): CandidateStatus {
  const validStatuses: CandidateStatus[] = ['active', 'inactive', 'blocked', 'unavailable'];
  return validStatuses.includes(value as CandidateStatus)
    ? value as CandidateStatus
    : 'active';
}
