
import { supabase } from '@/integrations/supabase/client';
import { generateEmbedding, processResume } from '@/lib/openai';

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

async function extractTextFromFile(file: File): Promise<string> {
  // This would normally involve file parsing based on file type
  // For simplicity, we're assuming it's plain text
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string || '');
    };
    reader.onerror = (e) => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsText(file);
  });
}
