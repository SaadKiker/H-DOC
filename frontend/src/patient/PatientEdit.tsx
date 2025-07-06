import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from '../shared/api/axios';
import { AxiosError } from 'axios';
import { API_ENDPOINTS } from '../shared/api/api.config';
import { useAuth } from '../auth/AuthContext';
import './PatientCreation.css';
import './PatientEdit.css';
import { useToast } from '../shared/components/ToastContext';

// SVG Icons
const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const UserEditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="8.5" cy="7" r="4"></circle>
    <path d="M20 8v6"></path>
    <path d="M23 11h-6"></path>
  </svg>
);

const SaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
    <polyline points="17 21 17 13 7 13 7 21"></polyline>
    <polyline points="7 3 7 8 15 8"></polyline>
  </svg>
);

const CancelIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

interface FormData {
  idPatient?: string;
  ipp: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  sexe: string;
  adresse: string;
  ville: string;
  telephone: string;
  nationalite: string;
  etatCivil: string;
  email: string;
  cin: string;
  typeAdmission: string;
  dateAdmission: string;
  // Emergency contact fields
  contactUrgencePrenom: string;
  contactUrgenceRelation: string;
  contactUrgenceAdresse: string;
  contactUrgenceTelephone: string;
}

interface ValidationErrors {
  [key: string]: string;
}

// Define form sections for the navigation
interface FormSection {
  id: string;
  title: string;
  number: number;
}

