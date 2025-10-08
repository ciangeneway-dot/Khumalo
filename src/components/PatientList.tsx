import type { Patient } from '../lib/azure-database';

type PatientListProps = {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  loading: boolean;
};

export function PatientList({ patients, selectedPatient, onSelectPatient, loading }: PatientListProps) {
  if (loading) {
    return (
      <div className="patient-list">
        <div className="loading-state">Loading patients...</div>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="patient-list">
        <div className="empty-list">No patients found. Create a new patient to get started.</div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="patient-list">
      {patients.map((patient) => (
        <div
          key={patient.rowKey}
          className={`patient-item ${selectedPatient?.rowKey === patient.rowKey ? 'active' : ''}`}
          onClick={() => onSelectPatient(patient)}
        >
          <div className="patient-avatar">
            {patient.firstName[0]}{patient.lastName[0]}
          </div>
          <div className="patient-info">
            <div className="patient-name">
              {patient.firstName} {patient.lastName}
            </div>
            <div className="patient-meta">
              MRN: {patient.medicalRecordNumber}
            </div>
            <div className="patient-meta">
              DOB: {formatDate(patient.dateOfBirth)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
