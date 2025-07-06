import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateUserPage.css';
import { useToast } from '../shared/components/ToastContext';

// Define UserIcon component
const UserPlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="8.5" cy="7" r="4"></circle>
    <line x1="20" y1="8" x2="20" y2="14"></line>
    <line x1="23" y1="11" x2="17" y2="11"></line>
  </svg>
);

// Define form sections for the navigation
interface FormSection {
  id: string;
  title: string;
  number: number;
}

// Define validation errors interface
interface ValidationErrors {
  nom?: string;
  prenom?: string;
  identifiant?: string;
  motDePasse?: string;
  confirmerMotDePasse?: string;
  role?: string;
  email?: string;
  sexe?: string;
  dateNaissance?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  general?: string;
}

const CreateUserPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  
  // Section definitions
  const formSections: FormSection[] = [
    { id: 'personal-info', title: 'Informations Personnelles', number: 1 },
    { id: 'account-info', title: 'Informations du Compte', number: 2 },
    { id: 'contact-info', title: 'Coordonnées', number: 3 }
  ];
  
  // Form data state
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    identifiant: '',
    motDePasse: '',
    confirmerMotDePasse: '',
    role: '',
    email: '',
    sexe: '',
    dateNaissance: '',
    telephone: '',
    adresse: '',
    ville: '',
    pays: ''
  });
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: undefined
      }));
    }
  };
  
  // Handle radio button changes for sex
  const handleSexeChange = (value: string) => {
    setFormData(prevData => ({
      ...prevData,
      sexe: value
    }));
    
    // Clear error for this field
    if (errors.sexe) {
      setErrors(prevErrors => ({
        ...prevErrors,
        sexe: undefined
      }));
    }
  };
  
  // Handle role button changes
  const handleRoleChange = (value: string) => {
    setFormData(prevData => ({
      ...prevData,
      role: value
    }));
    
    // Clear error for this field
    if (errors.role) {
      setErrors(prevErrors => ({
        ...prevErrors,
        role: undefined
      }));
    }
  };
  
  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;
    
    // Check required fields
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
      isValid = false;
    }
    
    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
      isValid = false;
    }
    
    if (!formData.identifiant.trim()) {
      newErrors.identifiant = 'L\'identifiant est requis';
      isValid = false;
    }
    
    if (!formData.motDePasse.trim()) {
      newErrors.motDePasse = 'Le mot de passe est requis';
      isValid = false;
    }
    
    if (!formData.confirmerMotDePasse.trim()) {
      newErrors.confirmerMotDePasse = 'La confirmation du mot de passe est requise';
      isValid = false;
    } else if (formData.motDePasse !== formData.confirmerMotDePasse) {
      newErrors.confirmerMotDePasse = 'Les mots de passe ne correspondent pas';
      isValid = false;
    }
    
    if (!formData.role) {
      newErrors.role = 'Le rôle est requis';
      isValid = false;
    }
    
    // Enhanced email validation
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
      isValid = false;
    } else {
      // More comprehensive email validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Format d\'email invalide (exemple: nom@domaine.com)';
        isValid = false;
      }
    }
    
    if (!formData.sexe) {
      newErrors.sexe = 'Le sexe est requis';
      isValid = false;
    }
    
    if (!formData.dateNaissance) {
      newErrors.dateNaissance = 'La date de naissance est requise';
      isValid = false;
    }
    
    // Enhanced phone validation
    if (!formData.telephone.trim()) {
      newErrors.telephone = 'Le téléphone est requis';
      isValid = false;
    } else {
      // French phone number format validation
      // Accepts formats like: 0612345678, 06 12 34 56 78, +33612345678, +33 6 12 34 56 78
      const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
      if (!phoneRegex.test(formData.telephone)) {
        newErrors.telephone = 'Format de téléphone invalide (exemple: 0612345678 ou +33612345678)';
        isValid = false;
      }
    }
    
    if (!formData.adresse.trim()) {
      newErrors.adresse = 'L\'adresse est requise';
      isValid = false;
    }
    
    if (!formData.ville.trim()) {
      newErrors.ville = 'La ville est requise';
      isValid = false;
    }
    
    if (!formData.pays.trim()) {
      newErrors.pays = 'Le pays est requis';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare payload (omit confirmerMotDePasse)
      const payload = {
        nom: formData.nom,
        prenom: formData.prenom,
        identifiant: formData.identifiant,
        motDePasse: formData.motDePasse,
        role: formData.role,
        email: formData.email,
        sexe: formData.sexe,
        dateNaissance: formData.dateNaissance,
        telephone: formData.telephone,
        adresse: formData.adresse,
        ville: formData.ville,
        pays: formData.pays
      };
      
      // Send POST request
      const response = await fetch('/api/utilisateurs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création de l\'utilisateur');
      }
      
      // Show success message
      showToast('Utilisateur créé avec succès', 'success');
      
      // Navigate back to users page
      navigate('/admin/users');
      
    } catch (error) {
      console.error('Error creating user:', error);
      
      // Show error message
      let errorMessage = 'Une erreur est survenue lors de la création de l\'utilisateur';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setErrors(prevErrors => ({
        ...prevErrors,
        general: errorMessage
      }));
      
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle cancel button click
  const handleCancel = () => {
    navigate('/admin/users');
  };
  
  return (
    <div className="create-user-page">
      <div className="edit-user-header">
        <button className="back-button" onClick={handleCancel}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Retour
        </button>
      </div>
      
      <div className="edit-user-content">
        <h1 className="page-title">Créer un utilisateur</h1>
        
        {errors.general && (
          <div className="error-message general-error">
            {errors.general}
          </div>
        )}
        
        <form className="edit-user-form" onSubmit={handleSubmit}>
          <div className="two-column-grid">
            {/* Personal Information Section */}
            <div className="form-section">
              <h3 className="section-title">Informations Personnelles</h3>
              <div className="section-content">
                <div className="form-group">
                  <label>Nom <span className="required">*</span></label>
                  <input
                    type="text"
                    name="nom"
                    className={`form-control ${errors.nom ? 'error-input' : ''}`}
                    value={formData.nom}
                    onChange={handleChange}
                    placeholder="Nom de famille"
                  />
                  {errors.nom && <div className="error-text">{errors.nom}</div>}
                </div>
                
                <div className="form-group">
                  <label>Prénom <span className="required">*</span></label>
                  <input
                    type="text"
                    name="prenom"
                    className={`form-control ${errors.prenom ? 'error-input' : ''}`}
                    value={formData.prenom}
                    onChange={handleChange}
                    placeholder="Prénom"
                  />
                  {errors.prenom && <div className="error-text">{errors.prenom}</div>}
                </div>
                
                <div className="form-group">
                  <label>Sexe <span className="required">*</span></label>
                  <div className="sexe-buttons">
                    <button
                      type="button"
                      className={`sexe-button ${formData.sexe === 'M' ? 'active' : ''}`}
                      onClick={() => handleSexeChange('M')}
                    >
                      Homme
                    </button>
                    <button
                      type="button"
                      className={`sexe-button ${formData.sexe === 'F' ? 'active' : ''}`}
                      onClick={() => handleSexeChange('F')}
                    >
                      Femme
                    </button>
                  </div>
                  {errors.sexe && <div className="error-text">{errors.sexe}</div>}
                </div>
                
                <div className="form-group">
                  <label>Date de naissance <span className="required">*</span></label>
                  <input
                    type="date"
                    name="dateNaissance"
                    className={`form-control ${errors.dateNaissance ? 'error-input' : ''}`}
                    value={formData.dateNaissance}
                    onChange={handleChange}
                  />
                  {errors.dateNaissance && <div className="error-text">{errors.dateNaissance}</div>}
                </div>
              </div>
            </div>
            
            {/* Account Information Section */}
            <div className="form-section">
              <h3 className="section-title">Informations du Compte</h3>
              <div className="section-content">
                <div className="form-group">
                  <label>Identifiant <span className="required">*</span></label>
                  <input
                    type="text"
                    name="identifiant"
                    className={`form-control ${errors.identifiant ? 'error-input' : ''}`}
                    value={formData.identifiant}
                    onChange={handleChange}
                    placeholder="Nom d'utilisateur"
                  />
                  {errors.identifiant && <div className="error-text">{errors.identifiant}</div>}
                </div>
                
                <div className="form-group">
                  <label>Mot de passe <span className="required">*</span></label>
                  <input
                    type="password"
                    name="motDePasse"
                    className={`form-control ${errors.motDePasse ? 'error-input' : ''}`}
                    value={formData.motDePasse}
                    onChange={handleChange}
                    placeholder="Mot de passe"
                  />
                  {errors.motDePasse && <div className="error-text">{errors.motDePasse}</div>}
                </div>
                
                <div className="form-group">
                  <label>Confirmer <span className="required">*</span></label>
                  <input
                    type="password"
                    name="confirmerMotDePasse"
                    className={`form-control ${errors.confirmerMotDePasse ? 'error-input' : ''}`}
                    value={formData.confirmerMotDePasse}
                    onChange={handleChange}
                    placeholder="Confirmer le mot de passe"
                  />
                  {errors.confirmerMotDePasse && <div className="error-text">{errors.confirmerMotDePasse}</div>}
                </div>
                
                <div className="form-group">
                  <label>Rôle <span className="required">*</span></label>
                  <div className="role-buttons">
                    <button
                      type="button"
                      className={`role-button ${formData.role === 'MEDECIN' ? 'active' : ''}`}
                      onClick={() => handleRoleChange('MEDECIN')}
                    >
                      Médecin
                    </button>
                    <button
                      type="button"
                      className={`role-button ${formData.role === 'AGENT' ? 'active' : ''}`}
                      onClick={() => handleRoleChange('AGENT')}
                    >
                      Agent
                    </button>
                    <button
                      type="button"
                      className={`role-button ${formData.role === 'ADMIN' ? 'active' : ''}`}
                      onClick={() => handleRoleChange('ADMIN')}
                    >
                      Admin
                    </button>
                  </div>
                  {errors.role && <div className="error-text">{errors.role}</div>}
                </div>
              </div>
            </div>
            
            {/* Contact Information Section */}
            <div className="form-section contact-info-section">
              <h3 className="section-title">Coordonnées</h3>
              <div className="section-content">
                <div className="form-group">
                  <label>Email <span className="required">*</span></label>
                  <input
                    type="email"
                    name="email"
                    className={`form-control ${errors.email ? 'error-input' : ''}`}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="exemple@email.com"
                  />
                  {errors.email && <div className="error-text">{errors.email}</div>}
                </div>
                
                <div className="form-group">
                  <label>Téléphone <span className="required">*</span></label>
                  <input
                    type="tel"
                    name="telephone"
                    className={`form-control ${errors.telephone ? 'error-input' : ''}`}
                    value={formData.telephone}
                    onChange={handleChange}
                    placeholder="Numéro de téléphone"
                  />
                  {errors.telephone && <div className="error-text">{errors.telephone}</div>}
                </div>
                
                <div className="form-group">
                  <label>Adresse <span className="required">*</span></label>
                  <input
                    type="text"
                    name="adresse"
                    className={`form-control ${errors.adresse ? 'error-input' : ''}`}
                    value={formData.adresse}
                    onChange={handleChange}
                    placeholder="Adresse"
                  />
                  {errors.adresse && <div className="error-text">{errors.adresse}</div>}
                </div>
                
                <div className="form-group">
                  <label>Ville <span className="required">*</span></label>
                  <input
                    type="text"
                    name="ville"
                    className={`form-control ${errors.ville ? 'error-input' : ''}`}
                    value={formData.ville}
                    onChange={handleChange}
                    placeholder="Ville"
                  />
                  {errors.ville && <div className="error-text">{errors.ville}</div>}
                </div>
                
                <div className="form-group">
                  <label>Pays <span className="required">*</span></label>
                  <input
                    type="text"
                    name="pays"
                    className={`form-control ${errors.pays ? 'error-input' : ''}`}
                    value={formData.pays}
                    onChange={handleChange}
                    placeholder="Pays"
                  />
                  {errors.pays && <div className="error-text">{errors.pays}</div>}
                </div>
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserPage; 