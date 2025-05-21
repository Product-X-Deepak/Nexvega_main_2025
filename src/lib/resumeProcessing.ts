
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { Json } from '@/integrations/supabase/types';
import { Candidate, Education, WorkExperience, Project, Publication } from '@/types';

export enum FileType {
  PDF = 'application/pdf',
  DOC = 'application/msword',
  DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  CSV = 'text/csv',
  EXCEL = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  TEXT = 'text/plain',
}

export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;
  const arrayBuffer = await file.arrayBuffer();
  
  switch (fileType) {
    case FileType.PDF: {
      try {
        const pdfParse = await import('pdf-parse');
        const pdfData = await pdfParse.default(Buffer.from(arrayBuffer));
        return pdfData.text;
      } catch (error) {
        console.error('Error parsing PDF:', error);
        throw new Error(`Failed to parse PDF: ${error.message}`);
      }
    }
      
    case FileType.DOC:
    case FileType.DOCX: {
      try {
        const mammoth = await import('mammoth');
        const docData = await mammoth.extractRawText({
          arrayBuffer: arrayBuffer
        });
        return docData.value;
      } catch (error) {
        console.error('Error parsing DOC/DOCX:', error);
        throw new Error(`Failed to parse document: ${error.message}`);
      }
    }
      
    case FileType.CSV: {
      try {
        // For CSV, we parse and join the data manually
        const textDecoder = new TextDecoder('utf-8');
        const csvString = textDecoder.decode(arrayBuffer);
        
        // Split the CSV string into lines and process
        const lines = csvString.split('\n');
        if (lines.length === 0) return '';
        
        const headers = lines[0].split(',');
        const results: string[] = [];
        
        // Process each line (skip header)
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',');
          const row: Record<string, string> = {};
          
          headers.forEach((header, index) => {
            row[header.trim()] = values[index]?.trim() || '';
          });
          
          results.push(Object.values(row).join(' '));
        }
        
        return results.join('\n');
      } catch (error) {
        console.error('Error parsing CSV:', error);
        throw new Error(`Failed to parse CSV: ${error.message}`);
      }
    }
      
    case FileType.EXCEL: {
      try {
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), {type: 'array'});
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        return jsonData.map(row => Object.values(row).join(' ')).join('\n');
      } catch (error) {
        console.error('Error parsing Excel:', error);
        throw new Error(`Failed to parse Excel: ${error.message}`);
      }
    }
      
    case FileType.TEXT: {
      try {
        const textDecoder = new TextDecoder('utf-8');
        return textDecoder.decode(arrayBuffer);
      } catch (error) {
        console.error('Error parsing text file:', error);
        throw new Error(`Failed to parse text file: ${error.message}`);
      }
    }
      
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

