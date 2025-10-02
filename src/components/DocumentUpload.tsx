import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type DocumentUploadProps = {
  patientId: string;
  onClose: () => void;
  onDocumentUploaded: () => void;
};

export function DocumentUpload({ patientId, onClose, onDocumentUploaded }: DocumentUploadProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file) return;

    setError('');
    setLoading(true);

    const filePath = `${patientId}/${Date.now()}-${file.name}`;

    const { error: dbError } = await supabase
      .from('documents')
      .insert({
        patient_id: patientId,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        description: description || null,
        uploaded_by: user.id
      });

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
    } else {
      onDocumentUploaded();
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

          <div className="form-group">
            <label htmlFor="file">Select File *</label>
            <input
              id="file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
              disabled={loading}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            />
            {file && (
              <div className="file-info">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
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
            <button type="submit" className="btn-primary" disabled={loading || !file}>
              {loading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
