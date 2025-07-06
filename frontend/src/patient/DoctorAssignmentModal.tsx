import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../shared/api/api.config';
import { Doctor, Specialty } from '../dashboard/types';

interface DoctorAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignDoctor: (doctor: Doctor) => void;
  currentDoctorId?: string; // Optional: ID of the currently assigned doctor to exclude
}

const DoctorAssignmentModal: React.FC<DoctorAssignmentModalProps> = ({
  isOpen,
  onClose,
  onAssignDoctor,
  currentDoctorId
}) => {
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [unavailableDoctors, setUnavailableDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<number | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start with loading state
  const [error, setError] = useState<string | null>(null);

  // Load specialties on initial load
  useEffect(() => {
    if (isOpen) {
      console.log("Doctor modal opened, currentDoctorId:", currentDoctorId);
      // Force a refresh when the component is mounted to ensure proper filtering
      fetchSpecialties();
      fetchDoctors();
    }
  }, [isOpen, currentDoctorId]);

  // Fetch doctors when specialty changes
  useEffect(() => {
    if (isOpen) {
      console.log('Specialty changed or modal opened, fetching doctors with specialtyId:', selectedSpecialtyId);
      console.log('Current doctor ID to exclude:', currentDoctorId);
      fetchDoctors();
    }
  }, [selectedSpecialtyId, isOpen, currentDoctorId]);

  const fetchSpecialties = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(API_ENDPOINTS.SPECIALTIES.GET_FILTERABLE);
      
      console.log('Specialties response:', response.data);
      
      // Handle specific API response format
      let specialtiesList = [];
      
      if (response.data && Array.isArray(response.data.specialites)) {
        specialtiesList = response.data.specialites;
      } else if (Array.isArray(response.data)) {
        specialtiesList = response.data;
      } else {
        console.error('Unexpected specialties response format:', response.data);
        specialtiesList = [];
      }
      
      // Extract actual field names from the first item to understand the structure
      if (specialtiesList.length > 0) {
        console.log('First specialty object keys:', Object.keys(specialtiesList[0]));
        console.log('First specialty object:', specialtiesList[0]);
      }
      
      setSpecialties(specialtiesList);
    } catch (error) {
      console.error('Error fetching specialties:', error);
      setError('Impossible de charger les spécialités');
      setSpecialties([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Create API endpoint based on selected specialty
      console.log('Current selectedSpecialtyId:', selectedSpecialtyId);
      let endpoint;
      
      if (selectedSpecialtyId) {
        endpoint = API_ENDPOINTS.DOCTORS.GET_BY_SPECIALTY(selectedSpecialtyId);
        console.log('Using specialty endpoint:', endpoint);
      } else {
        endpoint = API_ENDPOINTS.DOCTORS.GET_ALL;
        console.log('Using all doctors endpoint:', endpoint);
      }
      
      console.log('Fetching doctors from endpoint:', endpoint);
      
      // Fetch available doctors
      const availableResponse = await axios.get(endpoint);
      console.log('Available doctors response:', availableResponse.data);
      
      // Handle backend-specific response format
      let doctors = [];
      if (availableResponse.data && Array.isArray(availableResponse.data.medecins)) {
        console.log('Getting doctors from medecins array:', availableResponse.data.medecins);
        doctors = availableResponse.data.medecins;
      } else if (Array.isArray(availableResponse.data)) {
        console.log('Getting doctors from top-level array:', availableResponse.data);
        doctors = availableResponse.data;
      } else {
        console.error('Unexpected doctors response format:', availableResponse.data);
        doctors = [];
      }
      
      // Filter out the current doctor if an ID is provided
      if (currentDoctorId) {
        console.log('Filtering out current doctor with ID:', currentDoctorId);
        doctors = doctors.filter(doctor => {
          console.log(`Comparing doctor ${doctor.idMedecin} with current ${currentDoctorId}: ${doctor.idMedecin !== currentDoctorId}`);
          return doctor.idMedecin !== currentDoctorId;
        });
        console.log('Doctors after filtering:', doctors);
      }
      
      setAvailableDoctors(doctors);
      
      // Fetch all unavailable doctors (without specialty filter)
      const unavailableResponse = await axios.get(API_ENDPOINTS.DOCTORS.GET_UNAVAILABLE);
      console.log('Unavailable doctors response:', unavailableResponse.data);
      
      let allUnavailableDoctors = [];
      
      // Handle backend-specific response format for unavailable doctors
      if (unavailableResponse.data && Array.isArray(unavailableResponse.data.medecins)) {
        allUnavailableDoctors = unavailableResponse.data.medecins;
      } else if (Array.isArray(unavailableResponse.data)) {
        allUnavailableDoctors = unavailableResponse.data;
      } else {
        console.error('Unexpected unavailable doctors response format:', unavailableResponse.data);
        allUnavailableDoctors = [];
      }
      
      // First filter out the current doctor from unavailable doctors list as well
      if (currentDoctorId) {
        console.log('Filtering out current doctor from unavailable doctors with ID:', currentDoctorId);
        allUnavailableDoctors = allUnavailableDoctors.filter(doctor => doctor.idMedecin !== currentDoctorId);
      }
      
      // If a specialty is selected, filter unavailable doctors in the frontend
      if (selectedSpecialtyId) {
        console.log('Filtering unavailable doctors for specialty ID:', selectedSpecialtyId);
        // Filter unavailable doctors by the selected specialty
        const filteredUnavailableDoctors = allUnavailableDoctors.filter(doctor => {
          // Log each doctor to debug
          console.log(`Checking doctor ${doctor.prenom} ${doctor.nom}, specialty: ${doctor.nomSpecialite}, specialty ID: ${doctor.idSpecialite}, selected ID: ${selectedSpecialtyId}`);
          
          // Convert both to same type (string) for comparison
          return String(doctor.idSpecialite) === String(selectedSpecialtyId);
        });
        
        console.log('Filtered unavailable doctors:', filteredUnavailableDoctors);
        setUnavailableDoctors(filteredUnavailableDoctors);
      } else {
        // If no specialty is selected, show all unavailable doctors
        setUnavailableDoctors(allUnavailableDoctors);
      }
      
      // Reset selection when doctors change
      setSelectedDoctor(null);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError('Impossible de charger la liste des médecins');
      setAvailableDoctors([]);
      setUnavailableDoctors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpecialtyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    console.log('Selected specialty raw value:', value);
    
    // Handle empty string case explicitly
    if (value === '') {
      console.log('No specialty selected, setting to null');
      setSelectedSpecialtyId(null);
      return;
    }
    
    try {
      // Try to parse as a number
      const specialtyId = parseInt(value, 10);
      
      // Check if the parsed value is a valid number
      if (!isNaN(specialtyId)) {
        console.log('Parsed valid specialtyId:', specialtyId);
        setSelectedSpecialtyId(specialtyId);
      } else {
        console.error('Failed to parse specialty ID as number:', value);
        setSelectedSpecialtyId(null);
      }
    } catch (error) {
      console.error('Error parsing specialty ID:', error);
      setSelectedSpecialtyId(null);
    }
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    if (doctor.status === 'AVAILABLE') {
      setSelectedDoctor(doctor);
    }
  };

  const handleAssign = () => {
    if (selectedDoctor) {
      onAssignDoctor(selectedDoctor);
      onClose();
    }
  };

  if (!isOpen) return null;
  
  console.log('DoctorAssignmentModal rendering with currentDoctorId:', currentDoctorId);

  return (
    <div className="modal-overlay doctor-assignment-modal">
      <div className="modal-content" style={{ width: '600px', maxHeight: '85vh', padding: 0 }}>
        <div className="modal-header">
          <div className="modal-title">
            <h3>{currentDoctorId ? 'Modifier le médecin' : 'Assigner un médecin'}</h3>
          </div>
          <button className="close-modal-button" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="modal-body">
          {/* Specialty filter */}
          <div className="specialty-filter">
            <select 
              value={selectedSpecialtyId?.toString() || ''} 
              onChange={handleSpecialtyChange}
            >
              <option value="">Toutes les spécialités</option>
              {specialties && specialties.length > 0 ? (
                specialties.map((specialty) => {
                  // Log the full specialty details to see the structure
                  console.log('Specialty option rendering:', specialty);
                  
                  // Make sure we use idSpecialite as the correct ID field
                  const id = specialty.idSpecialite;
                  const name = specialty.nom|| 'Spécialité';
                  
                  console.log(`Rendering specialty option: ID=${id}, Name=${name}`);
                  
                  return (
                    <option 
                      key={id || `specialty-${name}`} 
                      value={id}
                    >
                      {name}
                    </option>
                  );
                })
              ) : null}
            </select>
          </div>

          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
            </div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div className="doctors-list-container">
              {/* Available doctors section */}
              {availableDoctors.length > 0 && (
                <div className="doctors-section">
                  <div className="section-header">
                    Médecins disponibles ({availableDoctors.length})
                  </div>
                  {availableDoctors.map((doctor) => (
                    <div
                      key={doctor.idMedecin}
                      className={`doctor-item ${selectedDoctor?.idMedecin === doctor.idMedecin ? 'selected' : ''}`}
                      onClick={() => handleDoctorSelect(doctor)}
                    >
                      <div className="doctor-content">
                        <div className="doctor-badge">
                          {doctor.prenom.charAt(0)}{doctor.nom.charAt(0)}
                        </div>
                        <div className="doctor-info">
                          <div className="doctor-name">
                            Dr. {doctor.prenom} {doctor.nom}
                          </div>
                          <div className="doctor-specialty">
                            {doctor.nomSpecialite}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Unavailable doctors section */}
              {unavailableDoctors.length > 0 && (
                <div className="doctors-section">
                  <div className="section-header">
                    Médecins non disponibles ({unavailableDoctors.length})
                  </div>
                  {unavailableDoctors.map((doctor) => (
                    <div
                      key={doctor.idMedecin}
                      className="doctor-item unavailable"
                    >
                      <div className="doctor-content">
                        <div className="doctor-badge">
                          {doctor.prenom.charAt(0)}{doctor.nom.charAt(0)}
                        </div>
                        <div className="doctor-info">
                          <div className="doctor-name">
                            Dr. {doctor.prenom} {doctor.nom}
                          </div>
                          <div className="doctor-specialty">
                            {doctor.nomSpecialite}
                          </div>
                        </div>
                      </div>
                      <div className="doctor-status">
                        Non disponible
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {availableDoctors.length === 0 && unavailableDoctors.length === 0 && (
                <div className="no-doctors-message">
                  {selectedSpecialtyId 
                    ? "Aucun médecin trouvé pour cette spécialité" 
                    : "Aucun médecin disponible"}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            Annuler
          </button>
          <button 
            className="confirm-button" 
            onClick={handleAssign}
            disabled={!selectedDoctor || isLoading}
          >
            {selectedDoctor ? 'Assigner' : 'Sélectionner un médecin'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorAssignmentModal;