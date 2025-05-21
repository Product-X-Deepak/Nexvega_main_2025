
import { supabase } from '@/integrations/supabase/client';
import { Candidate } from '@/types';
import { 
  extractTextFromFile, 
  processResume as processResumeFile, 
  processMultipleResumes as processBulkResumes,
  saveProcessedCandidate as saveCandidate 
} from '@/lib/resumeProcessing';

// Process and upload a single resume
export async function uploadResume(file: File, userId: string) {
  try {
    // Extract and process resume
    const { resumeId, resumeUrl, parsedData, resumeText } = await processResumeFile(file, userId);
    
    // Prepare candidate data for database
    const candidateData = {
      ...parsedData,
      resume_id: resumeId,
      resume_url: resumeUrl,
      created_by: userId,
      status: 'active',
      pipeline_stage: 'new_candidate',
    };
    
    // Insert the data into the database
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .insert(candidateData)
      .select()
      .single();
      
    if (candidateError) throw candidateError;
    
    // Generate embedding for search functionality
    if (resumeText && resumeText.length > 10 && candidate?.id) {
      const embedText = `
        ${parsedData.resume_summary || ''} 
        ${parsedData.skills ? parsedData.skills.join(' ') : ''}
      `;
      
      await supabase.functions.invoke('generate-embeddings', {
        body: {
          recordId: candidate.id,
          recordType: 'candidate',
          text: embedText
        }
      });
    }
    
    return candidate;
  } catch (error) {
    console.error('Error uploading resume:', error);
    throw error;
  }
}

// Process multiple resumes at once
export async function processMultipleResumes(files: File[], userId?: string): Promise<{ processed: any[], failed: any[] }> {
  try {
    return await processBulkResumes(files, userId || 'anonymous');
  } catch (error) {
    console.error('Error processing multiple resumes:', error);
    throw error;
  }
}

// Save a processed candidate to the database
export async function saveProcessedCandidate(candidateData: any) {
  try {
    const userId = candidateData.created_by || 'anonymous';
    return await saveCandidate(candidateData, userId);
  } catch (error) {
    console.error('Error saving processed candidate:', error);
    throw error;
  }
}

// Search for candidates based on a job description
export async function searchCandidates(jobDescription: string, limit = 50) {
  try {
    const { data, error } = await supabase.functions.invoke('match-candidates', {
      body: { jobDescription, limit }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error searching candidates:', error);
    throw error;
  }
}

// Get candidate by ID
export async function getCandidateById(id: string): Promise<Candidate> {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data as Candidate;
  } catch (error) {
    console.error('Error fetching candidate:', error);
    throw error;
  }
}

// Update candidate
export async function updateCandidate(id: string, updates: Partial<Candidate>) {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
      
    if (error) throw error;
    return data[0] as Candidate;
  } catch (error) {
    console.error('Error updating candidate:', error);
    throw error;
  }
}

// Delete candidate
export async function deleteCandidate(id: string) {
  try {
    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting candidate:', error);
    throw error;
  }
}
