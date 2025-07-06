import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import axios from '../shared/api/axios';
import axiosOriginal from 'axios'; // Import the original axios for direct requests
import { API_ENDPOINTS } from '../shared/api/api.config';
import { Patient, Visit, Document, Doctor, ModeleFormulaire, SectionFormulaire, ChampFormulaire, FormReponse, FormSubmissionPayload } from '../dashboard/types';
import DoctorAssignmentModal from './DoctorAssignmentModal';
import PatientEdit from './PatientEdit';
import VitalSignsBiometrics from './VitalSignsBiometrics';
import VitalSignsHeader from './VitalSignsHeader';
import './PatientProfile.css';
import { useToast } from '../shared/components/ToastContext';
import NoActiveVisitAlert from '../shared/components/NoActiveVisitAlert';

// Visit types from the backend
const VISIT_TYPES = [
  { id: "CONSULTATION", label: "Consultation" },
  { id: "SUIVI", label: "Suivi" },
  { id: "CONTROLE", label: "Contrôle" }
];

// Icons
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const WarningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const VitalSignsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
  </svg>
);

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const DocumentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const PDFIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <rect x="6" y="13" width="12" height="8"></rect>
  </svg>
);

const VisitIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="9" y1="3" x2="9" y2="21"></line>
    <line x1="15" y1="3" x2="15" y2="21"></line>
    <line x1="3" y1="9" x2="21" y2="9"></line>
    <line x1="3" y1="15" x2="21" y2="15"></line>
  </svg>
);

const PenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"></path>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
  </svg>
);

const FormIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <path d="M14 2v6h6"></path>
    <line x1="8" y1="13" x2="16" y2="13"></line>
    <line x1="8" y1="17" x2="16" y2="17"></line>
    <line x1="8" y1="9" x2="12" y2="9"></line>
  </svg>
);

const PatientSummaryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

// Add prescription icon for new tab
const PrescriptionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"></path>
    <path d="M8 12h2"></path>
    <path d="M8 16h2"></path>
    <path d="M14 12h2"></path>
    <path d="M14 16h2"></path>
    <path d="M8 8h8"></path>
  </svg>
);

const AllergiesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1H8.3z"></path>
    <path d="M14.3 10v3a1.3 1.3 0 0 1-1.3 1.3h-2a1.3 1.3 0 0 1-1.3-1.3v-3"></path>
    <path d="M12 22c-3.312 0-6-2.688-6-6 0-3.312 2.688-6 6-6 3.312 0 6 2.688 6 6 0 3.312-2.688 6-6 6z"></path>
    <path d="M8.7 16c.316-.618.96-1 1.7-1h3.2c.74 0 1.384.382 1.7 1"></path>
    <path d="M9 19c.316-.618.96-1 1.7-1h2.6c.74 0 1.384.382 1.7 1"></path>
  </svg>
);

// Right arrow icon for panel close buttons
const RightArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"></path>
    <path d="M12 5l7 7-7 7"></path>
  </svg>
);

// Function to fetch and cache doctor names
const doctorCache = new Map<string, string>();
const fetchingDoctors = new Set<string>();

// This object will store setTimeout IDs to prevent duplicate fetches
const doctorFetchTimers = new Map<string, number>();

const getDoctorName = (doctorId: string): string => {
  // Check cache first
  if (doctorCache.has(doctorId)) {
    return doctorCache.get(doctorId) || "Unknown";
  }
  
  // If we're already fetching this doctor, just return the loading state
  if (fetchingDoctors.has(doctorId)) {
    return "Chargement...";
  }
  
  // Mark this doctor as being fetched
  fetchingDoctors.add(doctorId);
  
  // Clear any existing timer for this doctor
  if (doctorFetchTimers.has(doctorId)) {
    clearTimeout(doctorFetchTimers.get(doctorId));
  }
  
  // Set a new timer to fetch the doctor (with a small delay to prevent flooding)
  const timerId = window.setTimeout(() => {
    console.log(`Fetching doctor with ID: ${doctorId}`);
    axios.get(API_ENDPOINTS.DOCTORS.GET_BY_ID(doctorId))
      .then(response => {
        console.log(`Doctor data received for ID ${doctorId}:`, response.data);
        if (response.data) {
          const doctor = response.data.medecin || response.data;
          if (doctor && doctor.prenom && doctor.nom) {
            const doctorName = `${doctor.prenom} ${doctor.nom}`;
            doctorCache.set(doctorId, doctorName);
            
            // Update all elements showing this doctor
            document.querySelectorAll(`[data-doctor-id="${doctorId}"]`).forEach(el => {
              el.textContent = `Dr. ${doctorName}`;
              // Add a highlight effect to show the update
              el.classList.add('updated-name');
              setTimeout(() => el.classList.remove('updated-name'), 2000);
            });
            console.log(`Updated doctor name to: Dr. ${doctorName}`);
          } else {
            console.error(`Invalid doctor data for ID ${doctorId}:`, doctor);
            doctorCache.set(doctorId, "Médecin inconnu");
          }
        }
      })
      .catch(error => {
        console.error(`Error fetching doctor ${doctorId}:`, error);
        doctorCache.set(doctorId, "Médecin inconnu");
      })
      .finally(() => {
        // Remove from the fetching set when done
        fetchingDoctors.delete(doctorId);
        doctorFetchTimers.delete(doctorId);
      });
  }, 100);
  
  doctorFetchTimers.set(doctorId, timerId);
  
  return "Chargement...";
};

// Start Visit Form Component
interface StartVisitFormProps {
  isOpen: boolean;
  onClose: () => void;
  patientIPP: string;
  onSuccess: () => void;
}

