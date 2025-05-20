
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

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
    }
      
    case FileType.EXCEL: {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), {type: 'array'});
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      return jsonData.map(row => Object.values(row).join(' ')).join('\n');
    }
      
    case FileType.TEXT: {
      const textDecoder = new TextDecoder('utf-8');
      return textDecoder.decode(arrayBuffer);
    }
      
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

export async function uploadResumeFile(file: File): Promise<{ resumeId: string, resumeUrl: string }> {
  const resumeId = uuidv4();
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
    
  return { 
    resumeId, 
    resumeUrl: urlData.publicUrl 
  };
}

export async function parseResumeText(resumeText: string) {
  try {
    // Call the edge function for parsing
    const { data, error } = await supabase.functions.invoke('parse-resume', {
      body: { resumeText }
    });
    
    if (error) throw new Error(`Error parsing resume: ${error.message}`);
    
    if (!data?.success || !data?.data) {
      throw new Error('Failed to parse resume data');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw error;
  }
}

export async function processResume(file: File): Promise<{ resumeId: string, candidateData: any }> {
  try {
    // Extract text from the file
    const text = await extractTextFromFile(file);
    
    // Upload the raw file to Supabase Storage
    const { resumeId, resumeUrl } = await uploadResumeFile(file);
    
    // Parse the resume text to extract structured data
    const parsedData = await parseResumeText(text);
    
    // Prepare candidate data
    const candidateData = {
      ...parsedData,
      resume_id: resumeId,
      resume_url: resumeUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active'
    };
    
    return { resumeId, candidateData };
  } catch (error) {
    console.error('Resume processing error:', error);
    throw error;
  }
}

export async function processMultipleResumes(files: File[]): Promise<{ processed: any[], failed: any[] }> {
  const processed: any[] = [];
  const failed: any[] = [];
  
  for (const file of files) {
    try {
      const result = await processResume(file);
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
}

export async function saveProcessedCandidateToDatabase(candidateData: any) {
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
    const resumeTextForEmbedding = `
      ${candidateData.full_name || ''} 
      ${candidateData.resume_summary || ''} 
      ${candidateData.skills?.join(' ') || ''} 
      ${candidateData.experience?.map((exp: any) => 
        `${exp.title} ${exp.company} ${exp.responsibilities?.join(' ')}`
      ).join(' ') || ''}
    `;
    
    await supabase.functions.invoke('generate-embeddings', {
      body: {
        recordId: candidateId,
        recordType: 'candidate',
        text: resumeTextForEmbedding
      }
    });
    
    return candidateId;
  } catch (error) {
    console.error('Error saving candidate:', error);
    throw error;
  }
}
