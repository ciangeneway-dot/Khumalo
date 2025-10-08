import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

// Azure Storage configuration
const AZURE_STORAGE_ACCOUNT_NAME = import.meta.env.VITE_AZURE_STORAGE_ACCOUNT_NAME;
const AZURE_STORAGE_ACCOUNT_KEY = import.meta.env.VITE_AZURE_STORAGE_ACCOUNT_KEY;
const AZURE_STORAGE_CONTAINER_NAME = 'patient-documents';

// Create Azure Storage client
function createBlobServiceClient() {
  if (!AZURE_STORAGE_ACCOUNT_NAME || !AZURE_STORAGE_ACCOUNT_KEY) {
    throw new Error('Azure Storage credentials not configured');
  }

  const sharedKeyCredential = new StorageSharedKeyCredential(
    AZURE_STORAGE_ACCOUNT_NAME,
    AZURE_STORAGE_ACCOUNT_KEY
  );

  return new BlobServiceClient(
    `https://${AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
    sharedKeyCredential
  );
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  contentType: string;
  patientId: string;
  description?: string;
}

/**
 * Upload a file to Azure Blob Storage
 * Optimized for handling large volumes of medical documents
 */
export async function uploadDocument(
  file: File,
  metadata: DocumentMetadata
): Promise<UploadResult> {
  try {
    const blobServiceClient = createBlobServiceClient();
    const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_NAME);
    
    // Ensure container exists
    await containerClient.createIfNotExists({
      access: 'private' // HIPAA compliance - private access only
    });

    // Create a unique blob name with patient ID and timestamp
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const blobName = `${metadata.patientId}/${timestamp}-${sanitizedFileName}`;
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload file with metadata
    const uploadOptions = {
      blobHTTPHeaders: {
        blobContentType: metadata.contentType,
      },
      metadata: {
        patientId: metadata.patientId,
        originalFileName: metadata.fileName,
        uploadedAt: new Date().toISOString(),
        description: metadata.description || '',
      },
      // Use chunked upload for large files (>4MB)
      onProgress: (progress: any) => {
        console.log(`Upload progress: ${progress.loadedBytes}/${file.size} bytes`);
      }
    };

    const uploadResponse = await blockBlobClient.uploadData(file, uploadOptions);
    
    if (uploadResponse.requestId) {
      return {
        success: true,
        url: blockBlobClient.url
      };
    } else {
      return {
        success: false,
        error: 'Upload failed - no request ID returned'
      };
    }
  } catch (error) {
    console.error('Azure Storage upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
}

/**
 * Delete a document from Azure Blob Storage
 */
export async function deleteDocument(blobUrl: string): Promise<UploadResult> {
  try {
    const blobServiceClient = createBlobServiceClient();
    const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_NAME);
    
    // Extract blob name from URL
    const urlParts = blobUrl.split('/');
    const blobName = urlParts.slice(4).join('/'); // Remove domain and container name
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
    
    return { success: true };
  } catch (error) {
    console.error('Azure Storage delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown delete error'
    };
  }
}

/**
 * Get a signed URL for secure document access
 * Expires in 1 hour for security
 */
export async function getDocumentUrl(blobUrl: string): Promise<string | null> {
  try {
    const blobServiceClient = createBlobServiceClient();
    const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_NAME);
    
    // Extract blob name from URL
    const urlParts = blobUrl.split('/');
    const blobName = urlParts.slice(4).join('/');
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Generate signed URL valid for 1 hour
    const expiresOn = new Date();
    expiresOn.setHours(expiresOn.getHours() + 1);
    
    const signedUrl = await blockBlobClient.generateSasUrl({
      permissions: 'r', // Read only
      expiresOn
    });
    
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
}

/**
 * Batch upload multiple documents
 * Optimized for handling large numbers of files
 */
export async function batchUploadDocuments(
  files: File[],
  patientId: string,
  onProgress?: (completed: number, total: number) => void
): Promise<{ successful: UploadResult[]; failed: UploadResult[] }> {
  const results: UploadResult[] = [];
  const batchSize = 5; // Process 5 files at a time to avoid overwhelming the API
  
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (file) => {
      const metadata: DocumentMetadata = {
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        patientId,
        description: `Batch upload - ${file.name}`
      };
      
      return uploadDocument(file, metadata);
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Report progress
    if (onProgress) {
      onProgress(i + batch.length, files.length);
    }
    
    // Small delay between batches to avoid rate limiting
    if (i + batchSize < files.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  return { successful, failed };
}

/**
 * Get storage usage statistics
 */
export async function getStorageStats(): Promise<{
  totalFiles: number;
  totalSize: number;
  containerName: string;
}> {
  try {
    const blobServiceClient = createBlobServiceClient();
    const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_NAME);
    
    let totalFiles = 0;
    let totalSize = 0;
    
    for await (const blob of containerClient.listBlobsFlat()) {
      totalFiles++;
      totalSize += blob.properties.contentLength || 0;
    }
    
    return {
      totalFiles,
      totalSize,
      containerName: AZURE_STORAGE_CONTAINER_NAME
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return {
      totalFiles: 0,
      totalSize: 0,
      containerName: AZURE_STORAGE_CONTAINER_NAME
    };
  }
}
