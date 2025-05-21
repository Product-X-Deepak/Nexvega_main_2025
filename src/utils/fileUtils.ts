
// This file contains utility functions for extracting text from different file types
import * as pdfjsLib from 'pdfjs-dist';
import { GlobalWorkerOptions } from 'pdfjs-dist';

/**
 * Extract text content from various file types (PDF, DOC, DOCX, TXT, CSV, etc.)
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;
  
  // Simple text file - can be read directly
  if (fileType === 'text/plain') {
    return await readTextFile(file);
  }
  
  // PDF files need PDF parsing library
  if (fileType === 'application/pdf') {
    try {
      // Set up PDF.js worker
      // Use a more compatible import for the worker
      GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
      
      // Load the PDF file
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(new Uint8Array(arrayBuffer)).promise;
      
      let text = '';
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ') + '\n';
      }
      
      return text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return `Error extracting text from PDF: ${error.message}`;
    }
  }
  
  // Word documents (DOC, DOCX)
  if (fileType === 'application/msword' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      console.error('Error extracting text from Word document:', error);
      return `Error extracting text from Word document: ${error.message}`;
    }
  }
  
  // CSV files
  if (fileType === 'text/csv') {
    try {
      const text = await readTextFile(file);
      const rows = text.split('\n').map(row => row.split(','));
      
      // Join CSV data into a readable text format
      return rows.map(row => row.join(' ')).join('\n');
    } catch (error) {
      console.error('Error extracting text from CSV:', error);
      return `Error extracting text from CSV: ${error.message}`;
    }
  }
  
  // Excel files
  if (fileType === 'application/vnd.ms-excel' || fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    try {
      const xlsx = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = xlsx.read(new Uint8Array(arrayBuffer), { type: 'array' });
      
      let text = '';
      
      // Extract text from each sheet
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet);
        text += `Sheet: ${sheetName}\n`;
        text += jsonData.map(row => Object.values(row).join(' ')).join('\n');
        text += '\n\n';
      });
      
      return text;
    } catch (error) {
      console.error('Error extracting text from Excel:', error);
      return `Error extracting text from Excel: ${error.message}`;
    }
  }
  
  // For unsupported file types, return message
  return `File type ${fileType} is not supported for text extraction`;
}

/**
 * Helper function to read text files
 */
async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
