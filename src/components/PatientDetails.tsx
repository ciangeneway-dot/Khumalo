import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Patient, Document, AISummary } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { generatePatientSummary } from '../lib/ai';
import { DocumentUpload } from './DocumentUpload';

type PatientDetailsProps = {
  patient: Patient;
  onPatientUpdated: () => void;
};

export function PatientDetails({ patient }: PatientDetailsProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [summaries, setSummaries] = useState<AISummary[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const loadDocuments = async () => {
    setLoadingDocs(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDocuments(data);
    }
    setLoadingDocs(false);
  };

  const loadSummaries = async () => {
    const { data, error } = await supabase
      .from('ai_summaries')
      .select('*')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSummaries(data);
    }
  };

  useEffect(() => {
    loadDocuments();
    loadSummaries();
  }, [patient.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const generateAISummary = async () => {
    if (!user) return;

    setGeneratingSummary(true);
    const summaryText = await generatePatientSummary({ patient, documents });

    const { error } = await supabase
      .from('ai_summaries')
      .insert({
        patient_id: patient.id,
        summary_text: summaryText,
        generated_by: user.id
      });

    if (!error) {
      await loadSummaries();
    }

    setGeneratingSummary(false);
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

  const handleDocumentUploaded = () => {
    setShowUploadModal(false);
    loadDocuments();
  };

  return (
    <div className="patient-details">
      <div className="patient-header">
        <div className="patient-avatar-large">
          {patient.first_name[0]}{patient.last_name[0]}
        </div>
        <div className="patient-header-info">
          <h2>{patient.first_name} {patient.last_name}</h2>
          <div className="patient-metadata">
            <span>MRN: {patient.medical_record_number}</span>
            <span>DOB: {formatDate(patient.date_of_birth)}</span>
            <span>Age: {calculateAge(patient.date_of_birth)} years</span>
          </div>
          {patient.email && <div className="patient-contact">📧 {patient.email}</div>}
          {patient.phone && <div className="patient-contact">📞 {patient.phone}</div>}
          {patient.address && <div className="patient-contact">📍 {patient.address}</div>}
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h3>AI Summary</h3>
          <button
            onClick={generateAISummary}
            disabled={generatingSummary}
            className="btn-primary btn-sm"
          >
            {generatingSummary ? 'Generating...' : '✨ Generate Summary'}
          </button>
        </div>
        <div className="summaries-list">
          {summaries.length === 0 ? (
            <div className="empty-section">
              No summaries generated yet. Click "Generate Summary" to create an AI-powered summary of this patient's records.
            </div>
          ) : (
            summaries.map((summary) => (
              <div key={summary.id} className="summary-card">
                <div className="summary-header">
                  <span className="summary-date">{formatDateTime(summary.created_at)}</span>
                </div>
                <pre className="summary-text">{summary.summary_text}</pre>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h3>Documents ({documents.length})</h3>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary btn-sm"
          >
            📎 Upload Document
          </button>
        </div>
        <div className="documents-list">
          {loadingDocs ? (
            <div className="loading-section">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="empty-section">
              No documents uploaded yet. Click "Upload Document" to add patient files.
            </div>
          ) : (
            <table className="documents-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Description</th>
                  <th>Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="doc-filename">📄 {doc.file_name}</td>
                    <td>{doc.file_type}</td>
                    <td>{formatFileSize(doc.file_size)}</td>
                    <td>{doc.description || '-'}</td>
                    <td>{formatDateTime(doc.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showUploadModal && (
        <DocumentUpload
          patientId={patient.id}
          onClose={() => setShowUploadModal(false)}
          onDocumentUploaded={handleDocumentUploaded}
        />
      )}
    </div>
  );
}
