
import { supabase } from '@/integrations/supabase/client';
import { generateEmbedding, processResume } from '@/lib/openai';
import { extractTextFromFile } from '@/lib/resumeProcessing';
import { Candidate } from '@/types';

export async function uploadResume(file: File, userId: string) {
  try {
    // 1. Parse the file content
    const text = await extractTextFromFile(file);
    
    // 2. Process the resume using OpenAI
    const parsedResume = await processResume(text);
    
    // 3. Generate embedding for the resume
    const resumeSummary = parsedResume.resume_summary || '';
    const skills = parsedResume.skills ? parsedResume.skills.join(' ') : '';
    const embedInput = `${resumeSummary} ${skills}`;
    
    // Generate embedding only if there's enough text
    let embedding;
    if (embedInput.length > 10) {
      embedding = await generateEmbedding(embedInput);
    }
    
    // 4. Upload the file to Supabase Storage
    const fileName = `${userId}_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const { data: fileData, error: fileError } = await supabase.storage
      .from('resumes')
      .upload(fileName, file);
      
    if (fileError) throw fileError;
    
    // 5. Create candidate record in the database
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .insert({
        ...parsedResume,
        embedding,
        resume_id: fileName,
        resume_url: fileData?.path,
        created_by: userId,
        status: 'active',
        pipeline_stage: 'new_candidate',
      })
      .select()
      .single();
      
    if (candidateError) throw candidateError;
    
    return candidate;
  } catch (error) {
    console.error('Error uploading resume:', error);
    throw error;
  }
}

// Add the missing function for processing multiple resumes
export async function processMultipleResumes(files: File[]): Promise<{ processed: any[], failed: any[] }> {
  const processed: any[] = [];
  const failed: any[] = [];
  
  for (const file of files) {
    try {
      // Extract text from the file
      const text = await extractTextFromFile(file);
      
      // Parse the resume text to extract structured data
      const candidateData = await processResume(text);
      
      processed.push({
        filename: file.name,
        candidateData,
        resumeText: text
      });
    } catch (error) {
      failed.push({
        filename: file.name,
        error: (error as Error).message
      });
    }
  }
  
  return { processed, failed };
}

// Add the missing function for saving processed candidates
export async function saveProcessedCandidate(candidateData: any) {
  try {
    // Generate embedding for the candidate
    const resumeTextForEmbedding = `
      ${candidateData.full_name || ''} 
      ${candidateData.resume_summary || ''} 
      ${candidateData.skills?.join(' ') || ''} 
      ${candidateData.experience?.map((exp: any) => 
        `${exp.title || ''} ${exp.company || ''} ${exp.responsibilities?.join(' ') || ''}`
      ).join(' ') || ''}
    `;
    
    let embedding;
    if (resumeTextForEmbedding.trim().length > 10) {
      embedding = await generateEmbedding(resumeTextForEmbedding);
    }

    // Remove resumeText field before inserting into the database
    const { resumeText, ...dataToInsert } = candidateData;
    
    // Insert the candidate data
    const { data, error } = await supabase
      .from('candidates')
      .insert({
        ...dataToInsert,
        embedding,
        status: 'active',
        pipeline_stage: 'new_candidate',
        updated_at: new Date().toISOString()
      })
      .select();
      
    if (error) throw error;
    
    return data?.[0]?.id;
  } catch (error) {
    console.error('Error saving candidate:', error);
    throw error;
  }
}

