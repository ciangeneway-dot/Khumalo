import { TableClient, AzureNamedKeyCredential } from '@azure/data-tables';

// Azure Table Storage configuration
const accountName = import.meta.env.VITE_AZURE_STORAGE_ACCOUNT_NAME || '';
const accountKey = import.meta.env.VITE_AZURE_STORAGE_ACCOUNT_KEY || '';
const tableName = 'medicaldata';

// Create table client
const credential = new AzureNamedKeyCredential(accountName, accountKey);
const tableClient = new TableClient(
  `https://${accountName}.table.core.windows.net`,
  tableName,
  credential
);

// Ensure table exists
export const initializeTable = async () => {
  try {
    await tableClient.createTable();
    console.log('Table created or already exists');
  } catch (error) {
    console.error('Error creating table:', error);
  }
};

// Patient entity type
export interface Patient {
  partitionKey: string; // 'patient'
  rowKey: string; // patient ID
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email?: string;
  phone?: string;
  address?: string;
  medicalRecordNumber: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Document entity type
export interface Document {
  partitionKey: string; // patient ID
  rowKey: string; // document ID
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  description?: string;
  uploadedBy: string;
  createdAt: string;
  processedText?: string;
}

// AI Summary entity type
export interface AISummary {
  partitionKey: string; // patient ID
  rowKey: string; // summary ID
  summaryText: string;
  generatedBy: string;
  createdAt: string;
  documentIds: string; // Comma-separated document IDs
}

// Patient operations
export const createPatient = async (patient: Omit<Patient, 'partitionKey' | 'rowKey' | 'createdAt' | 'updatedAt'>): Promise<Patient> => {
  const now = new Date().toISOString();
  const patientId = `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const patientEntity: Patient = {
    partitionKey: 'patient',
    rowKey: patientId,
    ...patient,
    createdAt: now,
    updatedAt: now,
  };

  await tableClient.createEntity(patientEntity);
  return patientEntity;
};

export const getPatients = async (): Promise<Patient[]> => {
  const entities = tableClient.listEntities<Patient>({
    queryOptions: { filter: "PartitionKey eq 'patient'" }
  });

  const patients: Patient[] = [];
  for await (const entity of entities) {
    patients.push(entity);
  }

  return patients.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getPatient = async (patientId: string): Promise<Patient | null> => {
  try {
    const entity = await tableClient.getEntity<Patient>('patient', patientId);
    return entity;
  } catch (error) {
    console.error('Error getting patient:', error);
    return null;
  }
};

export const updatePatient = async (patient: Patient): Promise<Patient> => {
  const updatedPatient = {
    ...patient,
    updatedAt: new Date().toISOString(),
  };

  await tableClient.updateEntity(updatedPatient, 'Replace');
  return updatedPatient;
};

export const deletePatient = async (patientId: string): Promise<void> => {
  await tableClient.deleteEntity('patient', patientId);
};

// Document operations
export const createDocument = async (document: Omit<Document, 'partitionKey' | 'rowKey' | 'createdAt'>): Promise<Document> => {
  const now = new Date().toISOString();
  const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const documentEntity: Document = {
    partitionKey: document.patientId,
    rowKey: documentId,
    ...document,
    createdAt: now,
  };

  await tableClient.createEntity(documentEntity);
  return documentEntity;
};

export const getDocuments = async (patientId: string): Promise<Document[]> => {
  const entities = tableClient.listEntities<Document>({
    queryOptions: { filter: `PartitionKey eq '${patientId}'` }
  });

  const documents: Document[] = [];
  for await (const entity of entities) {
    if (entity.rowKey.startsWith('doc_')) {
      documents.push(entity);
    }
  }

  return documents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const deleteDocument = async (patientId: string, documentId: string): Promise<void> => {
  await tableClient.deleteEntity(patientId, documentId);
};

// AI Summary operations
export const createAISummary = async (summary: Omit<AISummary, 'partitionKey' | 'rowKey' | 'createdAt'>): Promise<AISummary> => {
  const now = new Date().toISOString();
  const summaryId = `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const summaryEntity: AISummary = {
    partitionKey: summary.patientId,
    rowKey: summaryId,
    ...summary,
    createdAt: now,
  };

  await tableClient.createEntity(summaryEntity);
  return summaryEntity;
};

export const getAISummaries = async (patientId: string): Promise<AISummary[]> => {
  const entities = tableClient.listEntities<AISummary>({
    queryOptions: { filter: `PartitionKey eq '${patientId}'` }
  });

  const summaries: AISummary[] = [];
  for await (const entity of entities) {
    if (entity.rowKey.startsWith('summary_')) {
      summaries.push(entity);
    }
  }

  return summaries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Search patients
export const searchPatients = async (query: string): Promise<Patient[]> => {
  const allPatients = await getPatients();
  
  const searchTerm = query.toLowerCase();
  return allPatients.filter(patient => 
    patient.firstName.toLowerCase().includes(searchTerm) ||
    patient.lastName.toLowerCase().includes(searchTerm) ||
    patient.medicalRecordNumber.toLowerCase().includes(searchTerm) ||
    patient.email?.toLowerCase().includes(searchTerm)
  );
};
