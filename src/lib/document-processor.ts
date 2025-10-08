import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';

export interface ProcessedDocument {
  text: string;
  metadata: {
    pageCount?: number;
    wordCount: number;
    confidence?: number; // For OCR results
    language?: string;
  };
}

export interface ProcessingOptions {
  enableOCR?: boolean;
  ocrLanguage?: string;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
}

const DEFAULT_OPTIONS: ProcessingOptions = {
  enableOCR: true,
  ocrLanguage: 'eng',
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/tiff',
    'image/bmp'
  ]
};

/**
 * Process a document and extract text content
 * Supports PDF, DOCX, TXT, and image files (with OCR)
 */
export async function processDocument(
  file: File,
  options: ProcessingOptions = {}
): Promise<ProcessedDocument> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Validate file
  if (file.size > opts.maxFileSize!) {
    throw new Error(`File too large. Maximum size: ${opts.maxFileSize! / (1024 * 1024)}MB`);
  }
  
  if (!opts.allowedTypes!.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }
  
  try {
    switch (file.type) {
      case 'application/pdf':
        return await processPDF(file);
      
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await processWordDocument(file);
      
      case 'text/plain':
        return await processTextFile(file);
      
      case 'image/jpeg':
      case 'image/png':
      case 'image/tiff':
      case 'image/bmp':
        if (opts.enableOCR) {
          return await processImageWithOCR(file, opts.ocrLanguage!);
        } else {
          throw new Error('OCR is required for image files');
        }
      
      default:
        throw new Error(`Unsupported file type: ${file.type}`);
    }
  } catch (error) {
    console.error('Document processing error:', error);
    throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process PDF files
 */
async function processPDF(file: File): Promise<ProcessedDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const data = await pdfParse(Buffer.from(arrayBuffer));
  
  return {
    text: data.text,
    metadata: {
      pageCount: data.numpages,
      wordCount: data.text.split(/\s+/).length,
      confidence: 1.0 // PDF text extraction is highly reliable
    }
  };
}

/**
 * Process Word documents (DOCX)
 */
async function processWordDocument(file: File): Promise<ProcessedDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
  
  return {
    text: result.value,
    metadata: {
      wordCount: result.value.split(/\s+/).length,
      confidence: 1.0
    }
  };
}

/**
 * Process plain text files
 */
async function processTextFile(file: File): Promise<ProcessedDocument> {
  const text = await file.text();
  
  return {
    text,
    metadata: {
      wordCount: text.split(/\s+/).length,
      confidence: 1.0
    }
  };
}

/**
 * Process image files with OCR
 */
async function processImageWithOCR(file: File, language: string = 'eng'): Promise<ProcessedDocument> {
  const worker = await createWorker(language);
  
  try {
    const { data } = await worker.recognize(file);
    
    return {
      text: data.text,
      metadata: {
        wordCount: data.text.split(/\s+/).length,
        confidence: data.confidence / 100, // Convert to 0-1 scale
        language: data.language
      }
    };
  } finally {
    await worker.terminate();
  }
}

/**
 * Extract structured medical data from text
 * This is a basic implementation - in production, you'd use more sophisticated NLP
 */
