import React, { useState, useEffect } from 'react';
import { Appointment, AppointmentFormData, Patient, Doctor } from './types';
import { createAppointment, updateAppointment } from '../shared/api/appointmentService';
import axios from '../shared/api/axios';
import { API_ENDPOINTS } from '../shared/api/api.config';

// Add trash icon component
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

interface AppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  selectedAppointment?: Appointment;
  onAppointmentSaved: (appointment: Appointment) => void;
  extraActions?: React.ReactNode;
  deleteError?: string | null;
  userRole?: string;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  isOpen,
  onClose,
  selectedDate,
  selectedAppointment,
  onAppointmentSaved,
  extraActions,
  deleteError,
  userRole = "AGENT", // Default to AGENT if not provided
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [preventDropdownOpen, setPreventDropdownOpen] = useState(true);

  // Initial form state - used for resetting
  const initialFormState: AppointmentFormData = {
    idPatient: '',
    idMedecin: '',
    dateHeure: selectedDate ? selectedDate.toISOString() : new Date().toISOString(),
    durationMinutes: 30,
    commentaire: '',
    service: '',
    typeVisite: '',
    typeVisit: '',
  };

  const [formData, setFormData] = useState<AppointmentFormData>(initialFormState);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Reset form to initial state
  const resetForm = () => {
    setSelectedPatient(null);
    setSearchQuery('');
    setPatientSearchResults([]);
    setFormData({
      idPatient: '',
      idMedecin: '',
      dateHeure: selectedDate ? selectedDate.toISOString() : new Date().toISOString(),
      durationMinutes: 30,
      commentaire: '',
      service: '',
      typeVisite: '',
      typeVisit: '',
    });
  };

  // Initialize form with selected appointment data if editing
  useEffect(() => {
    // Ensure the dropdown doesn't open automatically when form opens
    setPreventDropdownOpen(true);
    
    // Use a short delay to re-enable dropdown functionality
    const timeoutId = setTimeout(() => {
      setPreventDropdownOpen(false);
    }, 500);

    if (selectedAppointment) {
      console.log('Selected appointment for editing:', selectedAppointment);
      console.log('typeVisite:', selectedAppointment.typeVisite);
      console.log('typeVisit:', selectedAppointment.typeVisit);
      console.log('Original dateHeure:', selectedAppointment.dateHeure);
      
      // Get the visit type from either typeVisit or typeVisite field
      const visitType = selectedAppointment.typeVisit || selectedAppointment.typeVisite || '';
      console.log('Determined visit type:', visitType);
      
      // Create a new form data object with the selected appointment values
      const updatedFormData = {
        idPatient: selectedAppointment.idPatient,
        idMedecin: selectedAppointment.idMedecin,
        dateHeure: selectedAppointment.dateHeure,
        durationMinutes: selectedAppointment.durationMinutes,
        commentaire: selectedAppointment.commentaire || '',
        service: selectedAppointment.service || '',
        // Set both fields to the same value to ensure consistency
        typeVisite: visitType,
        typeVisit: visitType,
      };
      
      console.log('Form data after setting from appointment:', updatedFormData);
      setFormData(updatedFormData);

      // If we have the patient data in the appointment, set it as selected
      if (selectedAppointment.patient) {
        setSelectedPatient(selectedAppointment.patient);
      }
    } else if (selectedDate) {
      // When creating a new appointment, initialize with selected date
      // but clear all other fields to ensure form is empty
      console.log('Selected date from calendar, creating new appointment:', selectedDate);
      
      // Clear form completely then set the dateHeure from selected date
      resetForm();
      
      // Make sure only the date is set, not any other fields
      setFormData(prevData => ({
        ...prevData,
        dateHeure: selectedDate.toISOString(),
      }));
      
      console.log('Form data date after setting:', new Date(selectedDate.toISOString()).toLocaleTimeString());
    }

    // Clean up timeout
    return () => clearTimeout(timeoutId);
  }, [selectedAppointment, selectedDate]);

  // Fetch all doctors when the form opens
  useEffect(() => {
    const fetchAllDoctors = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(API_ENDPOINTS.DOCTORS.GET_ALL);
        
        // Extract doctors array from response
        const allDoctors = response.data && response.data.medecins ? response.data.medecins : [];
        setAvailableDoctors(allDoctors);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        setErrorMessage('Impossible de récupérer les médecins.');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchAllDoctors();
    }
  }, [isOpen]);

  // Handle patient search
  const handlePatientSearch = async (query: string) => {
    // Don't search if prevention flag is active
    if (preventDropdownOpen) return;

    if (query.length < 2) {
      setPatientSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await axios.get(`${API_ENDPOINTS.PATIENTS.SEARCH}?query=${query}`);
      
      if (response.data && response.data.patients) {
        setPatientSearchResults(response.data.patients);
      } else {
        setPatientSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      setPatientSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handlePatientSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Form input change handler
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // If service is changed, reset doctor selection
    if (name === 'service') {
      setFormData(prev => ({ ...prev, [name]: value, idMedecin: '' }));
    } else if (name === 'typeVisite') {
      // Always update both typeVisite and typeVisit when either one changes
      console.log('TypeVisite changed to:', value);
      setFormData(prev => ({ ...prev, typeVisite: value, typeVisit: value }));
    } else if (name === 'typeVisit') {
      // Ensure both fields stay in sync
      console.log('TypeVisit changed to:', value);
      setFormData(prev => ({ ...prev, typeVisite: value, typeVisit: value }));
    } else {
    setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Select a patient from search results
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({ ...prev, idPatient: patient.idPatient }));
    setSearchQuery(''); // Clear search after selection
    setPatientSearchResults([]);
  };

  // Clear selected patient
  const handleClearPatient = () => {
    setSelectedPatient(null);
    setFormData(prev => ({ ...prev, idPatient: '' }));
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error message
    setErrorMessage('');
    
    // Validate form - all required fields must be present
    if (!formData.idPatient) {
      setErrorMessage('Veuillez sélectionner un patient.');
      return;
    }
    
    if (!formData.idMedecin) {
      setErrorMessage('Veuillez sélectionner un médecin.');
      return;
    }
    
    if (!formData.typeVisite) {
      setErrorMessage('Veuillez sélectionner un type de visite.');
      return;
    }
    
    // Check if appointment is in the past
    const appointmentDate = new Date(formData.dateHeure);
    const now = new Date();
    if (appointmentDate < now) {
      setErrorMessage('Impossible de créer un rendez-vous dans le passé.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get the exact local date/time from the form
      const dateTimeField = document.getElementById('dateHeure') as HTMLInputElement;
      if (dateTimeField && dateTimeField.value) {
        const [datePart, timePart] = dateTimeField.value.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes] = timePart.split(':').map(Number);
        
        // Create a date in local time first
        console.log('Input date parts:', { year, month, day, hours, minutes });
        
        // Add 1 hour to fix scheduling issue - the backend seems to subtract 1 hour
        // This is consistent for both new appointments and updates
        const adjustedHours = hours + 1;
        console.log('Adjusted hours (+1):', adjustedHours);
        
        // Create date with hour adjustment to match backend expectations
        const localDate = new Date(year, month - 1, day, adjustedHours, minutes, 0, 0);
        const dateString = localDate.toISOString();
        
        console.log('Appointment date (local with +1 hour):', localDate.toString());
        console.log('Appointment ISO string:', dateString);
        
        // If editing, log the comparison to help debugging
        if (selectedAppointment?.id) {
          console.log('Original appointment time:', selectedAppointment.dateHeure);
          console.log('New appointment time:', dateString);
          console.log('Original time formatted:', new Date(selectedAppointment.dateHeure).toLocaleString());
          console.log('New time formatted:', localDate.toLocaleString());
        }
        
        // Update the form data with the adjusted time
        formData.dateHeure = dateString;
      }
      
      // Ensure both typeVisit and typeVisite are set to the same value
      const visitType = formData.typeVisite || formData.typeVisit || '';
      formData.typeVisite = visitType;
      formData.typeVisit = visitType;
      
      console.log('Submitting appointment with data:', formData);
      
      let savedAppointment: Appointment;
      
      if (selectedAppointment?.id) {
        // Update existing appointment
        console.log('Updating appointment with ID:', selectedAppointment.id);
        savedAppointment = await updateAppointment(selectedAppointment.id, formData);
        console.log('Appointment updated successfully:', savedAppointment);
      } else {
        // Create new appointment
        console.log('Creating new appointment');
        savedAppointment = await createAppointment(formData);
        console.log('Appointment created successfully:', savedAppointment);
      }
      
      console.log('About to call onAppointmentSaved with:', savedAppointment);
      onAppointmentSaved(savedAppointment);
      console.log('Called onAppointmentSaved');
      
      resetForm(); // Reset form after successful submission
      onClose();
      console.log('Form closed successfully');
    } catch (error) {
      console.error('Error saving appointment:', error);
      
      // Check if this is a specific error we want to display directly
      if (error instanceof Error) {
        // Display the specific error message from the backend
        setErrorMessage(error.message);
      } else {
        // Generic error message for other errors
        setErrorMessage('Erreur lors de l\'enregistrement du rendez-vous. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format date for datetime-local input
  const formatDateTimeForInput = (isoString: string) => {
    console.log('Formatting ISO string for input:', isoString);
    
    try {
      // Parse the ISO string to create a Date object
    const date = new Date(isoString);
    
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', isoString);
        return '';
      }
      
      console.log('Date object created:', date.toString());
      console.log('Local time from ISO:', date.toLocaleTimeString());
      
      // Format to YYYY-MM-DDThh:mm using local timezone values
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
      const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
      console.log('Formatted for input:', formattedDate);
      return formattedDate;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  return (
    <div className={`side-panel appointment-form-panel ${isOpen ? 'open' : ''}`}>
      <div className="side-panel-header">
        <h2>{selectedAppointment?.id ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}</h2>
        <button className="close-panel-btn" onClick={onClose}>×</button>
      </div>
      <div className="side-panel-content">
        <form onSubmit={handleSubmit}>
          {/* Date and Time */}
          <div className="form-group">
            <label htmlFor="dateHeure">Date et heure</label>
            <input
              type="datetime-local"
              id="dateHeure"
              name="dateHeure"
              value={formatDateTimeForInput(formData.dateHeure)}
              onChange={handleInputChange}
              required
            />
          </div>
          
          {/* Duration */}
          <div className="form-group">
            <label htmlFor="durationMinutes">Durée (minutes)</label>
            <select
              id="durationMinutes"
              name="durationMinutes"
              value={formData.durationMinutes}
              onChange={handleInputChange}
              required
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 heure</option>
              <option value="90">1 heure 30 minutes</option>
              <option value="120">2 heures</option>
            </select>
          </div>
          
          {/* Patient Selection */}
          <div className="form-group">
            <label htmlFor="patientSearch">Patient</label>
            {selectedPatient ? (
              <div className="selected-patient">
                <div className="patient-info">
                  <div className="patient-name">
                    {selectedPatient.prenom} {selectedPatient.nom}
                  </div>
                  <div className="patient-details">
                    <span className="patient-id">IPP: {selectedPatient.ipp}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="clear-selection-btn"
                  onClick={handleClearPatient}
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="search-container">
                <input
                  type="text"
                  id="patientSearch"
                  placeholder="Rechercher un patient..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {isSearching && <div className="search-spinner"></div>}
                
                {patientSearchResults.length > 0 && (
                  <div className="search-results-rdv">
                    <ul className="patient-list">
                      {patientSearchResults.map(patient => (
                        <li
                          key={patient.idPatient}
                          className="patient-item"
                          onClick={() => handleSelectPatient(patient)}
                        >
                          <div className="patient-avatar">
                            {patient.prenom.charAt(0)}{patient.nom.charAt(0)}
                          </div>
                          <div className="patient-info">
                            <div className="patient-name-row">
                              <span className="patient-name">{patient.prenom} {patient.nom}</span>
                            </div>
                            <div className="patient-details-second-row">
                              <span className="patient-id">IPP: {patient.ipp}</span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Service Selection */}
          <div className="form-group">
            <label htmlFor="service">Service</label>
            <select
              id="service"
              name="service"
              value={formData.service}
              onChange={handleInputChange}
              required
            >
              <option value="">Sélectionner un service</option>
              <option value="Médecine Générale">Médecine Générale</option>
              <option value="Pédiatrie">Pédiatrie</option>
              <option value="Orthopédie">Orthopédie</option>
              <option value="Dermatologie">Dermatologie</option>
            </select>
          </div>
          
          {/* Doctor Selection */}
          <div className="form-group">
            <label htmlFor="idMedecin">Prestataire</label>
            <select
              id="idMedecin"
              name="idMedecin"
              value={formData.idMedecin}
              onChange={handleInputChange}
              required
            >
              <option value="">Sélectionner un prestataire</option>
              {availableDoctors
                .filter(doctor => !formData.service || doctor.nomSpecialite === formData.service)
                .map(doctor => (
                <option key={doctor.idMedecin} value={doctor.idMedecin}>
                  Dr. {doctor.prenom} {doctor.nom} ({doctor.nomSpecialite})
                </option>
              ))}
            </select>
          </div>
          
          {/* Type de visite - UPDATED to include only the 3 specified types */}
          <div className="form-group">
            <label htmlFor="typeVisite">Type de visite</label>
            <select
              id="typeVisite"
              name="typeVisite"
              value={formData.typeVisite}
              onChange={handleInputChange}
              required
            >
              <option value="">Sélectionner un type</option>
              <option value="CONSULTATION">Consultation</option>
              <option value="SUIVI">Suivi</option>
              <option value="CONTROLE">Contrôle</option>
            </select>
          </div>
          
          {/* Comment - Only show when creating a new appointment, not when editing */}
          {!selectedAppointment?.id && (
            <div className="form-group">
              <label htmlFor="commentaire">Note</label>
              <textarea
                id="commentaire"
                name="commentaire"
                value={formData.commentaire}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
          )}
          
          {/* Error Messages */}
          {errorMessage && (
            <div className="error-message">{errorMessage}</div>
          )}
          
          {/* Delete Error Message */}
          {deleteError && (
            <div className="error-message">{deleteError}</div>
          )}
          
          {/* Submit Button */}
          <div className={`form-actions ${userRole === "AGENT" ? "agent-form-actions" : ""}`}>
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </button>
            
            {/* Extra actions for non-agent users */}
            {userRole !== "AGENT" && extraActions}
            
            <button
              type="submit"
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="button-spinner"></div>
              ) : selectedAppointment?.id ? (
                'Mettre à jour'
              ) : (
                'Enregistrer'
              )}
            </button>
            
            {/* Delete button as icon for agent users */}
            {userRole === "AGENT" && selectedAppointment?.id && (
              <button
                type="button"
                className="delete-icon-btn"
                onClick={() => {
                  // Check if extraActions is a React element with onClick
                  const element = extraActions as React.ReactElement<{
                    onClick: () => void;
                    disabled: boolean;
                  }>;
                  
                  if (element && element.props && typeof element.props.onClick === 'function') {
                    element.props.onClick();
                  }
                }}
                disabled={isLoading}
                title="Supprimer"
              >
                <TrashIcon />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm; 