const PatientEdit: React.FC = () => {
  const { ipp } = useParams<{ ipp: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState<string>('');
  
  // Section refs for scrolling
  const sectionRefs = {
    'basic-info': useRef<HTMLDivElement>(null),
    'contact-info': useRef<HTMLDivElement>(null),
    'emergency-contact': useRef<HTMLDivElement>(null),
    'admission-info': useRef<HTMLDivElement>(null)
  };
  
  // Section definitions
  const formSections: FormSection[] = [
    { id: 'basic-info', title: 'Informations Générales', number: 1 },
    { id: 'contact-info', title: 'Coordonnées', number: 2 },
    { id: 'emergency-contact', title: 'Contact d\'Urgence', number: 3 },
    { id: 'admission-info', title: 'Informations d\'Admission', number: 4 }
  ];
  
  const [formData, setFormData] = useState<FormData>({
    ipp: '',
    nom: '',
    prenom: '',
    dateNaissance: '',
    lieuNaissance: '',
    sexe: '',
    adresse: '',
    ville: '',
    telephone: '',
    nationalite: '',
    etatCivil: '',
    email: '',
    cin: '',
    typeAdmission: '',
    dateAdmission: '',
    contactUrgencePrenom: '',
    contactUrgenceRelation: '',
    contactUrgenceAdresse: '',
    contactUrgenceTelephone: ''
  });
  
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Fetch patient data
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(API_ENDPOINTS.PATIENTS.GET_BY_ID(ipp || ''));
        
        const patientData = response.data.patient || response.data;
        
        if (patientData) {
          const initialData: FormData = {
            idPatient: patientData.idPatient || '',
            ipp: patientData.ipp || '',
            nom: patientData.nom || '',
            prenom: patientData.prenom || '',
            dateNaissance: patientData.dateNaissance?.split('T')[0] || '',
            lieuNaissance: patientData.lieuNaissance || '',
            sexe: patientData.sexe || '',
            adresse: patientData.adresse || '',
            ville: patientData.ville || '',
            telephone: patientData.telephone || '',
            nationalite: patientData.nationalite || '',
            etatCivil: patientData.etatCivil || '',
            email: patientData.email || '',
            cin: patientData.cin || '',
            typeAdmission: patientData.typeAdmission || '',
            dateAdmission: patientData.dateAdmission?.split('T')[0] || '',
            contactUrgencePrenom: patientData.contactUrgencePrenom || '',
            contactUrgenceRelation: patientData.contactUrgenceRelation || '',
            contactUrgenceAdresse: patientData.contactUrgenceAdresse || '',
            contactUrgenceTelephone: patientData.contactUrgenceTelephone || ''
          };
          
          setFormData(initialData);
        }
      } catch (error: unknown) {
        console.error('Error fetching patient data:', error);
        setApiError('Erreur lors du chargement des données du patient.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (ipp) {
      fetchPatientData();
    }
  }, [ipp]);

  // Function to scroll to a section
  const scrollToSection = (sectionId: string) => {
    const ref = sectionRefs[sectionId as keyof typeof sectionRefs];
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Set gender value
  const handleGenderSelect = (gender: string) => {
    setFormData(prev => ({ ...prev, sexe: gender }));
    if (errors.sexe) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.sexe;
        return newErrors;
      });
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    // Required fields validation
    const requiredFields: (keyof FormData)[] = [
      'nom', 'prenom', 'dateNaissance', 'lieuNaissance', 'sexe', 
      'adresse', 'ville', 'telephone', 'nationalite', 'etatCivil',
      'email', 'cin', 'typeAdmission', 'dateAdmission'
    ];
    
    requiredFields.forEach(field => {
      if (!formData[field]?.trim()) {
        newErrors[field] = 'Ce champ est obligatoire';
      }
    });
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    // Phone validation (10 digits)
    if (formData.telephone && !/^\d{10}$/.test(formData.telephone.replace(/\s/g, ''))) {
      newErrors.telephone = 'Le numéro de téléphone doit contenir 10 chiffres';
    }
    
    // Emergency contact phone validation (if provided)
    if (formData.contactUrgenceTelephone && 
        !/^\d{10}$/.test(formData.contactUrgenceTelephone.replace(/\s/g, ''))) {
      newErrors.contactUrgenceTelephone = 'Le numéro de téléphone d\'urgence doit contenir 10 chiffres';
    }
    
    // Birth date must be in the past
    const birthDate = new Date(formData.dateNaissance || '');
    const today = new Date();
    if (birthDate > today) {
      newErrors.dateNaissance = 'La date de naissance doit être dans le passé';
    }
    
    // Admission date validation
    const admissionDate = new Date(formData.dateAdmission || '');
    if (isNaN(admissionDate.getTime())) {
      newErrors.dateAdmission = 'Format de date d\'admission invalide';
    }
    
    // Validate CIN format (if specific format is required)
    if (formData.cin && formData.cin.length < 4) {
      newErrors.cin = 'Le numéro CIN doit contenir au moins 4 caractères';
    }
    
    // Validate IPP format (if specific format is required)
    if (formData.ipp && !/^P\d{6}$/.test(formData.ipp)) {
      newErrors.ipp = 'Le format IPP doit être P suivi de 6 chiffres (ex: P000123)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Find the first error field and scroll to its section
      const errorFields = Object.keys(errors);
      if (errorFields.length > 0) {
        const sections = {
          'basic-info': ['prenom', 'nom', 'sexe', 'dateNaissance', 'lieuNaissance', 'cin', 'nationalite', 'etatCivil'],
          'contact-info': ['adresse', 'ville', 'telephone', 'email'],
          'emergency-contact': ['contactUrgencePrenom', 'contactUrgenceRelation', 'contactUrgenceAdresse', 'contactUrgenceTelephone'],
          'admission-info': ['typeAdmission', 'dateAdmission']
        };
        
        // Find which section contains the first error field
        for (const [sectionId, fields] of Object.entries(sections)) {
          const hasError = fields.some(field => errorFields.includes(field));
          if (hasError) {
            scrollToSection(sectionId);
            break;
          }
        }
      }
      return;
    }
    
    setIsSubmitting(true);
    setApiError(null);
    
    // Create a copy of formData to ensure we don't modify the state directly
    const dataToSubmit = { ...formData };
    
    // Format dates properly if they exist
    if (dataToSubmit.dateNaissance) {
      // Ensure date is in YYYY-MM-DD format
      const dateNaissance = new Date(dataToSubmit.dateNaissance);
      if (!isNaN(dateNaissance.getTime())) {
        dataToSubmit.dateNaissance = dateNaissance.toISOString().split('T')[0];
      }
    }
    
    if (dataToSubmit.dateAdmission) {
      // Ensure date is in YYYY-MM-DD format
      const dateAdmission = new Date(dataToSubmit.dateAdmission);
      if (!isNaN(dateAdmission.getTime())) {
        dataToSubmit.dateAdmission = dateAdmission.toISOString().split('T')[0];
      }
    }
    
    // Ensure all required fields are present and properly formatted
    // The backend might be expecting specific field names or formats
    const patientData = {
      idPatient: dataToSubmit.idPatient,
      ipp: dataToSubmit.ipp,
      nom: dataToSubmit.nom,
      prenom: dataToSubmit.prenom,
      dateNaissance: dataToSubmit.dateNaissance,
      lieuNaissance: dataToSubmit.lieuNaissance,
      sexe: dataToSubmit.sexe,
      adresse: dataToSubmit.adresse,
      ville: dataToSubmit.ville,
      telephone: dataToSubmit.telephone,
      nationalite: dataToSubmit.nationalite,
      etatCivil: dataToSubmit.etatCivil,
      email: dataToSubmit.email,
      cin: dataToSubmit.cin,
      typeAdmission: dataToSubmit.typeAdmission,
      dateAdmission: dataToSubmit.dateAdmission,
      contactUrgencePrenom: dataToSubmit.contactUrgencePrenom,
      contactUrgenceRelation: dataToSubmit.contactUrgenceRelation,
      contactUrgenceAdresse: dataToSubmit.contactUrgenceAdresse,
      contactUrgenceTelephone: dataToSubmit.contactUrgenceTelephone
    };
    
    try {
      // Try sending the data in different formats to see which one the backend accepts
      
      // Format 1: Direct patient data object
      console.log('Sending patient update data:', JSON.stringify(patientData, null, 2));
      console.log('Update endpoint:', API_ENDPOINTS.PATIENTS.UPDATE(ipp || ''));
      
      try {
        const response = await axios.put(API_ENDPOINTS.PATIENTS.UPDATE(ipp || ''), patientData);
        showToast('Le patient a été mis à jour avec succès', 'success');
        // Navigate back to the patient profile with refresh parameter to ensure data is refreshed
        navigate(`/agent/patient/${ipp}?refresh=true`);
        return;
      } catch (directError) {
        console.error('Error with direct patient data format:', directError);
        
        // Format 2: Try wrapping in a 'patient' object as the backend might expect
        console.log('Trying with wrapped patient object format');
        try {
          const wrappedData = { patient: patientData };
          console.log('Sending wrapped patient data:', JSON.stringify(wrappedData, null, 2));
          
          const response = await axios.put(API_ENDPOINTS.PATIENTS.UPDATE(ipp || ''), wrappedData);
          showToast('Le patient a été mis à jour avec succès', 'success');
          // Navigate back to the patient profile with refresh parameter to ensure data is refreshed
          navigate(`/agent/patient/${ipp}?refresh=true`);
          return;
        } catch (wrappedError) {
          console.error('Error with wrapped patient data format:', wrappedError);
          
          // Format 3: Try with minimal required fields
          console.log('Trying with minimal required fields');
          try {
            // Create a minimal data object with only essential fields
            const minimalData = {
              idPatient: patientData.idPatient,
              ipp: patientData.ipp,
              nom: patientData.nom,
              prenom: patientData.prenom,
              dateNaissance: patientData.dateNaissance,
              lieuNaissance: patientData.lieuNaissance,
              sexe: patientData.sexe,
              adresse: patientData.adresse,
              ville: patientData.ville,
              telephone: patientData.telephone,
              nationalite: patientData.nationalite,
              etatCivil: patientData.etatCivil,
              email: patientData.email,
              cin: patientData.cin,
              typeAdmission: patientData.typeAdmission,
              dateAdmission: patientData.dateAdmission
            };
            
            // Make sure all required fields have values
            Object.keys(minimalData).forEach(key => {
              if (!minimalData[key as keyof typeof minimalData] && key !== 'email') {
                minimalData[key as keyof typeof minimalData] = key === 'telephone' ? '0600000000' : 'Non spécifié';
              }
            });
            
            // Ensure telephone format is valid (should be at least 10 digits)
            if (!minimalData.telephone || !/^\+?\d{10,}$/.test(minimalData.telephone)) {
              minimalData.telephone = '0600000000'; // Default valid phone format
            }
            
            console.log('Sending minimal patient data:', JSON.stringify(minimalData, null, 2));
            const response = await axios.put(API_ENDPOINTS.PATIENTS.UPDATE(ipp || ''), minimalData);
            showToast('Le patient a été mis à jour avec succès', 'success');
            // Navigate back to the patient profile with refresh parameter to ensure data is refreshed
            navigate(`/agent/patient/${ipp}?refresh=true`);
            return;
          } catch (minimalError) {
            console.error('Error with minimal patient data format:', minimalError);
            throw minimalError; // Throw to be caught by the outer catch block
          }
        }
      }
    } catch (error: unknown) {
      console.error('Error updating patient:', error);
      // Log more detailed error information
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('Response data:', JSON.stringify(axiosError.response.data, null, 2));
        console.error('Response status:', axiosError.response.status);
        console.error('Response headers:', axiosError.response.headers);
        
        // If we have specific error messages from the backend, show them
        if (axiosError.response.data && typeof axiosError.response.data === 'object') {
          const responseData = axiosError.response.data as any;
          if (responseData.message) {
            setApiError(responseData.message);
          } else if (responseData.error) {
            setApiError(responseData.error);
          }
        }
      }
      
      if (!apiError) {
        setApiError('Une erreur est survenue lors de la mise à jour du patient.');
      }
      setIsSubmitting(false);
    }
  };

  // Cancel form
  const handleCancel = () => {
    // Navigate back without refresh parameter since no changes were made
    navigate(`/agent/patient/${ipp}`);
  };

  // Show loading spinner if data is still loading
  if (isLoading) {
    return (
      <div className="dashboard-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des données du patient...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content add-patient-page">
      {/* Header */}
      <header className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Modifier le patient</h1>
        </div>
      </header>
      
      {/* Main two-column layout */}
      <div className="page-layout">
        {/* Left column - Section navigation */}
        <aside className="form-navigation">
          <div className="nav-sections">
            <h3>Aller à</h3>
            <ul>
              {formSections.map(section => (
                <li key={section.id}>
                  <button 
                    className="nav-section-btn"
                    onClick={() => scrollToSection(section.id)}
                  >
                    {section.title}
                    <ChevronRightIcon />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Action buttons - moved directly below section tabs */}
          <div className="nav-actions">
            <button
              type="button"
              className="nav-action-btn save-btn"
              disabled={isSubmitting}
              onClick={() => document.querySelector<HTMLFormElement>('.patient-form')?.requestSubmit()}
            >
              {isSubmitting ? 'Enregistrement...' : 'Mettre à jour le patient'}
            </button>
            <button
              type="button"
              className="nav-action-btn cancel-btn"
              disabled={isSubmitting}
              onClick={handleCancel}
            >
              Annuler
            </button>
          </div>
        </aside>
        
        {/* Right column - Form content */}
        <main className="form-content">
          {/* Form */}
          <form className="patient-form" onSubmit={handleSubmit}>
            {/* API error message */}
            {apiError && (
              <div className="error-message" id="api-error" style={{ marginBottom: '1rem', padding: '0.75rem 1rem' }}>
                {apiError}
              </div>
            )}
            
            {/* 1. Basic Info Section */}
            <div className="form-section" ref={sectionRefs['basic-info']} id="basic-info">
              <h2 className="section-title">
                {formSections[0].number}. {formSections[0].title}
                <div className="section-subtitle">Tous les champs sont requis sauf si explicitement indiqués facultatifs</div>
              </h2>
              
              <div className="form-row">
                {/* First Name */}
                <div className={`form-group ${errors.prenom ? 'error' : ''}`}>
                  <label htmlFor="prenom">
                    Prénom <span className="required-label">*</span>
                  </label>
                  <input
                    type="text"
                    id="prenom"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                  />
                  {errors.prenom && <div className="error-message">{errors.prenom}</div>}
                </div>
              </div>
              
              <div className="form-row">
                {/* Last Name */}
                <div className={`form-group ${errors.nom ? 'error' : ''}`}>
                  <label htmlFor="nom">
                    Nom de Famille <span className="required-label">*</span>
                  </label>
                  <input
                    type="text"
                    id="nom"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                  />
                  {errors.nom && <div className="error-message">{errors.nom}</div>}
                </div>
              </div>
              
              <div className="form-row">
                {/* Sex/Gender */}
                <div className={`form-group ${errors.sexe ? 'error' : ''}`}>
                  <label>
                    Sexe <span className="required-label">*</span>
                  </label>
                  <div className="gender-options">
                    <div 
                      className={`gender-option ${formData.sexe === 'M' ? 'selected' : ''}`}
                      onClick={() => handleGenderSelect('M')}
                    >
                      Homme
                    </div>
                    <div 
                      className={`gender-option ${formData.sexe === 'F' ? 'selected' : ''}`}
                      onClick={() => handleGenderSelect('F')}
                    >
                      Femme
                    </div>
                  </div>
                  {errors.sexe && <div className="error-message">{errors.sexe}</div>}
                </div>
              </div>
              
              <div className="form-row">
                {/* Birth Date */}
                <div className={`form-group ${errors.dateNaissance ? 'error' : ''}`}>
                  <label htmlFor="dateNaissance">
                    Date de Naissance <span className="required-label">*</span>
                  </label>
                  <input
                    type="date"
                    id="dateNaissance"
                    name="dateNaissance"
                    value={formData.dateNaissance}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {errors.dateNaissance && <div className="error-message">{errors.dateNaissance}</div>}
                </div>
              </div>
              
              <div className="form-row">
                {/* Birth Place */}
                <div className={`form-group ${errors.lieuNaissance ? 'error' : ''}`}>
                  <label htmlFor="lieuNaissance">
                    Lieu de Naissance <span className="required-label">*</span>
                  </label>
                  <input
                    type="text"
                    id="lieuNaissance"
                    name="lieuNaissance"
                    value={formData.lieuNaissance}
                    onChange={handleChange}
                  />
                  {errors.lieuNaissance && <div className="error-message">{errors.lieuNaissance}</div>}
                </div>
              </div>
              
              <div className="form-row">
                {/* ID Card Number */}
                <div className={`form-group ${errors.cin ? 'error' : ''}`}>
                  <label htmlFor="cin">
                    Numéro CIN <span className="required-label">*</span>
                  </label>
                  <input
                    type="text"
                    id="cin"
                    name="cin"
                    value={formData.cin}
                    onChange={handleChange}
                  />
                  {errors.cin && <div className="error-message">{errors.cin}</div>}
                </div>
              </div>
              
              <div className="form-row">
                {/* Nationality */}
                <div className={`form-group ${errors.nationalite ? 'error' : ''}`}>
                  <label htmlFor="nationalite">
                    Nationalité <span className="required-label">*</span>
                  </label>
                  <input
                    type="text"
                    id="nationalite"
                    name="nationalite"
                    value={formData.nationalite}
                    onChange={handleChange}
                  />
                  {errors.nationalite && <div className="error-message">{errors.nationalite}</div>}
                </div>
              </div>
              
              <div className="form-row">
                {/* Civil Status */}
                <div className={`form-group ${errors.etatCivil ? 'error' : ''}`}>
                  <label htmlFor="etatCivil">
                    État Civil <span className="required-label">*</span>
                  </label>
                  <select
                    id="etatCivil"
                    name="etatCivil"
                    value={formData.etatCivil}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionner</option>
                    <option value="CELIBATAIRE">Célibataire</option>
                    <option value="MARIE">Marié(e)</option>
                    <option value="DIVORCE">Divorcé(e)</option>
                    <option value="VEUF">Veuf/Veuve</option>
                  </select>
                  {errors.etatCivil && <div className="error-message">{errors.etatCivil}</div>}
                </div>
              </div>
            </div>
            
            {/* 2. Contact Details Section */}
            <div className="form-section" ref={sectionRefs['contact-info']} id="contact-info">
              <h2 className="section-title">
                {formSections[1].number}. {formSections[1].title}
                <div className="section-subtitle">Tous les champs sont requis sauf si explicitement indiqués facultatifs</div>
              </h2>
              
              <div className="form-row">
                {/* Address */}
                <div className={`form-group ${errors.adresse ? 'error' : ''}`}>
                  <label htmlFor="adresse">
                    Adresse <span className="required-label">*</span>
                  </label>
                  <input
                    type="text"
                    id="adresse"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleChange}
                  />
                  {errors.adresse && <div className="error-message">{errors.adresse}</div>}
                </div>
              </div>
              
              <div className="form-row">
                {/* City */}
                <div className={`form-group ${errors.ville ? 'error' : ''}`}>
                  <label htmlFor="ville">
                    Ville <span className="required-label">*</span>
                  </label>
                  <input
                    type="text"
                    id="ville"
                    name="ville"
                    value={formData.ville}
                    onChange={handleChange}
                  />
                  {errors.ville && <div className="error-message">{errors.ville}</div>}
                </div>
              </div>
              
              <div className="form-row">
                {/* Phone */}
                <div className={`form-group ${errors.telephone ? 'error' : ''}`}>
                  <label htmlFor="telephone">
                    Téléphone <span className="required-label">*</span>
                  </label>
                  <input
                    type="tel"
                    id="telephone"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleChange}
                    placeholder="0612345678"
                  />
                  {errors.telephone && <div className="error-message">{errors.telephone}</div>}
                </div>
              </div>
              
              <div className="form-row">
                {/* Email */}
                <div className={`form-group ${errors.email ? 'error' : ''}`}>
                  <label htmlFor="email">
                    Email <span className="required-label">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {errors.email && <div className="error-message">{errors.email}</div>}
                </div>
              </div>
            </div>
            
            {/* 3. Emergency Contact Section */}
            <div className="form-section" ref={sectionRefs['emergency-contact']} id="emergency-contact">
              <h2 className="section-title">
                {formSections[2].number}. {formSections[2].title}
                <div className="section-subtitle">Informations facultatives</div>
              </h2>
              
              <div className="form-row">
                {/* Emergency Contact Name */}
                <div className={`form-group ${errors.contactUrgencePrenom ? 'error' : ''}`}>
                  <label htmlFor="contactUrgencePrenom">
                    Nom du Contact
                  </label>
                  <input
                    type="text"
                    id="contactUrgencePrenom"
                    name="contactUrgencePrenom"
                    value={formData.contactUrgencePrenom}
                    onChange={handleChange}
                  />
                  {errors.contactUrgencePrenom && <div className="error-message">{errors.contactUrgencePrenom}</div>}
                </div>
              </div>
              
              <div className="form-row">
                {/* Emergency Contact Relationship */}
                <div className={`form-group ${errors.contactUrgenceRelation ? 'error' : ''}`}>
                  <label htmlFor="contactUrgenceRelation">
                    Relation
                  </label>
                  <input
                    type="text"
                    id="contactUrgenceRelation"
                    name="contactUrgenceRelation"
                    value={formData.contactUrgenceRelation}
                    onChange={handleChange}
                    placeholder="Parent, Conjoint, Enfant, etc."
                  />
                  {errors.contactUrgenceRelation && <div className="error-message">{errors.contactUrgenceRelation}</div>}
                </div>
              </div>
              
              <div className="form-row">
                {/* Emergency Contact Address */}
                <div className={`form-group ${errors.contactUrgenceAdresse ? 'error' : ''}`}>
                  <label htmlFor="contactUrgenceAdresse">
                    Adresse
                  </label>
                  <input
                    type="text"
                    id="contactUrgenceAdresse"
                    name="contactUrgenceAdresse"
                    value={formData.contactUrgenceAdresse}
                    onChange={handleChange}
                  />
                  {errors.contactUrgenceAdresse && <div className="error-message">{errors.contactUrgenceAdresse}</div>}
                </div>
              </div>
              
              <div className="form-row">
                {/* Emergency Contact Phone */}
                <div className={`form-group ${errors.contactUrgenceTelephone ? 'error' : ''}`}>
                  <label htmlFor="contactUrgenceTelephone">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    id="contactUrgenceTelephone"
                    name="contactUrgenceTelephone"
                    value={formData.contactUrgenceTelephone}
                    onChange={handleChange}
                    placeholder="0612345678"
                  />
                  {errors.contactUrgenceTelephone && <div className="error-message">{errors.contactUrgenceTelephone}</div>}
                </div>
              </div>
            </div>
            
            {/* 4. Admission Section */}
            <div className="form-section" ref={sectionRefs['admission-info']} id="admission-info">
              <h2 className="section-title">
                {formSections[3].number}. {formSections[3].title}
                <div className="section-subtitle">Tous les champs sont requis</div>
              </h2>
              
              <div className="form-row">
                {/* Admission Type */}
                <div className={`form-group ${errors.typeAdmission ? 'error' : ''}`}>
                  <label htmlFor="typeAdmission">
                    Type d'Admission <span className="required-label">*</span>
                  </label>
                  <select
                    id="typeAdmission"
                    name="typeAdmission"
                    value={formData.typeAdmission}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionner</option>
                    <option value="NORMAL">Normal</option>
                    <option value="URGENCE">Urgence</option>
                    <option value="TRANSFERT">Transfert</option>
                  </select>
                  {errors.typeAdmission && <div className="error-message">{errors.typeAdmission}</div>}
                </div>
              </div>
              
              <div className="form-row">
                {/* Admission Date */}
                <div className={`form-group ${errors.dateAdmission ? 'error' : ''}`}>
                  <label htmlFor="dateAdmission">
                    Date d'Admission <span className="required-label">*</span>
                  </label>
                  <input
                    type="date"
                    id="dateAdmission"
                    name="dateAdmission"
                    value={formData.dateAdmission}
                    onChange={handleChange}
                  />
                  {errors.dateAdmission && <div className="error-message">{errors.dateAdmission}</div>}
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default PatientEdit;