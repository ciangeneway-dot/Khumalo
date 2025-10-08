import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getPatients, initializeTable, type Patient } from '../lib/azure-database';
import { PatientList } from './PatientList';
import { PatientDetails } from './PatientDetails';
import { NewPatientModal } from './NewPatientModal';

export function Dashboard() {
  const { signOut, user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPatients = async () => {
    setLoading(true);
    try {
      await initializeTable();
      const data = await getPatients();
      setPatients(data);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handlePatientCreated = () => {
    setShowNewPatientModal(false);
    loadPatients();
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo-small">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="8" fill="#0066CC"/>
              <path d="M20 10V30M10 20H30" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <h1>Healthcare Portal</h1>
        </div>
        <div className="header-right">
          <span className="user-email">{user?.email}</span>
          <button onClick={signOut} className="btn-secondary">
            Sign Out
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>Patients</h2>
            <button
              onClick={() => setShowNewPatientModal(true)}
              className="btn-primary btn-sm"
            >
              + New Patient
            </button>
          </div>
          <PatientList
            patients={patients}
            selectedPatient={selectedPatient}
            onSelectPatient={setSelectedPatient}
            loading={loading}
          />
        </div>

        <div className="main-content">
          {selectedPatient ? (
            <PatientDetails
              patient={selectedPatient}
              onPatientUpdated={loadPatients}
            />
          ) : (
            <div className="empty-state">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="38" stroke="#E0E0E0" strokeWidth="4"/>
                <path d="M40 25V55M25 40H55" stroke="#E0E0E0" strokeWidth="4" strokeLinecap="round"/>
              </svg>
              <h3>No Patient Selected</h3>
              <p>Select a patient from the list to view their details and documents</p>
            </div>
          )}
        </div>
      </div>

      {showNewPatientModal && (
        <NewPatientModal
          onClose={() => setShowNewPatientModal(false)}
          onPatientCreated={handlePatientCreated}
        />
      )}
    </div>
  );
}