export function extractMedicalData(text: string): {
  vitalSigns: Record<string, string>;
  medications: string[];
  diagnoses: string[];
  labValues: Record<string, string>;
} {
  const vitalSigns: Record<string, string> = {};
  const medications: string[] = [];
  const diagnoses: string[] = [];
  const labValues: Record<string, string> = {};
  
  // Extract vital signs
  const vitalPatterns = {
    bloodPressure: /(?:BP|blood pressure)[:\s]*(\d{2,3}\/\d{2,3})/gi,
    heartRate: /(?:HR|heart rate|pulse)[:\s]*(\d{2,3})/gi,
    temperature: /(?:temp|temperature)[:\s]*(\d{2,3}\.?\d*)/gi,
    weight: /(?:weight|wt)[:\s]*(\d{2,3}\.?\d*)\s*(?:kg|lb|lbs|pounds?)/gi,
    height: /(?:height|ht)[:\s]*(\d{1,2}['"]?\d*)\s*(?:in|inches?|cm|feet?)/gi
  };
  
  Object.entries(vitalPatterns).forEach(([key, pattern]) => {
    const matches = text.match(pattern);
    if (matches) {
      vitalSigns[key] = matches[0];
    }
  });
  
  // Extract medications (basic pattern matching)
  const medicationPattern = /(?:medication|med|drug)[:\s]*([^.\n]+)/gi;
  const medMatches = text.match(medicationPattern);
  if (medMatches) {
    medications.push(...medMatches.map(m => m.replace(/^(?:medication|med|drug)[:\s]*/i, '').trim()));
  }
  
  // Extract diagnoses
  const diagnosisPattern = /(?:diagnosis|dx|condition)[:\s]*([^.\n]+)/gi;
  const dxMatches = text.match(diagnosisPattern);
  if (dxMatches) {
    diagnoses.push(...dxMatches.map(m => m.replace(/^(?:diagnosis|dx|condition)[:\s]*/i, '').trim()));
  }
  
  // Extract lab values
  const labPatterns = {
    glucose: /glucose[:\s]*(\d{2,3})/gi,
    cholesterol: /cholesterol[:\s]*(\d{2,3})/gi,
    hemoglobin: /hemoglobin[:\s]*(\d{1,2}\.?\d*)/gi,
    creatinine: /creatinine[:\s]*(\d\.?\d*)/gi
  };
  
  Object.entries(labPatterns).forEach(([key, pattern]) => {
    const matches = text.match(pattern);
    if (matches) {
      labValues[key] = matches[0];
    }
  });
  
  return {
    vitalSigns,
    medications,
    diagnoses,
    labValues
  };
}

/**
 * Validate document content for medical relevance
 */
export function validateMedicalDocument(text: string): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  // Check for minimum content
  if (text.length < 50) {
    warnings.push('Document appears to be very short and may not contain useful medical information');
  }
  
  // Check for medical keywords
  const medicalKeywords = [
    'patient', 'diagnosis', 'treatment', 'medication', 'symptoms',
    'blood pressure', 'heart rate', 'temperature', 'weight', 'height',
    'lab', 'test', 'result', 'normal', 'abnormal', 'prescription'
  ];
  
  const foundKeywords = medicalKeywords.filter(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );
  
  if (foundKeywords.length < 3) {
    warnings.push('Document may not contain sufficient medical information');
    suggestions.push('Consider adding more clinical details or context');
  }
  
  // Check for personal information
  const personalInfoPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    /\b\d{3}-\d{3}-\d{4}\b/g, // Phone
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g // Email
  ];
  
  const hasPersonalInfo = personalInfoPatterns.some(pattern => pattern.test(text));
  if (hasPersonalInfo) {
    warnings.push('Document contains personal information that should be handled securely');
  }
  
  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions
  };
}

/**
 * Batch process multiple documents
 */
export async function batchProcessDocuments(
  files: File[],
  options: ProcessingOptions = {}
): Promise<{
  successful: Array<{ file: File; result: ProcessedDocument }>;
  failed: Array<{ file: File; error: string }>;
}> {
  const successful: Array<{ file: File; result: ProcessedDocument }> = [];
  const failed: Array<{ file: File; error: string }> = [];
  
  // Process files in parallel with a concurrency limit
  const concurrency = 3;
  const chunks = [];
  
  for (let i = 0; i < files.length; i += concurrency) {
    chunks.push(files.slice(i, i + concurrency));
  }
  
  for (const chunk of chunks) {
    const promises = chunk.map(async (file) => {
      try {
        const result = await processDocument(file, options);
        successful.push({ file, result });
      } catch (error) {
        failed.push({ 
          file, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });
    
    await Promise.all(promises);
  }
  
  return { successful, failed };
}
