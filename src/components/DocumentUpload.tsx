import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { uploadDocument, batchUploadDocuments } from '../lib/azure-storage';
import { processDocument, validateMedicalDocument } from '../lib/document-processor';
import { createDocument } from '../lib/azure-database';

type DocumentUploadProps = {
  patientId: string;
  onClose: () => void;
  onDocumentUploaded: () => void;
};

export function DocumentUpload({ patientId, onClose, onDocumentUploaded }: DocumentUploadProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 });
  const [processingStep, setProcessingStep] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || files.length === 0) return;

    setError('');
    setLoading(true);
    setUploadProgress({ completed: 0, total: files.length });

    try {
      // Process documents first
      setProcessingStep('Processing documents...');
      const processedDocuments: Array<{ file: File; text: string; metadata: any }> = [];
      
      for (const file of files) {
        try {
          const processed = await processDocument(file);
          const validation = validateMedicalDocument(processed.text);
          
          if (!validation.isValid) {
            console.warn(`Document ${file.name} validation warnings:`, validation.warnings);
          }
          
          processedDocuments.push({
            file,
            text: processed.text,
            metadata: processed.metadata
          });
        } catch (error) {
          console.error(`Failed to process ${file.name}:`, error);
          // Continue with other files even if one fails
        }
      }

      // Upload to Azure Storage
      setProcessingStep('Uploading to secure storage...');
      const uploadResults = await batchUploadDocuments(
        files,
        patientId,
        (completed, total) => {
          setUploadProgress({ completed, total });
        }
      );

      // Save document metadata to database
      setProcessingStep('Saving document records...');
      
      for (let i = 0; i < uploadResults.successful.length; i++) {
        const result = uploadResults.successful[i];
        const file = files[i];
        const processed = processedDocuments.find(p => p.file === file);
        
        await createDocument({
          patientId: patientId,
          fileName: file.name,
          filePath: result.url || '',
          fileType: file.type,
          fileSize: file.size,
          description: description || null,
          uploadedBy: user.id,
          processedText: processed ? processed.text.substring(0, 1000) : undefined
        });
      }

      if (uploadResults.failed.length > 0) {
        setError(`${uploadResults.failed.length} files failed to upload. ${uploadResults.successful.length} files uploaded successfully.`);
      } else {
        onDocumentUploaded();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setLoading(false);
      setProcessingStep('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upload Document</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {processingStep && (
            <div className="processing-status">
              <div className="processing-step">{processingStep}</div>
              {uploadProgress.total > 0 && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(uploadProgress.completed / uploadProgress.total) * 100}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="files">Select Files * (Multiple files supported)</label>
            <input
              id="files"
              type="file"
              multiple
              onChange={handleFileChange}
              required
              disabled={loading}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.tiff,.bmp"
            />
            {files.length > 0 && (
              <div className="files-info">
                <div className="files-count">{files.length} file(s) selected</div>
                <div className="files-list">
                  {files.map((file, index) => (
                    <div key={index} className="file-item">
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the document (optional)"
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || files.length === 0}>
              {loading ? 'Processing...' : `Upload ${files.length} Document${files.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
