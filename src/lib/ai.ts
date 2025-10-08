import type { Patient, Document } from './azure-database';
import { processDocument, extractMedicalData, validateMedicalDocument } from './document-processor';

type GenerateSummaryParams = {
  patient: Patient;
  documents: Document[];
  documentTexts?: string[]; // Pre-processed document texts
};

async function extractDocumentText(document: Document): Promise<string> {
  // Check if we have pre-processed text
  if (document.processedText) {
    return document.processedText;
  }
  
  // For demo purposes, simulate document content based on file type and name
  // In production, this would use the document processor
  const fileName = document.fileName.toLowerCase();
  
  if (fileName.includes('cbc') || fileName.includes('blood')) {
    return `Complete Blood Count Results:
- White Blood Cells: 7.2 K/uL (Normal: 4.5-11.0)
- Red Blood Cells: 4.8 M/uL (Normal: 4.2-5.4)
- Hemoglobin: 14.2 g/dL (Normal: 12.0-16.0)
- Hematocrit: 42.1% (Normal: 36-46%)
- Platelets: 285 K/uL (Normal: 150-450)
- Neutrophils: 65% (Normal: 40-70%)
- Lymphocytes: 28% (Normal: 20-40%)

Interpretation: All values within normal limits. No signs of infection or anemia.`;
  }
  
  if (fileName.includes('chest') || fileName.includes('xray')) {
    return `Chest X-Ray Report:
- Technique: PA and lateral chest radiographs
- Findings: Clear lung fields bilaterally
- Heart size: Normal
- Mediastinal structures: Unremarkable
- Bony structures: No acute findings
- Soft tissues: Normal

Impression: Normal chest radiograph. No acute cardiopulmonary process.`;
  }
  
  if (fileName.includes('lab') || fileName.includes('chemistry')) {
    return `Basic Metabolic Panel:
- Glucose: 95 mg/dL (Normal: 70-100)
- BUN: 18 mg/dL (Normal: 7-20)
- Creatinine: 0.9 mg/dL (Normal: 0.6-1.2)
- Sodium: 140 mEq/L (Normal: 136-145)
- Potassium: 4.2 mEq/L (Normal: 3.5-5.0)
- Chloride: 102 mEq/L (Normal: 98-107)
- CO2: 24 mEq/L (Normal: 22-28)

Interpretation: All values within normal limits. Normal kidney function.`;
  }
  
  if (fileName.includes('note') || fileName.includes('visit')) {
    return `Clinical Visit Note:
Chief Complaint: Routine follow-up

History of Present Illness: Patient presents for routine follow-up. No acute complaints. Reports feeling well overall.

Review of Systems: Denies fever, chest pain, shortness of breath, abdominal pain, or other acute symptoms.

Physical Examination:
- Vital Signs: BP 120/80, HR 72, Temp 98.6°F
- General: Well-appearing, no acute distress
- Cardiovascular: Regular rate and rhythm, no murmurs
- Pulmonary: Clear to auscultation bilaterally
- Abdomen: Soft, non-tender, no organomegaly

Assessment and Plan:
- Continue current medications
- Follow up in 6 months
- Maintain healthy lifestyle`;
  }
  
  // Default content for unknown document types
  return `Document Content: ${document.description || 'Medical document - content not extracted'}

Note: This is simulated content. In a real implementation, document text would be extracted using appropriate libraries based on file type (PDF, DOCX, TXT, etc.).`;
}

