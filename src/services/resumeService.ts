
import { supabase } from '@/lib/supabase';
import { Candidate } from '@/types';
import { extractTextFromFile } from '@/utils/fileUtils';

// Process and upload a single resume
export async function uploadResume(file: File, userId: string): Promise<Candidate | null> {
  try {
    // Extract the text content from the resume
    const resumeText = await extractTextFromFile(file);
    
    // Upload file to storage
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, file);
      
    if (uploadError) throw uploadError;
    
    // Get public URL for the file
    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath);
    
    // Parse the resume using the parse-resume edge function
    const { data: parsedData, error: parseError } = await supabase.functions.invoke('parse-resume', {
      body: {
        resumeText,
        model: "gpt-4o"
      }
    });
    
    if (parseError) throw parseError;
    
    if (!parsedData.success || !parsedData.data) {
      throw new Error('Failed to parse resume');
    }
    
    // Prepare candidate data for database
    const candidateData = {
      ...parsedData.data,
      resume_id: filePath,
      resume_url: urlData.publicUrl,
      created_by: userId,
      status: 'active',
      pipeline_stage: 'new_candidate',
    };
    
    // Insert the data into the database
    const { data: dbCandidate, error: insertError } = await supabase
      .from('candidates')
      .insert(candidateData)
      .select()
      .single();
      
    if (insertError) throw insertError;
    
    // Generate embedding for semantic search
    if (resumeText && dbCandidate?.id) {
      const embedText = `
        ${parsedData.data.full_name || ''} 
        ${parsedData.data.resume_summary || ''} 
        ${parsedData.data.skills ? parsedData.data.skills.join(' ') : ''}
        ${parsedData.data.experience ? parsedData.data.experience.map((exp: any) => 
          `${exp.title || ''} ${exp.company || ''} ${exp.responsibilities?.join(' ') || ''}`
        ).join(' ') : ''}
      `;
      
      try {
        await supabase.functions.invoke('generate-embeddings', {
          body: {
            recordId: dbCandidate.id,
            recordType: 'candidate',
            text: embedText
          }
        });
      } catch (embeddingError) {
        console.error('Error generating embedding:', embeddingError);
        // Continue even if embedding generation fails
      }
    }
    
    return dbCandidate as Candidate;
    
  } catch (error) {
    console.error('Error uploading resume:', error);
    throw error;
  }
}

// Process multiple resumes at once
export async function processMultipleResumes(files: File[], userId: string): Promise<{ processed: any[], failed: any[] }> {
  const processed: any[] = [];
  const failed: any[] = [];
  
  // Initialize batch processing
  try {
    await supabase.functions.invoke('parse-resume-batch', {
      body: {
        fileCount: files.length,
        userId
      }
    });
  } catch (error) {
    console.error('Error initializing batch processing:', error);
    // Continue anyway, as we'll process files individually
  }
  
  // Process each file individually
  for (const file of files) {
    try {
      const candidate = await uploadResume(file, userId);
      processed.push({
        filename: file.name,
        candidate
      });
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      failed.push({
        filename: file.name,
        error: error.message
      });
    }
  }
  
  return { processed, failed };
}

// Get candidate by ID
export async function getCandidateById(id: string): Promise<Candidate | null> {
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
    return null;
  }
}

// Update candidate information
export async function updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate | null> {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    return data as Candidate;
  } catch (error) {
    console.error('Error updating candidate:', error);
    return null;
  }
}

// Search for candidates based on a job description
export async function searchCandidatesByJobDescription(jobDescription: string, limit = 50): Promise<Candidate[]> {
  try {
    const { data, error } = await supabase.functions.invoke('match-candidates', {
      body: { jobDescription, limit }
    });
    
    if (error) throw error;
    
    return data as Candidate[];
  } catch (error) {
    console.error('Error searching candidates:', error);
    return [];
  }
}

// Assign candidates to a client
export async function assignCandidatesToClient(candidateIds: string[], clientId: string): Promise<boolean> {
  try {
    // Get current client info
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('assigned_candidates')
      .eq('id', clientId)
      .single();
      
    if (clientError) throw clientError;
    
    // Combine existing and new assigned candidates
    const existingAssigned = clientData.assigned_candidates || [];
    const newAssigned = [...new Set([...existingAssigned, ...candidateIds])];
    
    // Update client with new assigned candidates
    const { error: updateError } = await supabase
      .from('clients')
      .update({ 
        assigned_candidates: newAssigned,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);
      
    if (updateError) throw updateError;
    
    return true;
  } catch (error) {
    console.error('Error assigning candidates to client:', error);
    return false;
  }
}

// Update candidate pipeline stage
export async function updateCandidatePipelineStage(candidateId: string, stage: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('candidates')
      .update({ 
        pipeline_stage: stage,
        updated_at: new Date().toISOString()
      })
      .eq('id', candidateId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating pipeline stage:', error);
    return false;
  }
}

// Batch update candidate pipeline stages
export async function batchUpdatePipelineStage(candidateIds: string[], stage: string): Promise<boolean> {
  try {
    // Update each candidate one by one (Supabase doesn't support bulk updates cleanly)
    for (const id of candidateIds) {
      const { error } = await supabase
        .from('candidates')
        .update({ 
          pipeline_stage: stage,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error batch updating pipeline stages:', error);
    return false;
  }
}
