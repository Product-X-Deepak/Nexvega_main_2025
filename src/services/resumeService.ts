
import { supabase } from '@/integrations/supabase/client';
import { processResume } from '@/lib/openai';
import { v4 as uuidv4 } from 'uuid';

// File types that can be processed
export enum FileType {
  PDF = 'application/pdf',
  DOC = 'application/msword',
  DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  CSV = 'text/csv',
  EXCEL = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  TEXT = 'text/plain',
}

/**
 * Extracts text from different file types
 */
export const extractTextFromFile = async (file: File): Promise<string> => {
  const fileType = file.type;
  const arrayBuffer = await file.arrayBuffer();
  
  // Import modules dynamically only when needed
  switch (fileType) {
    case FileType.PDF: {
      const pdfParse = await import('pdf-parse');
      const pdfData = await pdfParse.default(Buffer.from(arrayBuffer));
      return pdfData.text;
    }
      
    case FileType.DOC:
    case FileType.DOCX: {
      const mammoth = await import('mammoth');
      const docData = await mammoth.extractRawText({
        arrayBuffer: arrayBuffer
      });
      return docData.value;
    }
      
    case FileType.CSV: {
      const csvParser = await import('csv-parser');
      // For CSV, we need to parse the rows and join them
      return new Promise((resolve, reject) => {
        const results: string[] = [];
        
        // Convert ArrayBuffer to Buffer for Node.js compatibility
        const buffer = Buffer.from(arrayBuffer);
        const textDecoder = new TextDecoder('utf-8');
        const csvString = textDecoder.decode(buffer);
        
        // Split the CSV string into lines and process
        const lines = csvString.split('\n');
        const headers = lines[0].split(',');
        
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
        
        resolve(results.join('\n'));
      });
    }
      
    case FileType.EXCEL: {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), {type: 'array'});
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      return jsonData.map(row => Object.values(row).join(' ')).join('\n');
    }
      
    case FileType.TEXT:
      const textDecoder = new TextDecoder('utf-8');
      return textDecoder.decode(arrayBuffer);
      
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
};

/**
 * Uploads a candidate's resume to storage and returns the URL
 */
export const uploadResumeFile = async (file: File, resumeId: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const filePath = `resumes/${resumeId}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('resume_files')
    .upload(filePath, file);
    
  if (uploadError) {
    throw new Error(`Error uploading resume: ${uploadError.message}`);
  }
  
  // Get the public URL for the resume
  const { data: urlData } = supabase.storage
    .from('resume_files')
    .getPublicUrl(filePath);
    
  return urlData.publicUrl;
};

/**
 * Processes a resume file: extracts text, parses it, and generates embedding
 */
export const processResumeFile = async (file: File) => {
  try {
    // Generate a unique ID for the resume
    const resumeId = uuidv4();
    
    // Extract text from the file
    const text = await extractTextFromFile(file);
    
    // Upload the raw file to storage
    const resumeUrl = await uploadResumeFile(file, resumeId);
    
    // Call the edge function for parsing
    const { data, error } = await supabase.functions.invoke('parse-resume', {
      body: { resumeText: text }
    });
    
    if (error) throw new Error(`Error parsing resume: ${error.message}`);
    
    if (!data?.success || !data?.data) {
      throw new Error('Failed to parse resume data');
    }
    
    // Prepare candidate data
    const candidateData = {
      ...data.data,
      resume_id: resumeId,
      resume_url: resumeUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active'
    };
    
    // Generate embedding after inserting the candidate
    const resumeTextForEmbedding = `
      ${candidateData.full_name || ''} 
      ${candidateData.resume_summary || ''} 
      ${candidateData.skills?.join(' ') || ''} 
      ${candidateData.experience?.map((exp: any) => 
        `${exp.title} ${exp.company} ${exp.responsibilities?.join(' ')}`
      ).join(' ') || ''}
    `;
    
    return {
      candidateData,
      resumeText: resumeTextForEmbedding,
      resumeId,
    };
  } catch (error) {
    console.error('Resume processing error:', error);
    throw error;
  }
};

/**
 * Processes multiple resume files in parallel
 */
export const processMultipleResumes = async (files: File[]) => {
  const processed = [];
  const failed = [];
  
  for (const file of files) {
    try {
      const result = await processResumeFile(file);
      processed.push({
        filename: file.name,
        ...result
      });
    } catch (error) {
      failed.push({
        filename: file.name,
        error: (error as Error).message
      });
    }
  }
  
  return { processed, failed };
};

/**
 * Saves processed candidate data to the database
 */
export const saveProcessedCandidate = async (candidateData: any) => {
  try {
    // Insert the candidate data
    const { data, error } = await supabase
      .from('candidates')
      .insert(candidateData)
      .select('id');
      
    if (error) throw new Error(`Error saving candidate data: ${error.message}`);
    
    if (!data || data.length === 0) {
      throw new Error('No candidate data returned after insert');
    }
    
    const candidateId = data[0].id;
    
    // Generate embedding for the candidate
    if (candidateData.resumeText) {
      await supabase.functions.invoke('generate-embeddings', {
        body: {
          recordId: candidateId,
          recordType: 'candidate',
          text: candidateData.resumeText
        }
      });
    }
    
    return candidateId;
  } catch (error) {
    console.error('Error saving candidate:', error);
    throw error;
  }
};