const StartVisitForm = ({ isOpen, onClose, patientIPP, onSuccess }: StartVisitFormProps) => {
  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD format
  });
  
  const [time, setTime] = useState<string>(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  
  const [motif, setMotif] = useState<string>('');
  const [selectedVisitType, setSelectedVisitType] = useState<string>('');
  const [service, setService] = useState<string>('Consultation Générale');
  const [idMedecin, setIdMedecin] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setDate(now.toISOString().split('T')[0]);
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTime(`${hours}:${minutes}`);
      setMotif('');
      setSelectedVisitType('');
      setService('Consultation Générale'); // Default service value
      setIdMedecin(null);
      setSelectedDoctor(null);
      setError(null);
      fetchDoctors();
    }
  }, [isOpen]);
  
  // Fetch doctors for selection
  const fetchDoctors = async () => {
    try {
      setIsLoadingDoctors(true);
      const response = await axios.get(API_ENDPOINTS.DOCTORS.GET_ALL);
      
      if (response.data && response.data.medecins) {
        setDoctors(response.data.medecins);
      } else {
        setDoctors([]);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError('Impossible de récupérer la liste des médecins.');
    } finally {
      setIsLoadingDoctors(false);
    }
  };
  
  // No filtering needed anymore
  const filteredVisitTypes = VISIT_TYPES;
  
  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!selectedVisitType) {
      setError('Veuillez sélectionner un type de visite');
      return;
    }
    
    if (!motif.trim()) {
      setError('Veuillez entrer un motif de visite');
      return;
    }
    
    // Combine date and time
    const dateTime = new Date(`${date}T${time}`);
    
    if (isNaN(dateTime.getTime())) {
      setError('Date ou heure invalide');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const payload = {
        typeVisite: selectedVisitType,
        motif: motif.trim(),
        service: service.trim(),
        idMedecin,
        dateDebut: dateTime.toISOString()
      };
      
      console.log('Starting visit with payload:', payload);
      console.log('Endpoint:', API_ENDPOINTS.VISITS.CREATE(patientIPP));
      
      const response = await axios.post(API_ENDPOINTS.VISITS.CREATE(patientIPP), payload);
      
      console.log('Start visit response:', response.data);
      
      // Success
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Error starting visit:', error);
      const err = error as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Une erreur est survenue lors du démarrage de la visite');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      {/* Overlay for the sliding panel */}
      <div 
        className={`sliding-panel-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />
      
      {/* Sliding panel */}
    <div className={`sliding-panel ${isOpen ? 'open' : ''}`}>
      <div className="sliding-panel-content">
        <div className="sliding-panel-header">
          <h2>Démarrer une visite</h2>
          <button className="close-panel-button" onClick={onClose}>
            <RightArrowIcon />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="visit-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="visit-date">Date</label>
                <div className="input-with-icon">
                  <input 
                    type="date" 
                    id="visit-date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="visit-time">Heure</label>
                <div className="input-with-icon">
                  <input 
                    type="time" 
                    id="visit-time" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="form-section">
            <h3>Motif de la visite</h3>
            <div className="form-group">
              <input 
                type="text"
                placeholder="Entrez le motif de la visite"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="form-section">
            <h3>Type de visite</h3>
            <div className="radio-group">
              {filteredVisitTypes.map((type) => (
                <label key={type.id} className="radio-option">
                  <input 
                    type="radio"
                    name="visitType"
                    value={type.id}
                    checked={selectedVisitType === type.id}
                    onChange={() => setSelectedVisitType(type.id)}
                  />
                  <span className="radio-label">{type.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="form-section">
            <h3>Service</h3>
            <div className="form-group">
                <select
                  id="service"
                  name="service"
                value={service}
                onChange={(e) => setService(e.target.value)}
                required
                >
                  <option value="">Sélectionner un service</option>
                  <option value="Médecine Générale">Médecine Générale</option>
                  <option value="Pédiatrie">Pédiatrie</option>
                  <option value="Orthopédie">Orthopédie</option>
                  <option value="Dermatologie">Dermatologie</option>
                </select>
            </div>
          </div>
          
          <div className="form-section">
              <h3>Prestataire</h3>
              <div className="form-group">
                <select
                  id="idMedecin"
                  className="doctor-select"
                  value={idMedecin || ''}
                  onChange={(e) => {
                    setIdMedecin(e.target.value || null);
                    if (e.target.value) {
                      const foundDoctor = doctors.find(doc => doc.idMedecin === e.target.value);
                      setSelectedDoctor(foundDoctor || null);
                    } else {
                      setSelectedDoctor(null);
                    }
                  }}
                >
                  <option value="">Sélectionner un prestataire</option>
                  {Array.isArray(doctors) && doctors
                    .filter((doc: Doctor) => !service || doc.nomSpecialite === service)
                    .map((doc: Doctor) => (
                    <option key={doc.idMedecin} value={doc.idMedecin}>
                      Dr. {doc.prenom} {doc.nom} ({doc.nomSpecialite})
                    </option>
                  ))}
                </select>
                {isLoadingDoctors && <div className="mini-loader"></div>}
                  </div>
                </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={onClose} 
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button 
                type="submit" 
                className="submit-btn" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'En cours...' : 'Démarrer la visite'}
              </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

// Confirmation Modal Component
interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }: ConfirmationModalProps) => {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">
            <WarningIcon />
            <h3>{title}</h3>
          </div>
          <button className="close-modal-button" onClick={onCancel}>
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onCancel}>Annuler</button>
          <button className="submit-btn" onClick={onConfirm}>Confirmer</button>
        </div>
      </div>
    </div>
  );
};

// Edit Visit Form Component
interface EditVisitFormProps {
  isOpen: boolean;
  onClose: () => void;
  visit: Visit | null;
  onSuccess: () => void;
}

const EditVisitForm = ({ isOpen, onClose, visit, onSuccess }: EditVisitFormProps) => {
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [motif, setMotif] = useState<string>('');
  const [selectedVisitType, setSelectedVisitType] = useState<string>('');
  const [service, setService] = useState<string>('');
  const [idMedecin, setIdMedecin] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize form with visit data
  useEffect(() => {
    if (isOpen && visit) {
      // Parse the date and time
      const visitDate = new Date(visit.dateDebut);
      
      // Set form fields
      setDate(visitDate.toISOString().split('T')[0]);
      setTime(
        `${String(visitDate.getHours()).padStart(2, '0')}:${String(visitDate.getMinutes()).padStart(2, '0')}`
      );
      
      setMotif(visit.motif || '');
      setSelectedVisitType(visit.typeVisite || '');
      setService(visit.service || '');
      setIdMedecin(visit.idMedecin || null);
      setError(null);
      
      // If the visit has doctor information embedded, use it directly
      if (visit.medecin) {
        console.log('Using embedded doctor information from visit:', visit.medecin);
        setSelectedDoctor(visit.medecin);
      } else {
        // No doctor or doctor information not available
        setSelectedDoctor(null);
      }
      
      fetchDoctors();
    }
  }, [isOpen, visit]);
  
  // Fetch doctors for selection
  const fetchDoctors = async () => {
    try {
      setIsLoadingDoctors(true);
      const response = await axios.get(API_ENDPOINTS.DOCTORS.GET_ALL);
      
      if (response.data && response.data.medecins) {
        setDoctors(response.data.medecins);
      } else {
        setDoctors([]);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError('Impossible de récupérer la liste des médecins.');
    } finally {
      setIsLoadingDoctors(false);
    }
  };
  
  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!selectedVisitType) {
      setError('Veuillez sélectionner un type de visite');
      return;
    }
    
    if (!motif.trim()) {
      setError('Veuillez entrer un motif de visite');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (!visit) {
        throw new Error('No visit data to update');
      }
      
      const payload = {
        typeVisite: selectedVisitType,
        motif: motif.trim(),
        service: service.trim(),
        idMedecin
      };
      
      console.log('Updating visit with payload:', payload);
      
      const response = await axios.put(API_ENDPOINTS.VISITS.UPDATE(visit.idVisite), payload);
      
      console.log('Update visit response:', response.data);
      
      // Success
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Error updating visit:', error);
      const err = error as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la mise à jour de la visite');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      {/* Overlay for the sliding panel */}
      <div 
        className={`sliding-panel-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />
      
    <div className={`sliding-panel ${isOpen ? 'open' : ''}`}>
      <div className="sliding-panel-content">
        <div className="sliding-panel-header">
          <h2>Modifier la visite</h2>
          <button className="close-panel-button" onClick={onClose}>
            <RightArrowIcon />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="visit-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="form-section">
            <h3>Motif de la visite</h3>
            <div className="form-group">
              <input 
                type="text"
                placeholder="Entrez le motif de la visite"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="form-section">
            <h3>Type de visite</h3>
            <div className="radio-group">
              {VISIT_TYPES.map((type) => (
                <label key={type.id} className="radio-option">
                  <input 
                    type="radio"
                    name="visitType"
                    value={type.id}
                    checked={selectedVisitType === type.id}
                    onChange={() => setSelectedVisitType(type.id)}
                  />
                  <span className="radio-label">{type.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="form-section">
            <h3>Service</h3>
            <div className="form-group">
                <select
                  id="service"
                  name="service"
                value={service}
                onChange={(e) => setService(e.target.value)}
                required
                >
                  <option value="">Sélectionner un service</option>
                  <option value="Médecine Générale">Médecine Générale</option>
                  <option value="Pédiatrie">Pédiatrie</option>
                  <option value="Orthopédie">Orthopédie</option>
                  <option value="Dermatologie">Dermatologie</option>
                </select>
            </div>
          </div>
          
          <div className="form-section">
              <h3>Prestataire</h3>
              <div className="form-group">
                <select
                  id="idMedecin"
                  className="doctor-select"
                  value={idMedecin || ''}
                  onChange={(e) => {
                    setIdMedecin(e.target.value || null);
                    if (e.target.value) {
                      const foundDoctor = doctors.find(doc => doc.idMedecin === e.target.value);
                      setSelectedDoctor(foundDoctor || null);
                    } else {
                      setSelectedDoctor(null);
                    }
                  }}
                >
                  <option value="">Sélectionner un prestataire</option>
                  {Array.isArray(doctors) && doctors
                    .filter((doc: Doctor) => !service || doc.nomSpecialite === service)
                    .map((doc: Doctor) => (
                    <option key={doc.idMedecin} value={doc.idMedecin}>
                      Dr. {doc.prenom} {doc.nom} ({doc.nomSpecialite})
                    </option>
                  ))}
                </select>
                {isLoadingDoctors && <div className="mini-loader"></div>}
                  </div>
                  </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={onClose} 
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button 
                type="submit" 
                className="submit-btn" 
                disabled={isSubmitting}
              >
              {isSubmitting ? 'En cours...' : 'Modifier la visite'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};


const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const ThreeDotsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1.5"></circle>
    <circle cx="12" cy="5" r="1.5"></circle>
    <circle cx="12" cy="19" r="1.5"></circle>
  </svg>
);

// Document Viewer Modal Component
interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  onDelete: (documentId: number) => void;
  onUpdateMetadata: (documentId: number, data: DocumentMetadataUpdate) => void;
  onUpdateFile: (documentId: number, file: File) => void;
  formatDate: (dateString: string, showTime?: boolean) => string;
}

// Document metadata update interface
interface DocumentMetadataUpdate {
  title?: string;
  description?: string;
}

// Add Document Modal Component
interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientIPP: string;
  onSuccess: () => void;
}

const AddDocumentModal = ({ isOpen, onClose, patientIPP, onSuccess }: AddDocumentModalProps) => {
  const [stage, setStage] = useState<'upload' | 'confirm'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string>('');
  const [documentDescription, setDocumentDescription] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('IMAGE');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Document types are auto-determined from file extensions
  
  // State for drag and drop functionality
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStage('upload');
      setSelectedFile(null);
      setFilePreview(null);
      setDocumentName('');
      setDocumentDescription('');
      setDocumentType('IMAGE'); // Default to IMAGE type
      setError(null);
      setIsDragging(false);
    }
  }, [isOpen]);
  
  // Process the selected file
  const processFile = (file: File) => {
    setSelectedFile(file);
    setDocumentName(file.name);
    
    // Determine document type automatically from file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileExt)) {
      setDocumentType('IMAGE');
    } else if (fileExt === 'pdf') {
      setDocumentType('RAPPORT');
    } else if (['doc', 'docx', 'odt', 'rtf'].includes(fileExt)) {
      setDocumentType('RAPPORT');
    } else if (['xls', 'xlsx', 'csv'].includes(fileExt)) {
      setDocumentType('RESULTAT');
    } else {
      // For other types, use AUTRE
      setDocumentType('AUTRE');
    }
    
    // Create file preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
    
    // Move to confirmation stage
    setStage('confirm');
  };
  
  // Handle file selection from input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    processFile(files[0]);
  };
  
  // Handle drag events
  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    processFile(files[0]);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!selectedFile) {
      setError('Veuillez sélectionner un fichier');
      return;
    }
    
    if (!documentName.trim()) {
      setError('Veuillez entrer un nom de document');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create form data according to backend requirements
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('nom', documentName.trim() || selectedFile.name);
      formData.append('description', documentDescription.trim());
      formData.append('typeDocument', documentType);
      
      // Add patient-related data
      formData.append('idPatient', patientIPP);
      
      console.log('Uploading document with data:', {
        nom: documentName,
        description: documentDescription,
        typeDocument: documentType,
        idPatient: patientIPP
      });
      
      // Send to API
      const response = await axios.post(
        API_ENDPOINTS.DOCUMENTS.UPLOAD(patientIPP),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      console.log('Document upload response:', response.data);
      
      // Success
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Error uploading document:', error);
      
      const err = error as { response?: { data?: { message?: string }, status?: number } };
      
      setError(err.response?.data?.message || 'Une erreur est survenue lors du téléchargement du document.');
      
      // Don't reset to upload stage on every error, only on specific errors
      if (err.response?.status === 413) {
        // File too large error
        setError('Le fichier est trop volumineux. Veuillez sélectionner un fichier plus petit.');
        setStage('upload');
      } else if (err.response?.status === 415) {
        // Unsupported file type
        setError('Type de fichier non supporté. Veuillez sélectionner un autre fichier.');
        setStage('upload');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle cancel at confirm stage
  const handleCancelConfirm = () => {
    setStage('upload');
    setSelectedFile(null);
    setFilePreview(null);
    setDocumentName('');
    setDocumentDescription('');
    setDocumentType('IMAGE'); // Reset to default
  };
  
  if (!isOpen) return null;
  
  // File Upload Stage
  if (stage === 'upload') {
    return (
      <div className="modal-overlay document-upload-overlay">
        <div className="document-upload-modal">
          <div className="upload-modal-header">
            <h2>Ajouter un document</h2>
            <button className="close-modal-button" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
          
          <div className="upload-modal-body">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <div className="file-upload-area">
              <input
                type="file"
                id="file-upload"
                className="file-input"
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.rtf,.odt,.txt"
              />
              <label 
                htmlFor="file-upload" 
                className={`file-upload-label ${isDragging ? 'dragging' : ''}`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <span>{isDragging ? 'Déposez le fichier ici' : 'Glissez un fichier ici ou cliquez pour parcourir'}</span>
                <span className="file-types">Images, PDF, documents (Word, Excel, texte) et autres fichiers</span>
              </label>
            </div>
          </div>
          
          {/* Removed cancel button from this stage */}
        </div>
      </div>
    );
  }
  
  // Confirmation Stage
  return (
    <div className="modal-overlay document-upload-overlay">
      <div className="document-confirm-modal">
        <div className="upload-modal-header">
          <h2>Confirmer l'ajout du document</h2>
          <button className="close-modal-button" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        
        <div className="confirm-modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="confirm-content">
            {/* File Preview */}
            <div className="file-preview">
              {filePreview ? (
                <img src={filePreview} alt="Aperçu du document" />
              ) : (
                <div className="generic-file-preview">
                  {documentType?.includes('pdf') && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <rect x="6" y="13" width="12" height="8"></rect>
                    </svg>
                  )}
                  {documentType?.includes('word') && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#2980b9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  )}
                  {!documentType?.includes('pdf') && !documentType?.includes('word') && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#7f8c8d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                  )}
                  <p>{selectedFile?.name}</p>
                </div>
              )}
            </div>
            
            {/* Form fields */}
            <div className="document-form">
              <div className="form-group">
                <label htmlFor="document-name">Nom du document</label>
                <input
                  type="text"
                  id="document-name"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  required
                />
              </div>
              
              
              <div className="form-group">
                <label htmlFor="document-description">Description du document</label>
                <textarea
                  id="document-description"
                  value={documentDescription}
                  onChange={(e) => setDocumentDescription(e.target.value)}
                  placeholder="Entrez une description du document..."
                  rows={4}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="confirm-modal-footer" style={{ display: 'flex' }}>
          <button 
            className="cancel-button" 
            onClick={handleCancelConfirm}
            disabled={isSubmitting}
            style={{ flex: 1, minWidth: 0 }}
          >
            Annuler
          </button>
          <button 
            className="submit-btn" 
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{ flex: 1, minWidth: 0 }}
          >
            {isSubmitting ? 'Ajout en cours...' : 'Ajouter le document'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Loading Spinner component for document viewer
const LoadingSpinner = () => (
  <div className="document-loading-spinner">
    <svg width="50" height="50" viewBox="0 0 50 50">
      <circle 
        cx="25" 
        cy="25" 
        r="20" 
        fill="none" 
        strokeWidth="5" 
        stroke="#1E513B" 
        strokeLinecap="round" 
        strokeDasharray="94.2477796077" 
        strokeDashoffset="47.1238898038"
      >
        <animateTransform 
          attributeName="transform" 
          type="rotate" 
          from="0 25 25" 
          to="360 25 25" 
          dur="1s" 
          repeatCount="indefinite"
        />
      </circle>
    </svg>
    <p>Chargement du document...</p>
  </div>
);

const DocumentViewer = ({ isOpen, onClose, document, onDelete, onUpdateMetadata, onUpdateFile, formatDate }: DocumentViewerProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isFileEditing, setIsFileEditing] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editType, setEditType] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Reset states when document changes
  useEffect(() => {
    if (document) {
      setIsLoading(true);
      setIsEditing(false);
      setIsFileEditing(false);
      setEditTitle(document.nom);
      setEditDescription(document.description || '');
      setEditType(document.typeDocument);
      setSelectedFile(null);
    }
  }, [document]);
  
  if (!isOpen || !document) return null;
  
  // Function to determine if the document is an image type
  const isImageType = (type: string): boolean => {
    if (!type) return false;
    
    const lowerType = type.toLowerCase();
    return lowerType.includes('image') || 
           lowerType.includes('jpg') || 
           lowerType.includes('jpeg') || 
           lowerType.includes('png') || 
           lowerType.includes('gif') ||
           lowerType.includes('webp') ||
           lowerType.includes('svg') ||
           lowerType.includes('bmp') ||
           document.url?.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i) !== null;
  };
  
  // Handle image load event
  const handleImageLoaded = () => {
    setIsLoading(false);
  };
  
  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Image failed to load:', document.url);
    e.currentTarget.onerror = null;
    e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiI+PC9yZWN0PjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ij48L2NpcmNsZT48cG9seWxpbmUgcG9pbnRzPSIyMSAxNSAxNiAxMCA1IDIxIj48L3BvbHlsaW5lPjwvc3ZnPg==";
    setIsLoading(false);
  };
  
  // Function to initiate document download with progress tracking
  const handleDownload = () => {
    window.open(document.url, '_blank');
  };

  // Function to enable editing mode
  const enableEditing = () => {
    setIsEditing(true);
  };

  // Function to cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditTitle(document.nom);
    setEditDescription(document.description || '');
    setEditType(document.typeDocument);
  };

  // Function to save metadata changes
  const saveMetadataChanges = () => {
    if (!editTitle.trim()) {
      alert('Le titre du document ne peut pas être vide');
      return;
    }
    
    setIsSubmitting(true);
    
    // Only include fields that have changed
    const updatedData: DocumentMetadataUpdate = {};
    
    if (editTitle !== document.nom) {
      updatedData.title = editTitle;
    }
    
    if (editDescription !== (document.description || '')) {
      updatedData.description = editDescription;
    }
    
    // Only update if there are changes
    if (Object.keys(updatedData).length > 0) {
      onUpdateMetadata(document.idDocument, updatedData);
    } else {
      // If no changes, just exit edit mode
      setIsEditing(false);
      setIsSubmitting(false);
    }
  };

  // Function to handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setSelectedFile(files[0]);
  };

  // Function to trigger file input click
  const triggerFileSelection = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Function to update document file
  const updateDocumentFile = () => {
    if (!selectedFile) {
      alert('Veuillez sélectionner un fichier');
      return;
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('Le fichier ne doit pas dépasser 10 Mo');
      return;
    }
    
    setIsSubmitting(true);
    onUpdateFile(document.idDocument, selectedFile);
    setIsFileEditing(false);
    setSelectedFile(null);
    setIsSubmitting(false);
  };

  // Function to cancel file update
  const cancelFileUpdate = () => {
    setIsFileEditing(false);
    setSelectedFile(null);
  };
  
  // Create simple overlay
  return (
    <div className="document-modal-overlay">
      {/* Main viewer container */}
      <div className="document-viewer-container">
        {/* Simple white X close button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            backgroundColor: 'transparent',
            color: 'white',
            border: 'none',
            width: '30px',
            height: '30px',
            fontSize: '18px',
            fontWeight: 'normal',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            fontFamily: 'Arial, sans-serif'
          }}
        >
          x
        </button>
        
        {/* Left side - document preview */}
        <div className="document-preview-section">
          {/* Image documents */}
          {isImageType(document.typeDocument) && (
            <div className="document-image-preview">
              {isLoading && <LoadingSpinner />}
              <img 
                src={document.url}
                alt={document.nom}
                onLoad={handleImageLoaded}
                onError={handleImageError}
                style={{ display: isLoading ? 'none' : 'block' }}
              />
            </div>
          )}
          
          {/* PDF documents */}
          {(document.typeDocument?.toLowerCase().includes('pdf') || document.url?.toLowerCase().endsWith('.pdf')) && (
            <div className="document-pdf-preview">
              <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <rect x="6" y="13" width="12" height="8"></rect>
              </svg>
              <p className="preview-note">Aperçu PDF non disponible</p>
              <a 
                href={document.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="view-original-button"
              >
                Ouvrir le PDF
              </a>
            </div>
          )}
          
          {/* Word documents */}
          {(!isImageType(document.typeDocument) && 
            !document.typeDocument?.toLowerCase().includes('pdf') && 
            !document.url?.toLowerCase().endsWith('.pdf') &&
            (document.typeDocument?.toLowerCase().includes('doc') || 
             document.typeDocument?.toLowerCase().includes('word') ||
             document.url?.toLowerCase().match(/\.(doc|docx)$/i) !== null)) && (
            <div className="document-doc-preview">
              <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#2980b9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <p className="preview-note">Aperçu document non disponible</p>
              <a 
                href={document.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="view-original-button"
              >
                Ouvrir le document
              </a>
            </div>
          )}
          
          {/* Generic documents (fallback) */}
          {(!isImageType(document.typeDocument) && 
           !document.typeDocument?.toLowerCase().includes('pdf') && 
           !document.url?.toLowerCase().endsWith('.pdf') &&
           !document.typeDocument?.toLowerCase().includes('doc') && 
           !document.typeDocument?.toLowerCase().includes('word') &&
           !document.url?.toLowerCase().match(/\.(doc|docx)$/i)) && (
            <div className="document-generic-preview">
              <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#7f8c8d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <p className="preview-note">Aperçu non disponible</p>
              <a 
                href={document.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="view-original-button"
              >
                Ouvrir le document
              </a>
            </div>
          )}
        </div>
        
        {/* Right sidebar - document info */}
        <div className="document-info-sidebar">
          {!isEditing ? (
            <>
              <div className="document-info-content">
                <h2 className="document-title">{document.nom}</h2>
                
                <div className="document-description">
                  {document.description || 'Aucune description'}
                </div>
                
                <div className="document-meta-info">
                  <div className="meta-item">
                    <span className="meta-label">Type:</span>
                    <span className="meta-value">{document.typeDocument}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Ajouté le:</span>
                    <span className="meta-value">{formatDate(document.dateAjout)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Patient:</span>
                    <span className="meta-value">{document.prenomPatient || ''} {document.nomPatient || ''}</span>
                  </div>
                </div>
              </div>
              
              {/* Action buttons at the bottom of the sidebar */}
              <div className="document-action-buttons">
                <button onClick={enableEditing} className="action-button edit">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Modifier les informations
                </button>
                
                {!isFileEditing ? (
                  <button onClick={() => setIsFileEditing(true)} className="action-button replace">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    Remplacer le fichier
                  </button>
                ) : (
                  <div className="file-upload-section">
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                    />
                    
                    {!selectedFile ? (
                      <button onClick={triggerFileSelection} className="action-button upload">
                        Sélectionner un fichier
                      </button>
                    ) : (
                      <div className="selected-file-info">
                        <span>{selectedFile.name}</span>
                        <div className="file-actions">
                          <button onClick={updateDocumentFile} className="action-button confirm" disabled={isSubmitting}>
                            {isSubmitting ? 'Mise à jour...' : 'Confirmer'}
                          </button>
                          <button onClick={cancelFileUpdate} className="action-button cancel">
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <button onClick={handleDownload} className="action-button download">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Télécharger
                </button>
                
                <button onClick={() => onDelete(document.idDocument)} className="action-button delete">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                  Supprimer
                </button>
              </div>
            </>
          ) : (
            <div className="document-info-content">
              <div className="document-edit-form">
                <div className="form-group">
                  <label htmlFor="document-title">Titre</label>
                  <input
                    id="document-title"
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Titre du document"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="document-description">Description</label>
                  <textarea
                    id="document-description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description du document (optionnel)"
                    rows={4}
                  />
                </div>
                
                <div className="form-actions">
                  <button onClick={saveMetadataChanges} className="action-button save" disabled={isSubmitting}>
                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button onClick={cancelEditing} className="action-button cancel">
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface NotesComponentProps {
  isOpen: boolean;
  onClose: () => void;
  visitId: number | null;
  note: string;
  onSave: (note: string) => void;
}

// NotesComponent: Modify to always render the panel with CSS handling visibility
const NotesComponent = ({ isOpen, onClose, visitId, note, onSave }: NotesComponentProps) => {
  const [noteText, setNoteText] = useState(note || '');
  
  const handleSave = () => {
    onSave(noteText);
  };
  
  // Remove the early null return and let CSS handle visibility
  return (
    <div className={`notes-panel ${isOpen ? 'open' : ''}`}>
      <div className="notes-panel-header">
        <h3>Notes du médecin</h3>
        <button className="panel-close-button" onClick={onClose}>
          <RightArrowIcon />
        </button>
      </div>
      <div className="notes-panel-content">
        {isOpen && (
          <textarea 
            className="notes-textarea"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Saisissez vos notes ici..."
          />
        )}
      </div>
      <div className="notes-panel-footer">
        <button className="cancel-btn" onClick={onClose}>Annuler</button>
        {isOpen && (
          <button className="save-btn" onClick={handleSave}>Sauvegarder</button>
        )}
      </div>
    </div>
  );
};

interface FormsComponentProps {
  isOpen: boolean;
  onClose: () => void;
  getCurrentDoctorId: () => string | null;
  user: any;
  patientIPP?: string;
  patientId?: string; // Add patientId parameter for the UUID
  activeVisitId?: number | null;
}

// Further down in the file, also modify the FormsComponent render method
// Remove the if (!isOpen) return null; line at approximately line 1947
const FormsComponent = ({ isOpen, onClose, getCurrentDoctorId, user, patientIPP, patientId, activeVisitId }: FormsComponentProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formTemplates, setFormTemplates] = useState<ModeleFormulaire[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ModeleFormulaire | null>(null);
  const [formStructure, setFormStructure] = useState<SectionFormulaire[]>([]);
  const [useMockApi, setUseMockApi] = useState<boolean>(false);
  const [formResponses, setFormResponses] = useState<{[key: number]: string}>({});
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const { showToast } = useToast(); // Add toast hook
  
  // Add a state to track requested model ID before templates are loaded
  const [pendingModelId, setPendingModelId] = useState<number | null>(null);
  
  // References for section scrolling
  const sectionRefs = useRef<{[key: number]: HTMLDivElement | null}>({});
  const contentRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Pass expanded state to parent component
  useEffect(() => {
    // If parent needs to know when panel is expanded (for layout adjustments)
    if (isOpen) {
      document.body.classList.toggle('form-expanded', !!selectedTemplate);
    }
    return () => {
      document.body.classList.remove('form-expanded');
    };
  }, [isOpen, selectedTemplate]);
  
  // Fetch templates whenever the panel is opened
  useEffect(() => {
    if (isOpen && user?.role === 'MEDECIN') {
      console.log("FormsComponent panel opened, fetching templates");
      fetchFormTemplates();
    }
  }, [isOpen, user]);

  // Apply the pending model ID once templates are loaded
  useEffect(() => {
    if (pendingModelId && formTemplates.length > 0) {
      console.log(`Applying pending model ID ${pendingModelId} now that templates are loaded`);
      const template = formTemplates.find(t => t.idModele === pendingModelId);
      if (template) {
        console.log(`Found template for pending modelId ${pendingModelId}:`, template);
        handleSelectTemplate(template);
        // Clear the pending ID
        setPendingModelId(null);
      } else {
        console.error(`No template found for pending modelId ${pendingModelId}`);
        console.log("Available template IDs:", formTemplates.map(t => t.idModele));
        showToast(`Formulaire non trouvé (ID: ${pendingModelId})`, 'error');
        setPendingModelId(null);
      }
    }
  }, [formTemplates, pendingModelId]);
  
  // Reset form state when panel is closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedTemplate(null);
      setFormStructure([]);
      setFormResponses({});
      setSubmissionSuccess(false);
      setError(null);
      setPendingModelId(null);
    }
  }, [isOpen]);
  
  // Set active section based on scroll position
  useEffect(() => {
    if (!contentRef.current || formStructure.length === 0) return;
    
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const scrollPosition = contentRef.current.scrollTop;
      let currentSection: number | null = null;
      
      // Find the section that is currently in view
      Object.entries(sectionRefs.current).forEach(([idSection, ref]) => {
        if (!ref) return;
        
        const { offsetTop } = ref;
        if (scrollPosition >= offsetTop - 100) { // With some offset for better UX
          currentSection = parseInt(idSection);
        }
      });
      
      if (currentSection !== null && currentSection !== activeSection) {
        setActiveSection(currentSection);
      }
    };
    
    const contentElement = contentRef.current;
    contentElement.addEventListener('scroll', handleScroll);
    
    // Initial check for active section
    setTimeout(handleScroll, 100);
    
    return () => {
      contentElement.removeEventListener('scroll', handleScroll);
    };
  }, [formStructure, selectedTemplate]);
  
  const fetchFormTemplates = async (modelId?: number) => {
    setIsLoading(true);
    setError(null);
    
    // If a modelId was passed, set it as pending
    if (modelId) {
      setPendingModelId(modelId);
    }
    
    console.log(`Fetching form templates${modelId ? ` for model ID ${modelId}` : ''}`);
    
    try {
      // Get doctor's specialty ID
      const doctorId = getCurrentDoctorId();
      if (!doctorId) {
        throw new Error('ID du médecin non disponible');
      }
      
      // Try the real endpoint first
      let doctor;
      try {
        const apiPrefix = useMockApi ? '/api/mock' : '/api';
        const doctorResponse = await axios.get(`${apiPrefix}/medecins/${doctorId}`);
        doctor = doctorResponse.data.medecin || doctorResponse.data;
        
        if (!doctor || !doctor.idSpecialite) {
          throw new Error('Spécialité du médecin non disponible');
        }
      } catch (err) {
        console.error('Error fetching doctor information:', err);
        // If not already using mock API, switch to it and retry
        if (!useMockApi) {
          setUseMockApi(true);
          // Restart the fetch process with mock API
          setTimeout(() => fetchFormTemplates(), 100);
          return;
        } else {
          throw new Error('Impossible de récupérer les informations du médecin');
        }
      }
      
      // Fetch form templates by specialty
      try {
        const apiPrefix = useMockApi ? '/api/mock' : '/api';
        const response = await axios.get(
          `${apiPrefix}/formulaires/modeles/specialite/${doctor.idSpecialite}`
        );
        
        const data = response.data;
        if (Array.isArray(data)) {
          setFormTemplates(data);
        } else if (data.modeles && Array.isArray(data.modeles)) {
          setFormTemplates(data.modeles);
        } else if (data.status === 'error') {
          throw new Error(data.message || 'Erreur lors du chargement des modèles');
        } else {
          setFormTemplates([]);
        }
      } catch (err) {
        console.error('Error fetching form templates:', err);
        // If not already using mock API, switch to it and retry
        if (!useMockApi) {
          setUseMockApi(true);
          // Restart the fetch process with mock API
          setTimeout(() => fetchFormTemplates(), 100);
          return;
        } else {
          throw new Error('Impossible de charger les modèles de formulaires');
        }
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des modèles de formulaires:', err);
      setError(err.message || 'Impossible de charger les formulaires médicaux. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchFormStructure = useCallback(async (templateId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const apiPrefix = useMockApi ? '/api/mock' : '/api';
      const response = await axios.get(
        `${apiPrefix}/formulaires/modeles/${templateId}/structure`
      );
      
      const data = response.data;
      if (Array.isArray(data)) {
        setFormStructure(data);
      } else if (data.status === 'error') {
        throw new Error(data.message || 'Erreur lors du chargement du formulaire');
      } else {
        throw new Error('Format de données incorrect');
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement de la structure du formulaire:', err);
      
      // If not already using mock API, switch to it and retry
      if (!useMockApi) {
        setUseMockApi(true);
        await fetchFormStructure(templateId);
        return;
      }
      
      setError(err.message || 'Impossible de charger le formulaire sélectionné. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  }, [useMockApi]);
  
  const handleSelectTemplate = useCallback((template: ModeleFormulaire) => {
    console.log(`Selecting template with ID ${template.idModele}: "${template.nom}"`);
    setSelectedTemplate(template);
    fetchFormStructure(template.idModele);
    
    // Initialize empty responses for all fields
    setFormResponses({});
  }, [fetchFormStructure]);
  
  // Add the event listener for opening forms from other components
  useEffect(() => {
    const handleOpenFormModel = (event: Event) => {
      const customEvent = event as CustomEvent<{modelId: number}>;
      const modelId = customEvent.detail?.modelId;
      
      console.log(`FormsComponent received openFormModel event with modelId: ${modelId}`);
      console.log(`Available form templates: ${formTemplates.length}`, formTemplates);
      
      if (!modelId) {
        console.error("No modelId provided in the event");
        return;
      }
      
      if (formTemplates.length > 0) {
        // Find the template with the matching ID
        const template = formTemplates.find(t => t.idModele === modelId);
        if (template) {
          console.log(`Found template for modelId ${modelId}:`, template);
          handleSelectTemplate(template);
        } else {
          console.error(`No template found for modelId ${modelId} among ${formTemplates.length} templates`);
          // Log all available template IDs for debugging
          console.log("Available template IDs:", formTemplates.map(t => t.idModele));
          
          // If templates are loaded but the one we need isn't found, try fetching templates again
          console.log("Retrying template fetch as the requested template wasn't found");
          fetchFormTemplates(modelId);
        }
      } else {
        // If no templates are loaded yet, store the model ID and fetch templates
        console.log(`No templates available yet. Setting pending modelId ${modelId} and fetching templates`);
        setPendingModelId(modelId);
        fetchFormTemplates(modelId);
      }
    };

    // Add the event listener to the panel
    const formPanel = panelRef.current;
    if (formPanel) {
      console.log("Adding openFormModel event listener to forms panel");
      formPanel.addEventListener('openFormModel', handleOpenFormModel);
    } else {
      console.error("Forms panel reference not available");
    }

    // Clean up the event listener when component unmounts
    return () => {
      if (formPanel) {
        formPanel.removeEventListener('openFormModel', handleOpenFormModel);
      }
    };
  }, [formTemplates]);
  
  const handleBackToList = () => {
    setSelectedTemplate(null);
    setFormStructure([]);
    setFormResponses({});
  };

  const handleRetry = () => {
    // Reset the mock API flag to try the real endpoints first
    setUseMockApi(false);
    fetchFormTemplates();
  };
  
  const handleInputChange = (fieldId: number, value: string) => {
    setFormResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };
  
  // Special handler for checkbox inputs
  const handleCheckboxChange = (fieldId: number, value: string, isChecked: boolean) => {
    setFormResponses(prev => {
      // Get current values as array
      const currentValues = prev[fieldId]?.split(';').filter(v => v) || [];
      
      let newValues: string[];
      if (isChecked) {
        // Add the value if it's not already there
        newValues = currentValues.includes(value) ? currentValues : [...currentValues, value];
      } else {
        // Remove the value
        newValues = currentValues.filter(v => v !== value);
      }
      
      // Join with semicolons or empty string if no values
      return {
        ...prev,
        [fieldId]: newValues.length > 0 ? newValues.join(';') : ''
      };
    });
  };
  
  const scrollToSection = (sectionId: number) => {
    // Always set the active section immediately when a section is clicked
    setActiveSection(sectionId);
    
    // Then scroll to the section if needed
    const sectionRef = sectionRefs.current[sectionId];
    if (sectionRef && contentRef.current) {
      contentRef.current.scrollTo({
        top: sectionRef.offsetTop - 20, // Adjust offset for better positioning
        behavior: 'smooth'
      });
    }
  };
  
  const validateForm = (): boolean => {
    let isValid = true;
    
    // Recursive function to validate a section and its fields
    const validateSection = (section: SectionFormulaire) => {
      // Check if all required fields in this section have a value
      section.champs.forEach(field => {
        if (field.estObligatoire) {
          const value = formResponses[field.idChamp];
          
          if (value === undefined || value === null || value === '') {
            isValid = false;
            
            // Highlight the field by scrolling to it
            const fieldElement = document.getElementById(`section-${section.idSection}`);
            if (fieldElement) {
              scrollToSection(section.idSection);
              
              // Find the input/select/textarea and add a class to highlight it
              const inputElement = fieldElement.querySelector(`[id*="-${field.idChamp}-"], [id$="-${field.idChamp}"]`);
              if (inputElement) {
                inputElement.classList.add('validation-error');
                
                // Remove the class after a short delay
                setTimeout(() => {
                  inputElement.classList.remove('validation-error');
                }, 3000);
              }
            }
          }
        }
      });
      
      // Recursively validate subsections
      if (section.sousSections && section.sousSections.length > 0) {
        section.sousSections.forEach(validateSection);
      }
    };
    
    // Validate all top-level sections
    formStructure.forEach(validateSection);
    
    return isValid;
  };
  
  const handleSubmit = async () => {
    // Validate form first
    if (!validateForm()) {
      setError('Veuillez remplir tous les champs obligatoires avant de soumettre le formulaire.');
      return;
    }
    
    if (!patientIPP || !activeVisitId || !selectedTemplate) {
      setError('Informations manquantes pour soumettre le formulaire (patient, visite ou modèle).');
      return;
    }
    
    const doctorId = getCurrentDoctorId();
    if (!doctorId) {
      setError('ID du médecin non disponible.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Prepare submission payload
      const reponses = Object.entries(formResponses).map(([idChamp, valeur]) => {
        // Find the section ID for this field
        let idSection = 0;
        
        const findSectionForField = (sections: SectionFormulaire[]): number => {
          for (const section of sections) {
            // Check if the field is directly in this section
            const fieldIndex = section.champs.findIndex(f => f.idChamp === parseInt(idChamp));
            if (fieldIndex >= 0) {
              return section.idSection;
            }
            
            // Check nested sections
            if (section.sousSections && section.sousSections.length > 0) {
              const nestedResult = findSectionForField(section.sousSections);
              if (nestedResult > 0) {
                return nestedResult;
              }
            }
          }
          return 0;
        };
        
        idSection = findSectionForField(formStructure);
        
        return {
          idChamp: parseInt(idChamp),
          valeur: valeur,
          idSection: idSection
        };
      });
      
      // Create the payload with correct UUID formats
      const payload = {
        // Use the patient UUID from props
        idPatient: patientId || patientIPP, // Use UUID if available, fall back to IPP
        // Use the real values for these fields
        idVisite: activeVisitId,
        idModele: selectedTemplate.idModele,
        // Fixed UUID for doctor - in a real solution, this should come from the user context
        idMedecin: doctorId && doctorId.includes('-') ? doctorId : "141fc646-b241-4893-b87c-2bc542fe9bc3", // Use real doctor ID if it's in UUID format
        status: "COMPLETED",
        // Use the actual form responses
        reponses: reponses
      };
      
      console.log('Submitting form with payload:', payload);
      
      // Use fetch API instead of axios to avoid CORS issues
      const response = await fetch('/api/formulaires', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      console.log('Form submission response status:', response.status);
      console.log('Form submission response data:', data);
      
      if (!response.ok) {
        // Extract error message from response if possible
        const errorMsg = data?.message || `Error: ${response.status} ${response.statusText}`;
        throw new Error(errorMsg);
      }
      
      // Check if we have a valid response (idFormulaire indicates success)
      if (data && data.idFormulaire) {
        console.log('Form submitted successfully with ID:', data.idFormulaire);
        setSubmissionSuccess(true);
        
        // Show success toast notification instead of inline message
        showToast(`Formulaire soumis avec succès`, 'success');
        
        // Reset form after success
        setTimeout(() => {
          setSelectedTemplate(null);
          setFormStructure([]);
          setFormResponses({});
          setSubmissionSuccess(false);
        }, 500);
      } else {
        // If we get here, we have a 200 OK but no form ID, which is unexpected
        console.error('Unexpected response format:', data);
        throw new Error(data?.message || 'Réponse invalide du serveur');
      }
    } catch (error: unknown) {
      console.error('Error submitting form:', error);
      
      if (error instanceof Error) {
        setError(error.message);
        showToast(error.message, 'error');
      } else {
        setError('Une erreur inconnue est survenue');
        showToast('Une erreur inconnue est survenue', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  /**
   * Handles the generation of a PDF from the current form data.
   * 
   * Workflow:
   * 1. Validates the form using the same validation logic as the submit function
   * 2. Creates a payload with the form data
   * 3. Sends a POST request to the /api/formulaires/generate-pdf endpoint
   * 4. On success, displays a success message and opens the PDF in a new tab
   * 5. On error, displays an error message
   * 
   * The PDF generation is handled by the backend, which saves the form data
   * and generates a PDF document based on it. The PDF URL is returned in the response
   * and is permanent (can be shared with patients).
   */
  const handleGeneratePDF = async () => {
    // Validate form first
    if (!validateForm()) {
      setError('Veuillez remplir tous les champs obligatoires avant de générer le PDF.');
      return;
    }
    
    if (!patientIPP || !activeVisitId || !selectedTemplate) {
      setError('Informations manquantes pour générer le PDF (patient, visite ou modèle).');
      return;
    }
    
    const doctorId = getCurrentDoctorId();
    if (!doctorId) {
      setError('ID du médecin non disponible.');
      return;
    }
    
    setIsGeneratingPDF(true);
    setError(null);
    
    try {
      // Prepare submission payload using the same logic as handleSubmit
      const reponses = Object.entries(formResponses).map(([idChamp, valeur]) => {
        // Find the section ID for this field
        let idSection = 0;
        
        const findSectionForField = (sections: SectionFormulaire[]): number => {
          for (const section of sections) {
            // Check if the field is directly in this section
            const fieldIndex = section.champs.findIndex(f => f.idChamp === parseInt(idChamp));
            if (fieldIndex >= 0) {
              return section.idSection;
            }
            
            // Check nested sections
            if (section.sousSections && section.sousSections.length > 0) {
              const nestedResult = findSectionForField(section.sousSections);
              if (nestedResult > 0) {
                return nestedResult;
              }
            }
          }
          return 0;
        };
        
        idSection = findSectionForField(formStructure);
        
        return {
          idChamp: parseInt(idChamp),
          valeur: valeur,
          idSection: idSection
        };
      });
      
      // Create the payload with correct UUID formats
      const payload = {
        // Use the patient UUID from props
        idPatient: patientId || patientIPP, // Use UUID if available, fall back to IPP
        // Use the real values for these fields
        idVisite: activeVisitId,
        idModele: selectedTemplate.idModele,
        // Fixed UUID for doctor - in a real solution, this should come from the user context
        idMedecin: doctorId && doctorId.includes('-') ? doctorId : "141fc646-b241-4893-b87c-2bc542fe9bc3", // Use real doctor ID if it's in UUID format
        status: "COMPLETED",
        // Use the actual form responses
        reponses: reponses
      };
      
      console.log('Generating PDF with payload:', payload);
      
      // Use fetch API to call the PDF generation endpoint
      const response = await fetch('/api/formulaires/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      console.log('PDF generation response status:', response.status);
      console.log('PDF generation response data:', data);
      
      if (!response.ok) {
        // Extract error message from response if possible
        const errorMsg = data?.message || `Error: ${response.status} ${response.statusText}`;
        throw new Error(errorMsg);
      }
      
      // Check if we have a valid response (success and pdfUrl fields)
      if (data && data.success && data.pdfUrl) {
        console.log('PDF generated successfully with URL:', data.pdfUrl);
        
        // Show success toast notification
        showToast('PDF généré avec succès', 'success');
        
        // Open the PDF in a new tab
        window.open(data.pdfUrl, '_blank');
        
        // Reset the form after successful PDF generation
        setTimeout(() => {
          setSelectedTemplate(null);
          setFormStructure([]);
          setFormResponses({});
          setSubmissionSuccess(false);
        }, 500);
      } else {
        // If we get here, we have a 200 OK but missing expected fields
        console.error('Unexpected response format:', data);
        throw new Error(data?.message || 'Réponse invalide du serveur');
      }
    } catch (error: unknown) {
      console.error('Error generating PDF:', error);
      
      if (error instanceof Error) {
        setError(error.message);
        showToast(error.message, 'error');
      } else {
        setError('Une erreur inconnue est survenue lors de la génération du PDF');
        showToast('Une erreur inconnue est survenue', 'error');
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  
  // Helper function to render field with its type
  const renderField = (field: ChampFormulaire) => {
    return (
      <div className="form-field" key={field.idChamp}>
        <label>
          {field.nom} {field.estObligatoire && <span className="required">*</span>}
          {field.unite && <span className="unit"> ({field.unite})</span>}
        </label>
        
        {/* Text input (VARCHAR type) */}
        {field.typeChamp === 'text' && (
          <input 
            type="text" 
            placeholder={field.placeholder || ''} 
            value={formResponses[field.idChamp] || ''}
            onChange={(e) => handleInputChange(field.idChamp, e.target.value)}
            required={field.estObligatoire}
          />
        )}
        
        {/* Number input with unit display */}
        {field.typeChamp === 'number' && (
          <div className="number-input-container">
            <input 
              type="number" 
              placeholder={field.placeholder || ''} 
              value={formResponses[field.idChamp] || ''}
              onChange={(e) => handleInputChange(field.idChamp, e.target.value)}
              required={field.estObligatoire}
            />
            {field.unite && <span className="unit-display">{field.unite}</span>}
          </div>
        )}
        
        {/* Textarea for free-form content */}
        {field.typeChamp === 'textarea' && (
          <textarea 
            placeholder={field.placeholder || ''} 
            value={formResponses[field.idChamp] || ''}
            onChange={(e) => handleInputChange(field.idChamp, e.target.value)}
            required={field.estObligatoire}
            rows={4}
          />
        )}
        
        {/* Dropdown (select) */}
        {field.typeChamp === 'select' && field.valeursPossibles && (
          <div className="select-container">
            {(() => {
              const options = field.valeursPossibles.split(';').map(opt => opt.trim());
              
              // Always use regular dropdown, regardless of number of options
              return (
                <select
                  value={formResponses[field.idChamp] || ''}
                  onChange={(e) => handleInputChange(field.idChamp, e.target.value)}
                  required={field.estObligatoire}
                >
                  <option value="">{field.placeholder || 'Sélectionner une option'}</option>
                  {options.map((value, index) => (
                    <option key={index} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              );
            })()}
          </div>
        )}
        
        {/* Radio buttons for mutually exclusive choices */}
        {field.typeChamp === 'radio' && field.valeursPossibles && (
          <div className="radio-field">
            {field.valeursPossibles.split(';').map((option, index) => {
              const optionValue = option.trim();
              const optionId = `radio-${field.idChamp}-${index}`;
              return (
                <div key={optionId} className="radio-option">
                  <input 
                    type="radio" 
                    id={optionId}
                    name={`radio-group-${field.idChamp}`}
                    value={optionValue}
                    checked={formResponses[field.idChamp] === optionValue}
                    onChange={(e) => handleInputChange(field.idChamp, e.target.value)}
                    required={field.estObligatoire}
                  />
                  <label htmlFor={optionId} className="radio-label">
                    {optionValue}
                  </label>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Checkboxes for multi-select fields */}
        {field.typeChamp === 'checkbox' && field.valeursPossibles && (
          <div className="checkbox-field">
            {field.valeursPossibles.split(';').map((option, index) => {
              const optionValue = option.trim();
              const optionId = `checkbox-${field.idChamp}-${index}`;
              
              // Split the current responses for this field into an array
              const currentValues = formResponses[field.idChamp]?.split(';') || [];
              const isChecked = currentValues.includes(optionValue);
              
              return (
                <div key={optionId} className="checkbox-option">
                  <input 
                    type="checkbox" 
                    id={optionId}
                    value={optionValue}
                    checked={isChecked}
                    onChange={(e) => handleCheckboxChange(field.idChamp, optionValue, e.target.checked)}
                  />
                  <label htmlFor={optionId} className="checkbox-label">
                    {optionValue}
                  </label>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Replace search field with regular text field */}
        {field.typeChamp === 'search' && (
          <input 
            type="text" 
            placeholder={field.placeholder || ''} 
            value={formResponses[field.idChamp] || ''}
            onChange={(e) => handleInputChange(field.idChamp, e.target.value)}
            required={field.estObligatoire}
          />
        )}
        
        {/* Date picker for date fields */}
        {field.typeChamp === 'date' && (
          <div className="date-field">
            <input 
              type="date" 
              value={formResponses[field.idChamp] || ''}
              onChange={(e) => handleInputChange(field.idChamp, e.target.value)}
              required={field.estObligatoire}
              className="date-input"
            />
          </div>
        )}

        {/* Fallback for unrecognized field types */}
        {!['text', 'number', 'textarea', 'select', 'radio', 'checkbox', 'search', 'date'].includes(field.typeChamp) && (
          <div className="unsupported-field-type">
            <input 
              type="text" 
              placeholder={`Champ de type '${field.typeChamp}'`}
              value={formResponses[field.idChamp] || ''}
              onChange={(e) => handleInputChange(field.idChamp, e.target.value)}
              required={field.estObligatoire}
            />
            <small className="field-type-warning">Type de champ non supporté</small>
          </div>
        )}
      </div>
    );
  };
  
  // Helper function to recursively render sections and their nested sections
  const renderSections = (sections: SectionFormulaire[]) => {
    return sections
      .sort((a, b) => a.ordreAffichage - b.ordreAffichage)
      .map((section) => (
        <div 
          className="form-section" 
          key={section.idSection}
          ref={(el: HTMLDivElement | null) => { 
            sectionRefs.current[section.idSection] = el; 
            return undefined;
          }}
          id={`section-${section.idSection}`}
        >
          <div className="section-header">
            <h4>{section.nom}</h4>
          </div>
          
          <div className="section-content">
            {/* Render fields for this section */}
            {section.champs
              .sort((a, b) => a.ordreAffichage - b.ordreAffichage)
              .map(renderField)}
            
            {/* Render nested sections */}
            {section.sousSections && section.sousSections.length > 0 && (
              <div className="nested-sections">
                {renderSections(section.sousSections)}
              </div>
            )}
          </div>
        </div>
      ));
  };
  
  // Instead of returning null when not open, always render the panel and let CSS handle the visibility
  return (
    <div 
      className={`forms-panel ${isOpen ? 'open' : ''} ${selectedTemplate ? 'expanded' : ''}`}
      ref={panelRef}
    >
      <div className="forms-panel-header">
        <h3>
          {selectedTemplate ? selectedTemplate.nom : 'Formulaires Médicaux'}
          {useMockApi && <span className="mock-data-badge"> (Données de test)</span>}
        </h3>
        <button className="panel-close-button" onClick={onClose}>
          <RightArrowIcon />
        </button>
      </div>
      
      <div className="forms-panel-content">
        {/* Only show content when panel is open */}
        {isOpen && (
          <>
            {isLoading && (
              <div className="loading-state">
                <LoadingSpinner />
                <p>Chargement en cours...</p>
              </div>
            )}
            
            {error && (
              <div className="error-state">
                <p>{error}</p>
                <button onClick={handleRetry} className="retry-button">
                  Réessayer
                </button>
              </div>
            )}
            
            {!isLoading && !error && !selectedTemplate && !submissionSuccess && (
              <>
                {formTemplates.length === 0 ? (
                  <div className="empty-state">
                    <p>Aucun formulaire disponible pour votre spécialité.</p>
                  </div>
                ) : (
                  <div className="form-templates-list">
                    {formTemplates.map((template) => (
                      <div 
                        key={template.idModele} 
                        className="form-template-item"
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <h4>{template.nom}</h4>
                        {template.description && <p>{template.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            
            {!isLoading && !error && selectedTemplate && !submissionSuccess && (
              <div className="form-content-wrapper">
                {/* Left Column - Section Navigation */}
                <div className="form-sections-navigation">
                  <div className="form-nav-header">
                    <button 
                      className="back-to-list-button" 
                      onClick={handleBackToList}
                      title="Retour à la liste des formulaires"
                    >
                      <BackIcon />
                      <span>Retour</span>
                    </button>
                  </div>
                  
                  <div className="form-sections-list">
                    {formStructure.length === 0 ? (
                      <div className="empty-state">
                        <p>Ce formulaire ne contient aucune section.</p>
                      </div>
                    ) : (
                      <>
                        <ul>
                          {formStructure
                            .sort((a, b) => a.ordreAffichage - b.ordreAffichage)
                            .map((section) => (
                              <li 
                                key={section.idSection}
                                className={activeSection === section.idSection ? 'active' : ''}
                                onClick={() => scrollToSection(section.idSection)}
                              >
                                {section.nom}
                              </li>
                            ))}
                        </ul>
                        
                        {/* Form action buttons - placed directly below the sections list */}
                        <div className="form-sections-buttons">
                          <button 
                            className="submit-btn sidebar-btn" 
                            onClick={handleSubmit}
                            disabled={isSubmitting || !activeVisitId}
                          >
                            {isSubmitting ? 'Envoi en cours...' : 'Enregistrer'}
                          </button>
                          <button 
                            className="pdf-btn sidebar-btn" 
                            onClick={handleGeneratePDF}
                            disabled={isSubmitting || isGeneratingPDF || !activeVisitId}
                          >
                            <div className="btn-with-icon">
                              <PDFIcon />
                              <span>{isGeneratingPDF ? 'Génération en cours...' : 'Générer PDF'}</span>
                            </div>
                          </button>
                          <button 
                            className="cancel-btn sidebar-btn" 
                            onClick={handleBackToList}
                            disabled={isSubmitting}
                          >
                            Annuler
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Right Column - Form Fields */}
                <div className="form-fields-container" ref={contentRef}>
                {formStructure.length === 0 ? (
                  <div className="empty-state">
                    <p>Ce formulaire ne contient aucune section.</p>
                  </div>
                ) : (
                  <div className="form-sections">
                    {renderSections(formStructure)}
                  </div>
                )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Remove the empty forms-panel-footer div */}
    </div>
  );
};

const PatientProfile = () => {
  const params = useParams();
  const location = useLocation();
  const { ipp } = params;
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Add missing refs
  const patientMenuRef = useRef<HTMLDivElement>(null);
  const componentMounted = useRef<boolean>(false);
  
  // Set user role as data attribute on body
  useEffect(() => {
    if (user && user.role) {
      document.body.setAttribute('data-role', user.role.toUpperCase());
    }
    
    return () => {
      document.body.removeAttribute('data-role');
    };
  }, [user]);
  
  // Check if we're in edit mode based on URL pattern
  const isEditMode = location.pathname.includes('/agent/patient/edit/');
  
  // Get patient data from location state if available
  const locationPatientData = location.state?.patientData as Patient | undefined;
  
  // State for patient data
  const [patient, setPatient] = useState<Patient | null>(locationPatientData || null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hasActiveVisit, setHasActiveVisit] = useState<boolean>(false);
  
  // State for UI
  const [activeTab, setActiveTab] = useState<'resume' | 'documents' | 'visits' | 'vitals' | 'prescriptions' | 'allergies'>('resume');
  const [showPatientMenu, setShowPatientMenu] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [openMenuVisitId, setOpenMenuVisitId] = useState<number | null>(null);
  
  // State for modals and forms
  const [showStartVisitForm, setShowStartVisitForm] = useState<boolean>(false);
  const [showEndVisitModal, setShowEndVisitModal] = useState<boolean>(false);
  const [showDeleteVisitModal, setShowDeleteVisitModal] = useState<boolean>(false);
  const [showEditVisitForm, setShowEditVisitForm] = useState<boolean>(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false);
  const [showAddDocumentModal, setShowAddDocumentModal] = useState<boolean>(false);
  const [currentVisitId, setCurrentVisitId] = useState<number | null>(null);
  const [currentVisit, setCurrentVisit] = useState<Visit | null>(null);
  const [currentVisitToEdit, setCurrentVisitToEdit] = useState<Visit | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState<boolean>(false);
  const [assignDoctorModalOpen, setAssignDoctorModalOpen] = useState<boolean>(false);
  const [activeVisitId, setActiveVisitId] = useState<number | null>(null);
  const [activeVisitData, setActiveVisitData] = useState<Visit | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [activeVisitNote, setActiveVisitNote] = useState('');
  const [notesVisitId, setNotesVisitId] = useState<number | null>(null);
  const [formsOpen, setFormsOpen] = useState(false);
  const [formsExpanded, setFormsExpanded] = useState(false);
  const [biometricFormOpen, setBiometricFormOpen] = useState(false);
  const [vitalSignsFormOpen, setVitalSignsFormOpen] = useState(false);
  const [showNoVisitAlert, setShowNoVisitAlert] = useState<boolean>(false);
  
  // Listen for the form-expanded class on body to sync state
  useEffect(() => {
    const updateFormsExpanded = () => {
      setFormsExpanded(document.body.classList.contains('form-expanded'));
    };
    
    // Create observer to watch for class changes on body
    const observer = new MutationObserver(updateFormsExpanded);
    observer.observe(document.body, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);
  
  // Function to handle form visibility changes from VitalSignsHeader
  const handleVitalSignsFormVisibilityChange = (isVisible: boolean) => {
    setVitalSignsFormOpen(isVisible);
  };
  
  // Function to handle adding a document with active visit check
  const handleAddDocument = () => {
    // Check if there's an active visit
    if (!activeVisitId) {
      // No active visit, show the alert
      setShowNoVisitAlert(true);
      return;
    }
    
    // Has active visit, proceed normally
    setShowAddDocumentModal(true);
  };
  
  // Function to close the no visit alert
  const handleCloseNoVisitAlert = () => {
    setShowNoVisitAlert(false);
  };
  
  // Function to open a form with a specific model ID
  const handleOpenForm = (modelId: number) => {
    console.log(`Opening form with model ID: ${modelId}`);
    
    // First set the forms panel to open
    setFormsOpen(true);
    
    // If this is opening a biometric form specifically
    if (modelId === 1) {
      setBiometricFormOpen(true);
      console.log("Setting biometric form open to true");
    }
    
    // Use a small timeout to ensure the forms panel is mounted
    setTimeout(() => {
      // Create and dispatch an event to the forms panel to open the specified model
      const formsPanel = document.querySelector('.forms-panel');
      if (formsPanel) {
        console.log("Found forms panel, dispatching openFormModel event");
        // Create a custom event with the model ID
        const event = new CustomEvent('openFormModel', {
          detail: { modelId }
        });
        
        // Dispatch the event to the forms panel
        formsPanel.dispatchEvent(event);
      } else {
        console.error("Could not find forms panel element");
        
        // If forms panel wasn't found, retry after a longer delay
        setTimeout(() => {
          const retryFormsPanel = document.querySelector('.forms-panel');
          if (retryFormsPanel) {
            console.log("Retry found forms panel, dispatching openFormModel event");
            const retryEvent = new CustomEvent('openFormModel', {
              detail: { modelId }
            });
            retryFormsPanel.dispatchEvent(retryEvent);
          } else {
            console.error("Still could not find forms panel element after retry");
          }
        }, 500);
      }
    }, 100);
  };
  
  // Debug white screen issue
  useEffect(() => {
    console.log('PatientProfile component mounted');
    console.log('ipp:', ipp);
    console.log('showing user:', user);
  }, []);
  
  // Close patient menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (patientMenuRef.current && 
          !patientMenuRef.current.contains(event.target as Node) &&
          !(event.target as Element).closest('.menu-button')) {
        setShowPatientMenu(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Close row menu when clicking outside
  useEffect(() => {
    function handleRowMenuClickOutside(event: MouseEvent) {
      if (!(event.target as Element).closest('.row-menu-button') && 
          !(event.target as Element).closest('.row-menu-popup')) {
        setOpenMenuVisitId(null);
      }
    }
    
    document.addEventListener('mousedown', handleRowMenuClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleRowMenuClickOutside);
    };
  }, []);
  
  // Helper function to get the current doctor's ID
  const getCurrentDoctorId = (): string | null => {
    if (!user || user.role !== 'MEDECIN') return null;
    
    // Try to get doctor ID from user object using similar logic as in Dashboard component
    if ((user as any).idMedecin) return (user as any).idMedecin.toString();
    if ((user as any).medecin?.idMedecin) return (user as any).medecin.idMedecin.toString();
    if (user.id) return user.id.toString();
    if (user.idUtilisateur) return user.idUtilisateur.toString();
    
    return null;
  };

  // Helper function to filter visits for doctors
  const filterVisitsForDoctor = (visitsList: Visit[]): Visit[] => {
    const doctorId = getCurrentDoctorId();
    
    // If not a doctor or no doctor ID available, return all visits (for agents/admins)
    if (!doctorId || user?.role !== 'MEDECIN') return visitsList;
    
    // Filter visits to only show those belonging to the current doctor
    return visitsList.filter(visit => {
      const visitDoctorId = visit.medecin?.idMedecin || visit.idMedecin;
      return visitDoctorId === doctorId;
    });
  };
  
  // Fetch patient data
  const fetchPatientData = async () => {
    console.log('fetchPatientData called with IPP:', ipp);
    
    if (!ipp) {
      console.error('No IPP provided in URL params');
      setIsLoading(false);
      return;
    }
    
    // Reset states before fetching
    setIsLoading(true);
    setError(null);
    
    // Check for authentication
    if (!user) {
      console.error('User not authenticated, redirecting to login');
      setIsLoading(false);
      navigate('/login');
      return;
    }
    
    try {
      // 1. First try to fetch the patient data
      const endpoint = API_ENDPOINTS.PATIENTS.GET_BY_ID(ipp);
      console.log('Making API request to:', endpoint);
      
      let patientData = null;
      
      try {
        const patientResponse = await axios.get(endpoint, {
          headers: { 
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        console.log('Patient API response status:', patientResponse.status);
        console.log('Patient API response data type:', typeof patientResponse.data);
        
        if (patientResponse.data) {
          // Extract patient data from different possible response formats
          if (patientResponse.data.patient) {
            patientData = patientResponse.data.patient;
            console.log('Extracted patient from response.data.patient');
          } else if (patientResponse.data.status === 'success' && patientResponse.data.nom) {
            patientData = patientResponse.data;
            console.log('Extracted patient from response.data with success status');
          } else {
            patientData = patientResponse.data;
            console.log('Using response.data directly as patient data');
          }
          
          // Check if we have valid patient data
          if (!patientData || (!patientData.nom && !patientData.prenom)) {
            console.error('Patient data is missing essential fields', patientData);
            throw new Error('Patient data format invalid');
          }
          
          console.log('Setting patient data:', patientData);
          setPatient(patientData);
        } else {
          throw new Error('Empty response from patient API');
        }
      } catch (patientError: unknown) {
        console.error('Failed to fetch patient:', patientError);
        setPatient(null);
        setError('Impossible de récupérer les données du patient');
        setIsLoading(false);
        return;
      }
      
      // 2. Then try to fetch visits and documents, but don't block rendering on these
      try {
        // Use Promise.allSettled instead of Promise.all to handle partial failures
        const visitsEndpoint = API_ENDPOINTS.VISITS.GET_BY_PATIENT(ipp);
        const documentsEndpoint = API_ENDPOINTS.DOCUMENTS.GET_BY_PATIENT(ipp);
        
        console.log('Fetching additional data from:', visitsEndpoint, documentsEndpoint);
        
        const [visitsResult, documentsResult] = await Promise.allSettled([
          axios.get(visitsEndpoint),
          axios.get(documentsEndpoint)
        ]);
        
        // Process visits if request was successful
        if (visitsResult.status === 'fulfilled') {
          const visitsResponse = visitsResult.value;
          console.log('Visits API response status:', visitsResponse.status);
          
          const visitsList = visitsResponse.data?.visites || [];
          console.log('Visits found:', visitsList.length);
          
          // Filter visits for doctors to only see their own visits
          const filteredVisits = filterVisitsForDoctor(visitsList);
          console.log('Filtered visits for current doctor:', filteredVisits.length);
          
          setVisits(filteredVisits);
          
          // Check if patient has any active visits for this doctor
          const activeVisit = filteredVisits.some((visit: { statut: string }) => visit.statut === 'IN_PROGRESS');
          setHasActiveVisit(activeVisit);
          
          // Set the activeVisitId if there's an active visit
          const activeVisitObj = filteredVisits.find((visit: { statut: string }) => visit.statut === 'IN_PROGRESS');
          if (activeVisitObj) {
            setActiveVisitId(activeVisitObj.idVisite);
            setActiveVisitData(activeVisitObj);
          } else {
            setActiveVisitId(null);
            setActiveVisitData(null);
          }
        } else {
          console.warn('Failed to fetch visits:', visitsResult.reason);
          setVisits([]);
        }
        
        // Process documents if request was successful
        if (documentsResult.status === 'fulfilled') {
          const documentsResponse = documentsResult.value;
          console.log('Documents API response status:', documentsResponse.status);
          
          const documentsList = documentsResponse.data?.documents || [];
          console.log('Documents found:', documentsList.length);
          setDocuments(documentsList);
        } else {
          console.warn('Failed to fetch documents:', documentsResult.reason);
          setDocuments([]);
        }
      } catch (secondaryError: unknown) {
        console.error('Error fetching secondary data:', secondaryError);
        // Still show the profile even if we can't get visits or documents
        setVisits([]);
        setDocuments([]);
      }
    } catch (error: unknown) {
      console.error('Unhandled error in fetchPatientData:', error);
      setError('Une erreur inattendue est survenue lors du chargement des données');
      setPatient(null);
    } finally {
      console.log('fetchPatientData complete');
      setIsLoading(false);
    }
  };
  
  // Handle successful visit creation
  const handleVisitCreated = () => {
    // Refresh the visits data
    fetchPatientData();
    // Show the visits tab
    setActiveTab('visits');
  };
  
  // Handle end visit confirmation
  const handleEndVisit = () => {
    if (currentVisitId) {
      setIsLoading(true);
      axios.post(API_ENDPOINTS.VISITS.END(currentVisitId))
        .then(() => {
          // Reset visit-related states
          setHasActiveVisit(false);
          setActiveVisitId(null);
          setActiveVisitData(null);
          
          // Refresh data
          fetchPatientData();
          // Success message could be shown here if needed
        })
        .catch(error => {
          console.error('Error ending visit:', error);
          alert('Erreur lors de la clôture de la visite');
        })
        .finally(() => {
          setShowEndVisitModal(false);
          setCurrentVisitId(null);
          setIsLoading(false);
        });
    }
  };
  
  // Handle delete visit confirmation
  const handleDeleteVisit = () => {
    if (currentVisitId) {
      // Check if we're deleting the active visit
      const isActiveVisit = currentVisitId === activeVisitId;
      
      setIsLoading(true);
      axios.delete(API_ENDPOINTS.VISITS.DELETE(currentVisitId))
        .then(() => {
          // Reset states if active visit was deleted
          if (isActiveVisit) {
            setHasActiveVisit(false);
            setActiveVisitId(null);
            setActiveVisitData(null);
          }
          
          // Refresh data without showing success message
          fetchPatientData();
        })
        .catch(error => {
          console.error('Error deleting visit:', error);
          // Show a more helpful error message
          alert('Erreur lors de la suppression de la visite. Veuillez réessayer plus tard.');
        })
        .finally(() => {
          setShowDeleteVisitModal(false);
          setCurrentVisitId(null);
          setIsLoading(false);
        });
    }
  };
  
  // Handle saving notes
  const handleSaveNotes = async (noteText: string) => {
    if (!notesVisitId) return;
    
    try {
      const response = await axios.put(API_ENDPOINTS.VISITS.SAVE_NOTE(notesVisitId), {
        note: noteText
      });
      
      if (response.status === 200) {
        // Update the note in the visits list
        setVisits(prevVisits => {
          return prevVisits.map(visit => {
            if (visit.idVisite === notesVisitId) {
              return { ...visit, note: noteText };
            }
            return visit;
          });
        });
        
        // Close the notes panel
        setNotesOpen(false);
      }
    } catch (err) {
      console.error('Error saving note:', err);
      alert('Erreur lors de la sauvegarde de la note. Veuillez réessayer.');
    }
  };
  
  // Open notes for a specific visit
  const openNotes = (visitId: number, note: string = '') => {
    setNotesVisitId(visitId);
    setActiveVisitNote(note || '');
    setNotesOpen(true);
  };
  
  // Open edit visit form
  const openEditVisitForm = (visit: Visit) => {
    // Only allow editing in-progress visits
    if (visit.statut !== 'IN_PROGRESS') {
      alert('Seules les visites en cours peuvent être modifiées.');
      return;
    }
    
    setCurrentVisitToEdit(visit);
    setShowEditVisitForm(true);
  };
  
  // Open document viewer
  const openDocumentViewer = (document: Document) => {
    setCurrentDocument(document);
    setShowDocumentViewer(true);
    
    // Hide the circular action buttons when document viewer is open
    const fixedActionButtons = window.document.querySelector('.fixed-action-buttons');
    if (fixedActionButtons) {
      fixedActionButtons.classList.add('hidden');
    }
  };
  
  // Handle document deletion
  const handleDeleteDocument = async (documentId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.')) {
      try {
        setIsLoading(true);
        
        await axios.delete(API_ENDPOINTS.DOCUMENTS.DELETE(documentId));
        
        // Close the document viewer
        setShowDocumentViewer(false);
        
        // Show the circular action buttons again when document viewer is closed
        const fixedActionButtons = window.document.querySelector('.fixed-action-buttons');
        if (fixedActionButtons) {
          fixedActionButtons.classList.remove('hidden');
        }
        
        // Refresh documents data
        fetchPatientData();
        
      } catch (error: unknown) {
        console.error('Error deleting document:', error);
        alert('Erreur lors de la suppression du document. Veuillez réessayer plus tard.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Handle document metadata update
  const handleUpdateMetadata = async (documentId: number, data: DocumentMetadataUpdate) => {
    try {
      setIsLoading(true);
      
      // Map internal field names to API field names
      const apiData: Record<string, string> = {};
      if (data.title !== undefined) apiData.title = data.title;
      if (data.description !== undefined) apiData.description = data.description;
      
      console.log('Updating document metadata with:', apiData);
      
      const response = await axios.put(API_ENDPOINTS.DOCUMENTS.UPDATE_METADATA(documentId), apiData);
      console.log('Document metadata update response:', response.data);
      
      // Check if the response contains the updated document
      if (response.data?.success && response.data?.document) {
        // Update the current document in state
        setCurrentDocument(response.data.document);
        
        // Also update the document in the documents array
        setDocuments(docs => 
          docs.map(doc => 
            doc.idDocument === documentId ? response.data.document : doc
          )
        );
      }
      
      // Close the document viewer
      setShowDocumentViewer(false);
      
      // Show the circular action buttons again when document viewer is closed
      const fixedActionButtons = window.document.querySelector('.fixed-action-buttons');
      if (fixedActionButtons) {
        fixedActionButtons.classList.remove('hidden');
      }
      
      // Refresh documents data in the background
      fetchPatientData();
      
    } catch (error: unknown) {
      console.error('Error updating document metadata:', error);
      alert('Erreur lors de la mise à jour des informations du document. Veuillez réessayer plus tard.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle document file update
  const handleUpdateFile = async (documentId: number, file: File) => {
    try {
      setIsLoading(true);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.put(
        API_ENDPOINTS.DOCUMENTS.UPDATE_FILE(documentId),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      console.log('Document file update response:', response.data);
      
      // Check if the response contains the updated document
      if (response.data?.success && response.data?.document) {
        // Update the current document in state
        setCurrentDocument(response.data.document);
        
        // Also update the document in the documents array
        setDocuments(docs => 
          docs.map(doc => 
            doc.idDocument === documentId ? response.data.document : doc
          )
        );
      }
      
      // Close the document viewer
      setShowDocumentViewer(false);
      
      // Show the circular action buttons again when document viewer is closed
      const fixedActionButtons = window.document.querySelector('.fixed-action-buttons');
      if (fixedActionButtons) {
        fixedActionButtons.classList.remove('hidden');
      }
      
      // Refresh documents data
      fetchPatientData();
      
    } catch (error: unknown) {
      console.error('Error updating document file:', error);
      alert('Erreur lors de la mise à jour du fichier. Veuillez réessayer plus tard.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial data fetch with cleanup and mounted check
  useEffect(() => {
    console.log('Data fetch effect triggered for patient IPP:', ipp);
    console.log('Current user authentication:', !!user);
    console.log('Has location state data:', !!locationPatientData);
    
    componentMounted.current = true;
    
    // Always fetch supplementary data (visits, documents) even if we have patient data from location state
    if (ipp && user) {
      if (locationPatientData) {
        console.log('Using patient data from navigation state, but still fetching visits and documents');
        // Just fetch visits and documents
        fetchSupplementaryData();
      } else {
        console.log('Starting complete data fetch');
        fetchPatientData();
      }
    } else {
      console.warn('Missing required data for fetch: IPP or user missing');
      setIsLoading(false);
    }
    
    // Cleanup function
    return () => {
      console.log('PatientProfile component unmounting');
      componentMounted.current = false;
    };
  }, [ipp, user]);
  
  // Helper function to fetch just visits and documents
  const fetchSupplementaryData = async () => {
    if (!ipp || !componentMounted.current) return;
    
    try {
      // Use Promise.allSettled to handle partial failures
      const visitsEndpoint = API_ENDPOINTS.VISITS.GET_BY_PATIENT(ipp);
      const documentsEndpoint = API_ENDPOINTS.DOCUMENTS.GET_BY_PATIENT(ipp);
      
      console.log('Fetching supplementary data from:', visitsEndpoint, documentsEndpoint);
      
      const [visitsResult, documentsResult] = await Promise.allSettled([
        axios.get(visitsEndpoint),
        axios.get(documentsEndpoint)
      ]);
      
      // Process visits if request was successful
      if (visitsResult.status === 'fulfilled') {
        const visitsResponse = visitsResult.value;
        const visitsList = visitsResponse.data?.visites || [];
        
        // Filter visits for doctors to only see their own visits
        const filteredVisits = filterVisitsForDoctor(visitsList);
        console.log('Filtered visits for current doctor:', filteredVisits.length);
        
        setVisits(filteredVisits);
        
        // Check if patient has any active visits for this doctor
        const activeVisit = filteredVisits.some((visit: { statut: string }) => visit.statut === 'IN_PROGRESS');
        setHasActiveVisit(activeVisit);
      } else {
        console.warn('Failed to fetch visits:', visitsResult.reason);
        setVisits([]);
      }
      
      // Process documents if request was successful
      if (documentsResult.status === 'fulfilled') {
        const documentsResponse = documentsResult.value;
        const documentsList = documentsResponse.data?.documents || [];
        setDocuments(documentsList);
      } else {
        console.warn('Failed to fetch documents:', documentsResult.reason);
        setDocuments([]);
      }
    } catch (error: unknown) {
      console.error('Error fetching supplementary data:', error);
      setVisits([]);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate age from birthdate
  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const dob = new Date(birthDate);
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    
    return age;
  };
  
  // Format date to French format with smart date display
  const formatDate = (dateString: string, showTime: boolean = true): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let formattedDate = '';
    
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      formattedDate = "Aujourd'hui";
    }
    // Check if it's yesterday
    else if (date.toDateString() === yesterday.toDateString()) {
      formattedDate = "Hier";
    }
    // Otherwise, show the full date
    else {
      formattedDate = date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    
    // Add time if requested
    if (showTime) {
      formattedDate += ` à ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    return formattedDate;
  };
  
  // Handle back button click
  const handleBackClick = () => {
    console.log('Navigating back to dashboard');
    // Always go directly to dashboard
    navigate('/dashboard');
  };
  
  // This function is no longer needed as we removed the user menu
  // Keeping the state for compatibility
  
  // Catch any rendering errors
  useEffect(() => {
    console.log('About to render PatientProfile');
    if (!isLoading && !patient) {
      console.log('Will render not found state');
    } else if (!isLoading && patient) {
      console.log('Will render patient profile', patient);
    }
  }, [isLoading, patient]);

  // Emergency render function in case something's wrong
  const safeRender = () => {
    try {
      if (isLoading) {
        return (
          <div className="patient-profile-container" style={{ position: 'relative', minHeight: '100vh' }}>
            <div className="loading-spinner"></div>
            <p style={{ textAlign: 'center', marginTop: '200px' }}>Chargement des données du patient...</p>
          </div>
        );
      }
      
      // Render error state if patient not found
      if (!patient) {
        return (
          <div className="patient-profile-container">
            <div className="patient-not-found">
              <h2>Patient non trouvé</h2>
              {error ? (
                <p className="error-message">{error}</p>
              ) : (
                <p>Le patient avec l'identifiant {ipp} n'existe pas ou n'est pas accessible.</p>
              )}
              <button 
                className="back-button" 
                style={{ padding: '10px 20px', background: '#1E513B', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '20px' }}
                onClick={handleBackClick}
              >
                Retour au tableau de bord
              </button>
            </div>
          </div>
        );
      }
      
      return true; // Continue with normal rendering
    } catch (error) {
      console.error('Error in safeRender:', error);
      return (
        <div className="patient-profile-container" style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Erreur lors de l'affichage du profil</h2>
          <p>Une erreur s'est produite lors de l'affichage du profil du patient.</p>
          <button 
            style={{ padding: '10px 20px', background: '#1E513B', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '20px' }}
            onClick={() => navigate('/dashboard')}
          >
            Retour au tableau de bord
          </button>
        </div>
      );
    }
  };
  
  // Check if we need to use the emergency render
  const safeRenderResult = safeRender();
  if (safeRenderResult !== true) {
    return safeRenderResult;
  }
  
  // Original loading state
  if (isLoading) {
    return (
      <div className="patient-profile-container" style={{ position: 'relative', minHeight: '100vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  // Original error state if patient not found
  if (!patient) {
    return (
      <div className="patient-profile-container">
        <div className="patient-not-found">
          <h2>Patient non trouvé</h2>
          <p>Le patient avec l'identifiant {ipp} n'existe pas.</p>
          <button className="back-button" onClick={handleBackClick}>
            <BackIcon /> Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }
  
  // Only render the full UI if we have complete patient data
  if (!patient.ipp || !patient.nom) {
    console.error('Missing critical patient data for rendering', patient);
    return (
      <div className="patient-profile-container">
        <div className="patient-not-found">
          <h2>Erreur de données patient</h2>
          <p>Les données du patient sont incomplètes ou incorrectes.</p>
          <button 
            className="back-button" 
            style={{ padding: '10px 20px', background: '#1E513B', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '20px' }}
            onClick={handleBackClick}
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  // Main render - wrapped in try-catch for safety
  try {
    return (
      <div className={`patient-profile-container ${notesOpen ? 'notes-open' : ''} ${formsOpen ? 'forms-open' : ''}`}>
        {/* Top Navigation Bar */}
      <header className={`profile-header ${notesOpen ? 'notes-open' : ''} ${formsOpen ? 'forms-open' : ''} ${formsExpanded ? 'expanded-panel' : ''}`}>
        <div className="left-section" style={{ display: 'flex', alignItems: 'center' }}>
        <div className="logo">
          <a href="/dashboard" title="Accueil">
            <img src="/noBgWhite.png" alt="H-DOC Logo" className="logo-image" />
          </a>
        </div>
          {patient && (
            <div className="patient-header-info">
              <span className="patient-header-name">
                {patient.prenom} {patient.nom}
              </span>
              <span className="patient-header-details">
                <span className={patient.sexe === 'M' ? 'male-text' : 'female-text'}>
                  {patient.sexe === 'M' ? '♂ Homme' : '♀ Femme'}
                </span>, {patient.dateNaissance ? calculateAge(patient.dateNaissance) : '?'} ans
              </span>
              {hasActiveVisit && (
                <span className="active-visit-badge">
                  Visite en cours
                </span>
              )}
            </div>
          )}
        </div>
        <div className="header-buttons">
          {!isEditMode && (
            <>
              {/* 3-dots menu first (to the left) - only show for non-MEDECIN roles */}
              {user?.role !== 'MEDECIN' && (
                <div className="patient-actions-dropdown">
                  <button 
                    className="menu-button" 
                    onClick={() => setShowPatientMenu(!showPatientMenu)}
                    aria-label="Options du patient"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="2" fill="white"></circle>
                      <circle cx="12" cy="5" r="2" fill="white"></circle>
                      <circle cx="12" cy="19" r="2" fill="white"></circle>
                    </svg>
                  </button>
                </div>
              )}
              {/* Visit buttons to the right of 3-dots */}
              {hasActiveVisit ? (
                <button 
                  className="start-visit-button" 
                  onClick={() => {
                    const activeVisit = visits.find(v => v.statut === 'IN_PROGRESS');
                    if (activeVisit) {
                      setCurrentVisitId(activeVisit.idVisite);
                      setShowEndVisitModal(true);
                    }
                  }}
                >Clôturer la visite</button>
              ) : (
                user?.role !== 'MEDECIN' && (
                  <button 
                    className="start-visit-button" 
                    onClick={() => setShowStartVisitForm(true)}
                  >Démarrer une visite</button>
                )
              )}
            </>
          )}
          
          {/* X button always visible */}
          <button className="close-button" onClick={handleBackClick}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          {!isEditMode && showPatientMenu && (
            <div className="patient-menu" ref={patientMenuRef}>
                <button 
                  className="patient-menu-item" 
                  onClick={() => {
                    navigate(`/agent/patient/edit/${ipp}`);
                    setShowPatientMenu(false);
                  }}
                >
                  <EditIcon />
                  Modifier le patient
                </button>
                <button 
                  className="patient-menu-item" 
                  onClick={() => {
                    // This doesn't do anything as per requirements
                    alert("Cette fonctionnalité n'est pas encore disponible.");
                    setShowPatientMenu(false);
                  }}
                >
                  <DeleteIcon />
                  Supprimer le patient
                </button>
              </div>
          )}
        </div>
      </header>
      
      {/* Main Content Area with Sidebar */}
      {isEditMode ? (
        <div className="edit-mode-container">
          <PatientEdit />
        </div>
      ) : (
        <div className={`profile-content ${notesOpen ? 'notes-open' : ''} ${formsOpen ? 'forms-open' : ''} ${formsExpanded ? 'expanded-panel' : ''}`}>
        {/* Left Sidebar */}
        <aside className="profile-sidebar">
          <nav className="sidebar-nav">
            <button 
              className={`nav-item ${activeTab === 'resume' ? 'active' : ''}`}
              onClick={() => setActiveTab('resume')}
            >
              <PatientSummaryIcon />
              <span>Résumé Patient</span>
            </button>
            {user && user.role === 'MEDECIN' && (
              <button 
                className={`nav-item ${activeTab === 'vitals' ? 'active' : ''}`}
                onClick={() => setActiveTab('vitals')}
              >
                <VitalSignsIcon />
                <span>Signes vitaux / biométrie</span>
              </button>
            )}
            {user && user.role === 'MEDECIN' && (
              <button 
                className={`nav-item ${activeTab === 'prescriptions' ? 'active' : ''}`}
                onClick={() => setActiveTab('prescriptions')}
              >
                <PrescriptionIcon />
                <span>Ordonnances</span>
              </button>
            )}
            <button 
              className={`nav-item ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              <DocumentIcon />
              <span>Documents</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'allergies' ? 'active' : ''}`}
              onClick={() => setActiveTab('allergies')}
            >
              <AllergiesIcon />
              <span>Allergies</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'visits' ? 'active' : ''}`}
              onClick={() => setActiveTab('visits')}
            >
              <VisitIcon />
              <span>Visites</span>
            </button>
          </nav>
        </aside>
        
        {/* Main Content */}
        <main className="profile-main">
          {/* Patient Header */}
          <div className="patient-header">
            <div className="patient-avatar">
              {patient.prenom?.[0] || ''}{patient.nom?.[0] || ''}
            </div>
            <div className="patient-title">
              <h1>
                {patient.prenom} {patient.nom} 
                <span className={`patient-gender ${patient.sexe === 'M' ? 'male' : 'female'}`}>
                  {patient.sexe === 'M' ? '♂ ' : '♀ '}
                  {patient.sexe === 'M' ? 'Homme' : 'Femme'}
                </span>
              </h1>
              <div className="patient-subtitle">
                {patient.dateNaissance && (
                  <>
                    <span>{calculateAge(patient.dateNaissance)} ans</span>
                    <span className="patient-info-separator">•</span>
                    <span>{formatDate(patient.dateNaissance, false)}</span>
                    <span className="patient-info-separator">•</span>
                    <span className="patient-ipp">IPP: {patient.ipp}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Vital Signs Header - Displayed only for doctors */}
          {user && user.role === 'MEDECIN' && (
            <VitalSignsHeader 
              patientIPP={ipp || ''} 
              patientId={patient?.idPatient}
              openForm={handleOpenForm}
              activeVisitId={activeVisitId}
              getCurrentDoctorId={getCurrentDoctorId}
              onFormVisibilityChange={handleVitalSignsFormVisibilityChange}
            />
          )}
          
          {/* Content based on active tab */}
          {activeTab === 'resume' && (
            <div className="patient-resume">
              <div className="info-section">
                <h3>Informations de contact</h3>
                <div className="info-table">
                  <div className="info-row-item">
                    <div className="info-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                    </div>
                    <div className="info-key">Téléphone:</div>
                    <div className="info-value-inline">{patient.telephone || 'Non renseigné'}</div>
                  </div>
                  
                  {patient.email && (
                    <div className="info-row-item">
                      <div className="info-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                      </div>
                      <div className="info-key">Email:</div>
                      <div className="info-value-inline">{patient.email}</div>
                    </div>
                  )}
                  
                  <div className="info-row-item">
                    <div className="info-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                    </div>
                    <div className="info-key">Adresse:</div>
                    <div className="info-value-inline">{patient.adresse || 'Non renseignée'}{patient.ville && `, ${patient.ville}`}</div>
                  </div>
                </div>
              </div>
              
              <div className="info-section">
                <h3>Contact d'urgence</h3>
                {patient.contactUrgencePrenom ? (
                  <div className="info-table">
                    <div className="info-row-item">
                      <div className="info-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                      </div>
                      <div className="info-key">{patient.contactUrgenceRelation}:</div>
                      <div className="info-value-inline">{patient.contactUrgencePrenom}</div>
                    </div>
                    
                    {patient.contactUrgenceTelephone && (
                      <div className="info-row-item">
                        <div className="info-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                              </svg>
                        </div>
                        <div className="info-key">Téléphone:</div>
                        <div className="info-value-inline">{patient.contactUrgenceTelephone}</div>
                      </div>
                    )}
                    
                    {patient.contactUrgenceAdresse && (
                      <div className="info-row-item">
                        <div className="info-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                        </div>
                        <div className="info-key">Adresse:</div>
                        <div className="info-value-inline">{patient.contactUrgenceAdresse}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="info-row-item empty-contact">
                    <div className="info-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                    </div>
                    <div className="empty-info-text">Aucun contact d'urgence enregistré</div>
                  </div>
                )}
              </div>
              
              <div className="info-section">
                <h3>Informations supplémentaires</h3>
                <div className="info-table">
                  <div className="info-row-item">
                    <div className="info-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                    </div>
                    <div className="info-key">Naissance:</div>
                    <div className="info-value-inline">{patient.lieuNaissance || 'Non renseigné'}</div>
                  </div>
                  
                  <div className="info-row-item">
                    <div className="info-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                        <path d="M16 2v2"></path>
                        <path d="M8 2v2"></path>
                        <path d="M3 10h18"></path>
                      </svg>
                    </div>
                    <div className="info-key">CIN:</div>
                    <div className="info-value-inline">{patient.cin || 'Non renseigné'}</div>
                  </div>
                  
                  <div className="info-row-item">
                    <div className="info-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                    <div className="info-key">État civil:</div>
                    <div className="info-value-inline">{patient.etatCivil || 'Non renseigné'}</div>
                  </div>
                  
                  <div className="info-row-item">
                    <div className="info-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                      </svg>
                    </div>
                    <div className="info-key">Nationalité:</div>
                    <div className="info-value-inline">{patient.nationalite || 'Non renseignée'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'vitals' && (
            <VitalSignsBiometrics
              patientIPP={ipp || ''}
              patientId={patient.idPatient} // Pass the UUID of the patient
              openForm={handleOpenForm} // Pass the openForm function
              onFormVisibilityChange={handleVitalSignsFormVisibilityChange}
              activeVisitId={activeVisitId}
              getCurrentDoctorId={getCurrentDoctorId}
            />
          )}
          
          {activeTab === 'prescriptions' && (
            <div className="patient-prescriptions">
              <div className="section-header">
                <h2>Ordonnances du patient</h2>
              </div>
              <div className="empty-state">
                <br />
                <PrescriptionIcon />
                <p>Aucune ordonnance disponible pour le moment</p>
              </div>
            </div>
          )}
          
          {activeTab === 'allergies' && (
            <div className="patient-allergies">
              <div className="section-header">
                <h2>Allergies du patient</h2>
              </div>
              <div className="empty-state">
                <br />
                <AllergiesIcon />
                <p>Aucune allergie enregistrée pour le moment.</p>
              </div>
            </div>
          )}
          
          {activeTab === 'documents' && (
            <div className="patient-documents">
              <div className="section-header">
                <h2>Documents du patient</h2>
                <button 
                  className="add-button"
                  onClick={handleAddDocument}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px' 
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                    Ajouter un document
                  </div>
                </button>
              </div>
              {documents.length === 0 ? (
                <div className="empty-state">
                                <br />

                  <DocumentIcon />
                  <p>Aucun document disponible pour ce patient</p>
                </div>
              ) : (
                <div className="documents-grid">
                  {documents.map((doc) => {
                    // Function to determine if the document is an image type
                    const isImageType = (type: string): boolean => {
                      if (!type) return false;
                      
                      const lowerType = type.toLowerCase();
                      return lowerType.includes('image') || 
                             lowerType.includes('jpg') || 
                             lowerType.includes('jpeg') || 
                             lowerType.includes('png') || 
                             lowerType.includes('gif') ||
                             lowerType.includes('webp') ||
                             lowerType.includes('svg') ||
                             lowerType.includes('bmp') ||
                             doc.url?.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i) !== null;
                    };
                    
                    // Generate document preview based on type
                    const getDocumentPreview = () => {
                      if (isImageType(doc.typeDocument)) {
                        return (
                          <div className="document-thumbnail image-thumbnail">
                            <img 
                              src={doc.url} 
                              alt={doc.nom}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiI+PC9yZWN0PjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ij48L2NpcmNsZT48cG9seWxpbmUgcG9pbnRzPSIyMSAxNSAxNiAxMCA1IDIxIj48L3BvbHlsaW5lPjwvc3ZnPg==";
                              }}
                            />
                          </div>
                        );
                      } else if (doc.typeDocument?.toLowerCase().includes('pdf') || doc.url?.toLowerCase().endsWith('.pdf')) {
                        return (
                          <div className="document-thumbnail pdf-thumbnail">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <rect x="6" y="13" width="12" height="8"></rect>
                            </svg>
                          </div>
                        );
                      } else if (doc.typeDocument?.toLowerCase().includes('doc') || 
                              doc.typeDocument?.toLowerCase().includes('word') ||
                              doc.url?.toLowerCase().match(/\.(doc|docx)$/i) !== null) {
                        return (
                          <div className="document-thumbnail doc-thumbnail">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2980b9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                          </div>
                        );
                      } else {
                        return (
                          <div className="document-thumbnail generic-thumbnail">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7f8c8d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                          </div>
                        );
                      }
                    };
                    
                    return (
                      <div 
                        key={doc.idDocument} 
                        className="document-card"
                        onClick={() => openDocumentViewer(doc)}
                      >
                        {getDocumentPreview()}
                        <div className="document-card-info">
                          <h3 className="document-card-title">{doc.nom}</h3>
                          <p className="document-card-date">{formatDate(doc.dateAjout)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Document Viewer Modal */}
              <DocumentViewer 
                isOpen={showDocumentViewer}
                onClose={() => {
                  setShowDocumentViewer(false);
                  
                  // Show the circular action buttons again when document viewer is closed
                  const fixedActionButtons = window.document.querySelector('.fixed-action-buttons');
                  if (fixedActionButtons) {
                    fixedActionButtons.classList.remove('hidden');
                  }
                }}
                document={currentDocument}
                onDelete={handleDeleteDocument}
                onUpdateMetadata={handleUpdateMetadata}
                onUpdateFile={handleUpdateFile}
                formatDate={formatDate}
              />
            </div>
          )}
          
          {activeTab === 'visits' && (
            <div className="patient-visits">
              <div className="section-header">
                <h2>Historique des visites</h2>
                <div className="visit-count-badge">
                  {visits.length} {visits.length > 1 ? 'visites' : 'visite'} au total
                </div>
              </div>
              
              {visits.length === 0 ? (
                <div className="empty-state">
                  <br />
                  <VisitIcon />
                  <p>Aucune visite enregistrée pour ce patient</p>
                </div>
              ) : (
                <ul className="visits-list">
                  {visits.map((visit) => (
                    <li key={visit.idVisite} className="visit-item">
                      <div className={`visit-status ${visit.statut === 'IN_PROGRESS' ? 'active' : 'completed'}`}>
                        {visit.statut === 'IN_PROGRESS' ? 'En cours' : 'Terminée'}
                      </div>
                      
                      <div className="visit-info">
                        <div className="visit-header-row">
                          <div className="visit-title-wrapper">
                            <h3 className="visit-title">{visit.typeVisite}</h3>
                            {visit.service && <span className="service-tag">{visit.service}</span>}
                          </div>
                          <div className="visit-dates-compact">
                            <div className="date-badge start-date">
                              <span className="date-label">Début</span>
                              <span className="date-value">{formatDate(visit.dateDebut)}</span>
                            </div>
                            {visit.dateFin && (
                              <div className="date-badge end-date">
                                <span className="date-label">Fin</span>
                                <span className="date-value">{formatDate(visit.dateFin)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="visit-content-row">
                          <div className="visit-doctor-section">
                            {visit.medecin ? (
                              <>
                                <div className="visit-doctor-card">
                                  <div className="doctor-avatar">
                                    {visit.medecin.prenom.charAt(0)}{visit.medecin.nom.charAt(0)}
                                  </div>
                                  <div className="doctor-details">
                                    <div className="doctor-name">Dr. {visit.medecin.prenom} {visit.medecin.nom}</div>
                                    {visit.medecin.nomSpecialite && 
                                      <div className="doctor-specialty">{visit.medecin.nomSpecialite}</div>
                                    }
                                  </div>
                                </div>
                                <span className="vertical-separator"></span>
                                <span className="reason-label">Motif :</span>
                                <span className="reason-text">{visit.motif}</span>
                              </>
                            ) : visit.idMedecin ? (
                              <>
                                <div className="visit-doctor-card loading">
                                  <div className="doctor-avatar skeleton"></div>
                                  <div className="doctor-details">
                                    <div className="doctor-name skeleton-text" data-doctor-id={visit.idMedecin}>
                                      <span className="refreshing-doctor">Chargement...</span>
                                    </div>
                                    <div className="doctor-specialty skeleton-text">...</div>
                                  </div>
                                </div>
                                <span className="vertical-separator"></span>
                                <span className="reason-label">Motif :</span>
                                <span className="reason-text">{visit.motif}</span>
                              </>
                            ) : (
                              <>
                                <div className="visit-doctor-card empty">
                                  <div className="no-doctor-message">Aucun médecin assigné</div>
                                </div>
                                <span className="vertical-separator"></span>
                                <span className="reason-label">Motif :</span>
                                <span className="reason-text">{visit.motif}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="visit-actions">
                        {visit.statut === 'IN_PROGRESS' ? (
                          <div className="visit-action-buttons horizontal">
                            <button 
                              className="link-button edit with-icon"
                              onClick={() => openEditVisitForm(visit)}
                              title="Modifier les informations de la visite"
                            >
                              Modifier les informations sur la visite <EditIcon />
                            </button>
                            <button 
                              className="link-button delete with-icon"
                              onClick={() => {
                                setCurrentVisitId(visit.idVisite);
                                setShowDeleteVisitModal(true);
                              }}
                              title="Annuler la visite"
                            >
                              Annuler la visite <DeleteIcon />
                            </button>
                          </div>
                        ) : (
                          <div className="visit-action-buttons horizontal">
                            <button 
                              className="link-button delete with-icon"
                              onClick={() => {
                                setCurrentVisitId(visit.idVisite);
                                setShowDeleteVisitModal(true);
                              }}
                              title="Supprimer la visite"
                            >
                              Supprimer la visite <DeleteIcon />
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </main>
        
        {/* Fixed action buttons */}
        {user?.role === 'MEDECIN' && hasActiveVisit && (
          <div className={`fixed-action-buttons ${(formsOpen || notesOpen || biometricFormOpen || vitalSignsFormOpen) ? 'hidden' : ''}`}>
            {/* Forms button */}
            <button 
              className="forms-button"
              onClick={() => setFormsOpen(!formsOpen)}
              disabled={formsOpen}
              title="Formulaires Médicaux"
            >
              <FormIcon />
            </button>
            
            {/* Notes button - only enabled for active visits */}
            <button 
              className="notes-button"
              onClick={() => {
                if (hasActiveVisit) {
                  const activeVisit = visits.find(v => v.statut === 'IN_PROGRESS');
                  if (activeVisit) {
                    openNotes(activeVisit.idVisite, activeVisit.note);
                  }
                }
              }}
              disabled={notesOpen}
              title="Notes du médecin"
            >
              <PenIcon />
            </button>
          </div>
        )}
      </div>
      )}
      
      {/* Start Visit Sliding Panel */}
      {ipp && (
        <StartVisitForm 
          isOpen={showStartVisitForm}
          onClose={() => setShowStartVisitForm(false)}
          patientIPP={ipp}
          onSuccess={handleVisitCreated}
        />
      )}
      
      {/* Confirmation Modal for ending a visit */}
      <ConfirmationModal
        isOpen={showEndVisitModal}
        title="Clôturer la visite"
        message="Êtes-vous sûr de vouloir clôturer cette visite ? Cette action est irréversible."
        onConfirm={handleEndVisit}
        onCancel={() => {
          setShowEndVisitModal(false);
          setCurrentVisitId(null);
        }}
      />
      
      {/* Edit Visit Form */}
      {ipp && currentVisitToEdit && (
        <EditVisitForm
          isOpen={showEditVisitForm}
          onClose={() => {
            setShowEditVisitForm(false);
            setCurrentVisitToEdit(null);
          }}
          visit={currentVisitToEdit}
          onSuccess={fetchPatientData}
        />
      )}
      
      {/* Confirmation Modal for deleting a visit */}
      <ConfirmationModal
        isOpen={showDeleteVisitModal}
        title="Supprimer la visite"
        message={`Êtes-vous sûr de vouloir ${currentVisitId && visits.find(v => v.idVisite === currentVisitId)?.statut === 'IN_PROGRESS' ? 'annuler' : 'supprimer'} cette visite ? Cette action est irréversible.`}
        onConfirm={handleDeleteVisit}
        onCancel={() => {
          setShowDeleteVisitModal(false);
          setCurrentVisitId(null);
        }}
      />
      
      {/* Add Document Modal */}
      {ipp && (
        <AddDocumentModal
          isOpen={showAddDocumentModal}
          onClose={() => setShowAddDocumentModal(false)}
          patientIPP={ipp}
          onSuccess={fetchPatientData}
        />
      )}
      
      {/* Notes Component */}
      <NotesComponent 
        isOpen={notesOpen}
        onClose={() => {
          setNotesOpen(false);
        }}
        visitId={notesVisitId}
        note={activeVisitNote}
        onSave={handleSaveNotes}
      />
      {/* Forms Component */}
      <FormsComponent 
        isOpen={formsOpen}
        onClose={() => {
          setFormsOpen(false);
        }}
        getCurrentDoctorId={getCurrentDoctorId}
        user={user}
        patientIPP={ipp}
        patientId={patient?.idPatient} // Pass the patient UUID
        activeVisitId={activeVisitId}
      />
      
      {/* No active visit alert */}
      <NoActiveVisitAlert 
        isOpen={showNoVisitAlert}
        onClose={handleCloseNoVisitAlert}
      />
    </div>
  );
} catch (error: unknown) {
  console.error('Error rendering patient profile:', error);
  return (
    <div className="patient-profile-container">
      <div className="patient-not-found">
        <h2>Erreur lors de l'affichage</h2>
        <p>Une erreur inattendue s'est produite lors de l'affichage du profil.</p>
        <button 
          className="back-button" 
          style={{ padding: '10px 20px', background: '#1E513B', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '20px' }}
          onClick={() => navigate('/dashboard')}
        >
          Retour au tableau de bord
        </button>
      </div>
    </div>
  );
}
};

export default PatientProfile;