export async function uploadResumeFile(file: File, userId: string): Promise<{ resumeId: string, resumeUrl: string }> {
  try {
    const resumeId = uuidv4();
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}_${timestamp}_${resumeId}.${fileExt}`;
    
    const { error: uploadError, data } = await supabase.storage
      .from('resumes')
      .upload(filePath, file);
      
    if (uploadError) {
      throw new Error(`Error uploading resume: ${uploadError.message}`);
    }
    
    // Get the public URL for the resume
    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath);
      
    return { 
      resumeId: filePath, 
      resumeUrl: urlData.publicUrl 
    };
  } catch (error) {
    console.error('Error in uploadResumeFile:', error);
    throw error;
  }
}

export async function parseResumeText(resumeText: string) {
  try {
    // Call the edge function for parsing
    const { data, error } = await supabase.functions.invoke('parse-resume', {
      body: { resumeText }
    });
    
    if (error) {
      console.error('Error calling parse-resume function:', error);
      throw new Error(`Error parsing resume: ${error.message}`);
    }
    
    if (!data?.success || !data?.data) {
      throw new Error('Failed to parse resume data');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw error;
  }
}

export async function processResume(file: File, userId: string) {
  try {
    console.log(`Processing resume: ${file.name} (${file.type})`);
    
    // Extract text from the file
    const text = await extractTextFromFile(file);
    console.log(`Successfully extracted text from ${file.name}, length: ${text.length} chars`);
    
    // Upload the raw file to Supabase Storage
    const { resumeId, resumeUrl } = await uploadResumeFile(file, userId);
    console.log(`Successfully uploaded resume to storage: ${resumeId}`);
    
    // Parse the resume text to extract structured data
    console.log('Sending resume text to OpenAI for parsing...');
    const parsedData = await parseResumeText(text);
    console.log('Successfully parsed resume data:', parsedData);
    
    return {
      resumeId,
      resumeUrl,
      parsedData,
      resumeText: text
    };
  } catch (error) {
    console.error('Resume processing error:', error);
    throw error;
  }
}

export async function processMultipleResumes(files: File[], userId: string): Promise<{ processed: any[], failed: any[] }> {
  const processed: any[] = [];
  const failed: any[] = [];
  
  for (const file of files) {
    try {
      console.log(`Processing file: ${file.name}`);
      const result = await processResume(file, userId);
      
      processed.push({
        filename: file.name,
        ...result
      });
      
      console.log(`Successfully processed resume: ${file.name}`);
    } catch (error) {
      console.error(`Failed to process file ${file.name}:`, error);
      failed.push({
        filename: file.name,
        error: (error as Error).message
      });
    }
  }
  
  return { processed, failed };
}

// Convert application type to database type
function convertToDbType(data: any): any {
  if (!data) return data;
  
  const result = { ...data };
  
  // Convert Candidate education array to JSON
  if (data.education && Array.isArray(data.education)) {
    result.education = data.education as unknown as Json;
  }
  
  // Convert Candidate experience array to JSON
  if (data.experience && Array.isArray(data.experience)) {
    result.experience = data.experience as unknown as Json;
  }
  
  // Convert Candidate projects array to JSON
  if (data.projects && Array.isArray(data.projects)) {
    result.projects = data.projects as unknown as Json;
  }
  
  // Convert Candidate publications array to JSON
  if (data.publications && Array.isArray(data.publications)) {
    result.publications = data.publications as unknown as Json;
  }
  
  // Convert Candidate social_media object to JSON
  if (data.social_media && typeof data.social_media === 'object') {
    result.social_media = data.social_media as unknown as Json;
  }
  
  // Ensure pipeline_stage is valid enum value
  if (data.pipeline_stage && typeof data.pipeline_stage === 'string') {
    // Default to 'new_candidate' if not a valid stage
    const validStages = ['new_candidate', 'screening', 'interview', 'offer', 'hired', 'rejected'];
    result.pipeline_stage = validStages.includes(data.pipeline_stage) 
      ? data.pipeline_stage 
      : 'new_candidate';
  }
  
  return result;
}

// Convert database type to application type
function convertFromDbType(data: any): any {
  if (!data) return data;
  
  // Handle education, experience, projects, publications, and social_media
  // by ensuring they're properly typed for the application
  const result = { ...data };
  
  if (data.education) {
    result.education = data.education as unknown as Education[];
  }
  
  if (data.experience) {
    result.experience = data.experience as unknown as WorkExperience[];
  }
  
  if (data.projects) {
    result.projects = data.projects as unknown as Project[];
  }
  
  if (data.publications) {
    result.publications = data.publications as unknown as Publication[];
  }
  
  return result;
}

export async function saveProcessedCandidate(candidateData: any, userId: string) {
  try {
    console.log('Saving candidate to database:', candidateData);
    
    // Generate embedding for the candidate
    const resumeTextForEmbedding = `
      ${candidateData.full_name || ''} 
      ${candidateData.resume_summary || ''} 
      ${candidateData.skills?.join(' ') || ''} 
      ${candidateData.experience?.map((exp: any) => 
        `${exp.title || ''} ${exp.company || ''} ${exp.responsibilities?.join(' ') || ''}`
      ).join(' ') || ''}
    `;
    
    // Prepare data for insertion
    const dataToInsert = convertToDbType({
      full_name: candidateData.full_name || null,
      email: candidateData.email || null,
      phone: candidateData.phone || null,
      linkedin_url: candidateData.linkedin_url || null,
      other_links: candidateData.other_links || [],
      social_media: candidateData.social_media || {},
      resume_summary: candidateData.resume_summary || null,
      objective: candidateData.objective || null,
      skills: candidateData.skills || [],
      languages: candidateData.languages || [],
      education: candidateData.education || [],
      experience: candidateData.experience || [],
      projects: candidateData.projects || [],
      publications: candidateData.publications || [],
      resume_id: candidateData.resumeId || null,
      resume_url: candidateData.resumeUrl || null,
      status: 'active',
      pipeline_stage: 'new_candidate',
      created_by: userId,
      updated_at: new Date().toISOString()
    });
    
    // Insert the candidate data
    const { data, error } = await supabase
      .from('candidates')
      .insert(dataToInsert)
      .select();
      
    if (error) {
      console.error('Error inserting candidate data:', error);
      throw error;
    }
    
    // Generate embedding asynchronously
    if (resumeTextForEmbedding.trim().length > 10 && data?.[0]?.id) {
      try {
        const { error: embeddingError } = await supabase.functions.invoke('generate-embeddings', {
          body: {
            recordId: data[0].id,
            recordType: 'candidate',
            text: resumeTextForEmbedding
          }
        });
        
        if (embeddingError) {
          console.error('Error generating embeddings:', embeddingError);
        }
      } catch (embeddingError) {
        console.error('Error calling embedding function:', embeddingError);
      }
    }
    
    return data?.[0]?.id;
  } catch (error) {
    console.error('Error saving candidate:', error);
    throw error;
  }
}

// Function to handle bulk resume processing and saving
export async function processBulkResumes(files: File[], userId: string) {
  const { processed, failed } = await processMultipleResumes(files, userId);
  const savedIds: string[] = [];
  const processingErrors: any[] = [];
  
  for (const item of processed) {
    try {
      const candidateData = {
        ...item.parsedData,
        resumeId: item.resumeId,
        resumeUrl: item.resumeUrl,
        resumeText: item.resumeText
      };
      
      const candidateId = await saveProcessedCandidate(candidateData, userId);
      if (candidateId) {
        savedIds.push(candidateId);
      }
    } catch (error) {
      processingErrors.push({
        filename: item.filename,
        error: (error as Error).message
      });
    }
  }
  
  return {
    processed: processed.length,
    failed: failed.length + processingErrors.length,
    savedIds,
    errors: [...failed, ...processingErrors]
  };
}