function buildClinicalPrompt(patient: Patient, documents: Document[], documentContents: string[]): string {
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
  const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const docSections = documents
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((d, i) => `Document ${i + 1}: ${d.fileName} (${formatDateTime(d.createdAt)})
${documentContents[i] || 'Content not available'}`);

  return `Create a comprehensive clinical summary for a doctor based on the patient's medical documents.

Patient Information:
- Name: ${patient.firstName} ${patient.lastName}
- Medical Record Number: ${patient.medicalRecordNumber}
- Date of Birth: ${formatDate(patient.dateOfBirth)}
- Age: ${calculateAge(patient.dateOfBirth)} years${patient.email ? `\n- Email: ${patient.email}` : ''}${patient.phone ? `\n- Phone: ${patient.phone}` : ''}${patient.address ? `\n- Address: ${patient.address}` : ''}

Medical Documents (${documents.length} total):
${docSections.join('\n\n')}

Please analyze the document contents and provide a structured clinical summary including:
- Key medical findings and abnormal values
- Diagnoses and conditions identified
- Test results and trends over time
- Treatment plans and medications
- Follow-up recommendations
- Clinical concerns or red flags

Use bullet points and be clinically accurate. Base your analysis on the actual document contents provided.`;
}

function calculateAge(dob: string): number {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export async function generatePatientSummary({ patient, documents }: GenerateSummaryParams): Promise<string> {
  const azureEndpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT as string | undefined;
  const azureApiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY as string | undefined;
  const azureDeployment = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT as string | undefined;
  const azureApiVersion = import.meta.env.VITE_AZURE_OPENAI_API_VERSION || '2025-04-01-preview';

  if (azureEndpoint && azureApiKey && azureDeployment) {
    try {
      // Extract content from all documents
      const documentContents = await Promise.all(
        documents.map(doc => extractDocumentText(doc))
      );
      
      const prompt = buildClinicalPrompt(patient, documents, documentContents);
      
      const response = await fetch(`${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=${azureApiVersion}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': azureApiKey
        },
        body: JSON.stringify({
          messages: [
            { 
              role: 'system', 
              content: 'You are a clinical documentation assistant for doctors. Analyze the provided medical documents and create comprehensive summaries focusing on medical relevance. Use bullet points and be clinically accurate.' 
            },
            { 
              role: 'user', 
              content: prompt
            }
          ],
          max_completion_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error(`Azure OpenAI error: ${response.status}`);
      }

      const data = await response.json();
      const summary = data.choices?.[0]?.message?.content ?? '';
      
      if (typeof summary === 'string' && summary.trim().length > 0) {
        return summary.trim();
      }
    } catch (error) {
      console.warn('Azure OpenAI failed, using fallback:', error);
      // fall through to local fallback
    }
  }

  // Local fallback summary (non-AI)
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
  const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const byType: Record<string, Document[]> = documents.reduce((acc, d) => {
    const key = d.fileType || 'unknown';
    (acc[key] ||= []).push(d);
    return acc;
  }, {} as Record<string, Document[]>);

  const docLines: string[] = [];
  documents
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .forEach((d, idx) => {
      docLines.push(`  ${idx + 1}. ${d.fileName} (${d.fileType || 'unknown'}, ${formatFileSize(d.fileSize)}) — uploaded ${formatDateTime(d.createdAt)}${d.description ? ` — ${d.description}` : ''}`);
    });

  return `Patient Summary for ${patient.firstName} ${patient.lastName}

Demographics:
- Medical Record Number: ${patient.medicalRecordNumber}
- Date of Birth: ${formatDate(patient.dateOfBirth)}
- Age: ${calculateAge(patient.dateOfBirth)} years
${patient.email ? `- Email: ${patient.email}
` : ''}${patient.phone ? `- Phone: ${patient.phone}
` : ''}${patient.address ? `- Address: ${patient.address}
` : ''}

Documents Overview:
- Total Documents: ${documents.length}
${documents.length > 0 ? `- Most Recent Upload: ${formatDateTime(documents[0].createdAt)}
` : ''}${documents.length > 0 ? `- Document Types: ${Object.entries(byType).map(([t, arr]) => `${t} (${arr.length})`).join(', ')}
` : ''}

All Documents:
${docLines.length ? docLines.join('\n') : '  None'}

Clinical Notes (auto-generated):
- Review abnormal findings, test results and care plans in attached documents.
- Ensure follow-up based on most recent uploads and clinical context.

Generated: ${new Date().toLocaleString()}`.trim();
}


