
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as csvParser from 'csv-parser';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';
import { parseResume, generateEmbedding } from './openai';

export enum FileType {
  PDF = 'application/pdf',
  DOC = 'application/msword',
  DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  CSV = 'text/csv',
  EXCEL = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  TEXT = 'text/plain',
}

export async function processResume(file: File): Promise<{ resumeId: string, candidateData: any }> {
  try {
    // Generate a unique ID for the resume
    const resumeId = uuidv4();
    
    // Upload the raw file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const filePath = `resumes/${resumeId}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('resume_files')
      .upload(filePath, file);
      
    if (uploadError) {
      throw new Error(`Error uploading resume: ${uploadError.message}`);
    }
    
    // Extract text from the file
    const text = await extractTextFromFile(file);
    
    // Parse the resume text to extract structured data
    const candidateData = await parseResume(text);
    
    // Generate embedding for semantic search
    if (candidateData) {
      const resumeTextForEmbedding = `
        ${candidateData.full_name || ''} 
        ${candidateData.resume_summary || ''} 
        ${candidateData.skills?.join(' ') || ''} 
        ${candidateData.experience?.map((exp: any) => 
          `${exp.title} ${exp.company} ${exp.responsibilities?.join(' ')}`
        ).join(' ') || ''}
      `;
      
      candidateData.embedding = await generateEmbedding(resumeTextForEmbedding);
      candidateData.resume_id = resumeId;
      
      // Get the public URL for the resume
      const { data: urlData } = supabase.storage.from('resume_files').getPublicUrl(filePath);
      candidateData.resume_url = urlData.publicUrl;
    }
    
    return { resumeId, candidateData };
  } catch (error) {
    console.error('Resume processing error:', error);
    throw error;
  }
}

export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;
  const arrayBuffer = await file.arrayBuffer();
  
  switch (fileType) {
    case FileType.PDF:
      const pdfData = await pdfParse(Buffer.from(arrayBuffer));
      return pdfData.text;
      
    case FileType.DOC:
    case FileType.DOCX:
      const docData = await mammoth.extractRawText({
        arrayBuffer: arrayBuffer
      });
      return docData.value;
      
    case FileType.CSV:
      // For CSV, we need to parse the rows and join them
      return new Promise((resolve, reject) => {
        const results: string[] = [];
        const stream = csvParser()
          .on('data', (data) => results.push(Object.values(data).join(' ')))
          .on('end', () => resolve(results.join('\n')))
          .on('error', (error) => reject(error));
          
        // Convert ArrayBuffer to Buffer for Node.js compatibility
        const buffer = Buffer.from(arrayBuffer);
        const textDecoder = new TextDecoder('utf-8');
        const csvString = textDecoder.decode(buffer);
        
        // Use a workaround since we can't directly pipe a string
        const lines = csvString.split('\n');
        for (const line of lines) {
          stream.write(line);
        }
        stream.end();
      });
      
    case FileType.EXCEL:
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), {type: 'array'});
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      return jsonData.map(row => Object.values(row).join(' ')).join('\n');
      
    case FileType.TEXT:
      const textDecoder = new TextDecoder('utf-8');
      return textDecoder.decode(arrayBuffer);
      
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
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
  const { error } = await supabase
    .from('candidates')
    .insert({
      ...candidateData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active'
    });
    
  if (error) {
    throw new Error(`Error saving candidate data: ${error.message}`);
  }
  
  return true;
}
