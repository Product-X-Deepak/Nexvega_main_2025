
import { Json } from '@/integrations/supabase/types';
import { 
  Candidate, 
  CandidateNote, 
  Education, 
  WorkExperience, 
  Project, 
  Publication,
  PipelineStage 
} from '@/types';

// Helper function to convert database JSON to typed Education array
export function convertToEducation(jsonData: Json | null): Education[] {
  if (!jsonData) return [];
  try {
    if (typeof jsonData === 'string') {
      return JSON.parse(jsonData) as Education[];
    }
    return jsonData as unknown as Education[];
  } catch (e) {
    console.error('Error converting education data:', e);
    return [];
  }
}

// Helper function to convert database JSON to typed WorkExperience array
export function convertToWorkExperience(jsonData: Json | null): WorkExperience[] {
  if (!jsonData) return [];
  try {
    if (typeof jsonData === 'string') {
      return JSON.parse(jsonData) as WorkExperience[];
    }
    return jsonData as unknown as WorkExperience[];
  } catch (e) {
    console.error('Error converting work experience data:', e);
    return [];
  }
}

// Helper function to convert database JSON to typed Project array
export function convertToProjects(jsonData: Json | null): Project[] {
  if (!jsonData) return [];
  try {
    if (typeof jsonData === 'string') {
      return JSON.parse(jsonData) as Project[];
    }
    return jsonData as unknown as Project[];
  } catch (e) {
    console.error('Error converting projects data:', e);
    return [];
  }
}

// Helper function to convert database JSON to typed Publication array
export function convertToPublications(jsonData: Json | null): Publication[] {
  if (!jsonData) return [];
  try {
    if (typeof jsonData === 'string') {
      return JSON.parse(jsonData) as Publication[];
    }
    return jsonData as unknown as Publication[];
  } catch (e) {
    console.error('Error converting publications data:', e);
    return [];
  }
}

// Helper function to convert database JSON to Record<string, string>
export function convertToSocialMedia(jsonData: Json | null): Record<string, string> {
  if (!jsonData) return {};
  try {
    if (typeof jsonData === 'string') {
      return JSON.parse(jsonData) as Record<string, string>;
    }
    return jsonData as unknown as Record<string, string>;
  } catch (e) {
    console.error('Error converting social media data:', e);
    return {};
  }
}

// Helper function to convert database candidate to typed Candidate
export function convertToCandidate(data: any): Candidate {
  return {
    ...data,
    education: convertToEducation(data.education),
    experience: convertToWorkExperience(data.experience),
    projects: convertToProjects(data.projects),
    publications: convertToPublications(data.publications),
    social_media: convertToSocialMedia(data.social_media),
    pipeline_stage: data.pipeline_stage as PipelineStage,
    status: data.status as Candidate['status']
  };
}

// Helper function to convert database candidates to typed Candidate array
export function convertToCandidates(data: any[]): Candidate[] {
  return data.map(convertToCandidate);
}

// Helper function to convert database notes to typed CandidateNote array
export function convertToCandidateNotes(data: any[], candidateId: string): CandidateNote[] {
  return data.map(note => ({
    ...note,
    candidate_id: candidateId,
    type: note.type as CandidateNote['type']
  }));
}

// Validate a pipeline stage
export function validatePipelineStage(stage: string): PipelineStage {
  const validStages: PipelineStage[] = [
    'new_candidate', 
    'screening', 
    'interview_scheduled',
    'interview_completed',
    'technical_assessment',
    'reference_check',
    'offer_pending',
    'offer_sent',
    'offer_accepted',
    'offer_rejected',
    'onboarding',
    'hired',
    'rejected'
  ];
  
  if (validStages.includes(stage as PipelineStage)) {
    return stage as PipelineStage;
  }
  
  // Default to new_candidate if invalid
  console.warn(`Invalid pipeline stage: ${stage}, defaulting to new_candidate`);
  return 'new_candidate';
}
