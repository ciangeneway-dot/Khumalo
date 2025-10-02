import type { Patient } from '../lib/supabase';

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
          key={patient.id}
          className={`patient-item ${selectedPatient?.id === patient.id ? 'active' : ''}`}
          onClick={() => onSelectPatient(patient)}
        >
          <div className="patient-avatar">
            {patient.first_name[0]}{patient.last_name[0]}
          </div>
          <div className="patient-info">
            <div className="patient-name">
              {patient.first_name} {patient.last_name}
            </div>
            <div className="patient-meta">
              MRN: {patient.medical_record_number}
            </div>
            <div className="patient-meta">
              DOB: {formatDate(patient.date_of_birth)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
