import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../shared/api/axios';
import { API_ENDPOINTS } from '../shared/api/api.config';
import './PatientCreation.css';
import { useToast } from '../shared/components/ToastContext';

// SVG Icons
const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const UserPlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="8.5" cy="7" r="4"></circle>
    <line x1="20" y1="8" x2="20" y2="14"></line>
    <line x1="23" y1="11" x2="17" y2="11"></line>
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

const PatientCreation: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    dateAdmission: new Date().toISOString().split('T')[0], // Default to today
    contactUrgencePrenom: '',
    contactUrgenceRelation: '',
    contactUrgenceAdresse: '',
    contactUrgenceTelephone: ''
  });
  
  const [errors, setErrors] = useState<ValidationErrors>({});

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
      if (!formData[field].trim()) {
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
    const birthDate = new Date(formData.dateNaissance);
    const today = new Date();
    if (birthDate > today) {
      newErrors.dateNaissance = 'La date de naissance doit être dans le passé';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset messages
    setApiError(null);
    
    // Validate form
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.post(API_ENDPOINTS.PATIENTS.CREATE, formData);
      
      // Show success toast instead of inline message
      showToast('Patient créé avec succès!', 'success');
      
      // Navigate to the patient profile page after a delay
      if (response.data.ipp) {
        setTimeout(() => {
          navigate(`/agent/patient/${response.data.ipp}`);
        }, 1500);
      } else {
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error: unknown) {
      console.error('Error creating patient:', error);
      
      const err = error as { response?: { data?: { message?: string } } };
      
      if (err.response?.data?.message) {
        setApiError(err.response.data.message);
        showToast(err.response.data.message, 'error');
      } else {
        const errorMsg = 'Une erreur est survenue lors de la création du patient. Veuillez réessayer.';
        setApiError(errorMsg);
        showToast(errorMsg, 'error');
      }
      
      // Scroll to error message
      const errorElement = document.getElementById('api-error');
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel button click
  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="dashboard-content add-patient-page">
      {/* Header */}
      <header className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Admission d'un nouveau patient</h1>
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
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer le patient'}
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
                <div className="section-subtitle">Tous les champs sont requis sauf si explicitement indiqués facultatifs</div>
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

export default PatientCreation;