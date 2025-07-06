import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './EditUserPage.css';
import axios from '../shared/api/axios';
import { useToast } from '../shared/components/ToastContext';

// Add API_ENDPOINTS for users
const API_ENDPOINTS = {
  UTILISATEURS: {
    UPDATE: (id: string) => `/api/utilisateurs/${id}`,
    GET_BY_ID: (id: string) => `/api/utilisateurs/${id}`,
    DEACTIVATE: (id: string) => `/api/utilisateurs/${id}/deactivate`,
    ACTIVATE: (id: string) => `/api/utilisateurs/${id}/activate`,
  }
};

// Icons
const BackArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5"></path>
    <path d="M12 19l-7-7 7-7"></path>
  </svg>
);

// User interface from UsersManagementPage, extended with additional fields
interface User {
  idUtilisateur?: string;
  id?: number;
  utilisateurId?: number;
  identifiant?: string;
  username?: string;
  email?: string;
  role?: string;
  nom?: string;
  prenom?: string;
  dateCreation?: string;
  dateModification?: string;
  actif?: boolean;
  estDesactive?: boolean;
  telephone?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  sexe?: string;
  raisonDesactivation?: string;
}

// Mock data for a user (to prefill the form)
const mockUserData: User = {
  idUtilisateur: "U12345",
  id: 42,
  identifiant: "jdupont",
  username: "jdupont",
  email: "jean.dupont@example.com",
  role: "MEDECIN",
  nom: "Dupont",
  prenom: "Jean",
  dateCreation: "15/06/2022",
  dateModification: "03/04/2023",
  actif: true,
  estDesactive: false,
  telephone: "01 23 45 67 89",
  adresse: "123 Rue de Paris",
  ville: "Lyon",
  pays: "France",
  sexe: "H"
};

const EditUserPage: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { showToast } = useToast();
  
  // State for form data
  const [formData, setFormData] = React.useState<Partial<User>>({});
  
  // State for password fields
  const [password, setPassword] = React.useState('••••••••');
  const [confirmPassword, setConfirmPassword] = React.useState('••••••••');
  const [isPasswordModified, setIsPasswordModified] = React.useState(false);
  
  // State for deactivation reason
  const [deactivationReason, setDeactivationReason] = React.useState('');
  
  // State for loading and error
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);
  
  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (!userId) {
          console.error("No user ID provided");
          return;
        }
        
        // Fetch user data from the API
        const response = await axios.get(API_ENDPOINTS.UTILISATEURS.GET_BY_ID(userId));
        
        // Check if we have valid data
        if (response.data && (response.data.utilisateur || response.data)) {
          // Extract user data from the response
          const userData = response.data.utilisateur || response.data;
          
          console.log('Raw user data from API:', userData);
          
          // Map API response fields to our state
          // API might use different field names than our front-end
          const formattedUserData = {
            ...userData,
            // If estDesactive is explicitly defined in the API response, use that value
            // Otherwise, consider the user active (not deactivated)
            estDesactive: userData.estDesactive === true ? true : false
          };
          
          console.log('Formatted user data (estDesactive):', formattedUserData.estDesactive);
          
          setFormData(formattedUserData);
          
          // If user is deactivated and has a reason, populate it
          if (formattedUserData.estDesactive && (formattedUserData.raisonDesactivation || userData.raisonDesactivation)) {
            // Use either the formatted or original data's reason, whichever exists
            const reason = formattedUserData.raisonDesactivation || userData.raisonDesactivation;
            console.log('Setting deactivation reason:', reason);
            setDeactivationReason(reason);
          }
        } else {
          // Fallback to mock data for development
          console.warn("Using mock data as API response format was unexpected");
          setFormData(mockUserData);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        // Fallback to mock data for development
        setFormData(mockUserData);
      }
    };
    
    loadUserData();
  }, [userId]);
  
  // Handle input change for form data
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle password field focus
  const handlePasswordFocus = () => {
    if (!isPasswordModified) {
      setPassword('');
      setIsPasswordModified(true);
    }
  };
  
  // Handle confirm password field focus
  const handleConfirmPasswordFocus = () => {
    if (!isPasswordModified) {
      setConfirmPassword('');
      setIsPasswordModified(true);
    }
  };
  
  // Handle sexe selection
  const handleSexeChange = (value: string) => {
    setFormData(prev => ({ ...prev, sexe: value }));
  };
  
  // Handle back button
  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      setApiError("ID utilisateur manquant");
      return;
    }
    
    setIsSubmitting(true);
    setApiError(null);
    
    try {
      // Prepare the payload with all editable fields
      const payload: Record<string, any> = {
        nom: formData.nom,
        prenom: formData.prenom,
        sexe: formData.sexe,
        email: formData.email,
        telephone: formData.telephone,
        adresse: formData.adresse,
        ville: formData.ville,
        pays: formData.pays,
        identifiant: formData.identifiant
      };
      
      // Add password if it was modified
      if (isPasswordModified) {
        // Check if passwords match
        if (password !== confirmPassword) {
          setApiError('Les mots de passe ne correspondent pas');
          setIsSubmitting(false);
          return;
        }
        
        // Add password to payload
        payload.motDePasse = password;
      }
      
      // Send PUT request to update the user
      await axios.put(API_ENDPOINTS.UTILISATEURS.UPDATE(userId), payload);
      
      // Show success message
      showToast('Utilisateur mis à jour avec succès', 'success');
      
      // Navigate back to the users management page
      navigate('/admin/users');
    } catch (error) {
      console.error('Error updating user:', error);
      setApiError('Une erreur est survenue lors de la mise à jour de l\'utilisateur.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle user deactivation
  const handleDeactivate = async (e?: React.MouseEvent) => {
    // Prevent any default browser behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!userId) {
      setApiError("ID utilisateur manquant");
      return;
    }
    
    // Validate deactivation reason
    if (!deactivationReason.trim()) {
      setApiError("Veuillez fournir une raison de désactivation");
      return;
    }
    
    setIsSubmitting(true);
    setApiError(null);
    
    try {
      // Send PUT request to deactivate the user
      await axios.put(API_ENDPOINTS.UTILISATEURS.DEACTIVATE(userId), {
        raisonDesactivation: deactivationReason
      }, {
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        }
      });
      
      // Update local state
      setFormData(prev => ({ ...prev, estDesactive: true }));
      
      // Show success message
      showToast('Utilisateur désactivé avec succès', 'success');
    } catch (error) {
      console.error('Error deactivating user:', error);
      setApiError('Une erreur est survenue lors de la désactivation de l\'utilisateur.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle user activation
  const handleActivate = async (e?: React.MouseEvent) => {
    // Prevent any default browser behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!userId) {
      setApiError("ID utilisateur manquant");
      return;
    }
    
    setIsSubmitting(true);
    setApiError(null);
    
    try {
      // Send PUT request to activate the user
      await axios.put(API_ENDPOINTS.UTILISATEURS.ACTIVATE(userId), {}, {
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        }
      });
      
      // Update local state
      setFormData(prev => ({ ...prev, estDesactive: false }));
      
      // Reset deactivation reason
      setDeactivationReason('');
      
      // Show success message
      showToast('Utilisateur activé avec succès', 'success');
    } catch (error) {
      console.error('Error activating user:', error);
      setApiError('Une erreur est survenue lors de l\'activation de l\'utilisateur.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="edit-user-page">
      <div className="edit-user-header">
        <button className="back-button" onClick={handleBack} aria-label="Retour">
          <BackArrowIcon />
          <span>Retour</span>
        </button>
      </div>
      
      <div className="edit-user-content">
        <h1 className="page-title">Modifier l'utilisateur</h1>
        <form className="edit-user-form" onSubmit={handleSubmit} autoComplete="off" noValidate>
          {/* API error message */}
          {apiError && (
            <div className="error-message" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '0.25rem', border: '1px solid #f5c6cb' }}>
              {apiError}
            </div>
          )}
          
          <div className="two-column-grid">
            {/* Column 1: Informations démographiques */}
            <section className="form-section column-section">
              <h2 className="section-title">Informations démographiques</h2>
              <div className="section-content">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="nom">Nom</label>
                    <input
                      type="text"
                      id="nom"
                      name="nom"
                      value={formData.nom || ''}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Nom"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="prenom">Prénom</label>
                    <input
                      type="text"
                      id="prenom"
                      name="prenom"
                      value={formData.prenom || ''}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Prénom"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Sexe</label>
                  <div className="sexe-buttons">
                    <button
                      type="button"
                      className={`sexe-button ${formData.sexe === 'H' ? 'active' : ''}`}
                      onClick={() => handleSexeChange('H')}
                      disabled={isSubmitting}
                    >
                      Homme
                    </button>
                    <button
                      type="button"
                      className={`sexe-button ${formData.sexe === 'F' ? 'active' : ''}`}
                      onClick={() => handleSexeChange('F')}
                      disabled={isSubmitting}
                    >
                      Femme
                    </button>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Email"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="telephone">Téléphone</label>
                    <input
                      type="tel"
                      id="telephone"
                      name="telephone"
                      value={formData.telephone || ''}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Téléphone"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="adresse">Adresse</label>
                  <input
                    type="text"
                    id="adresse"
                    name="adresse"
                    value={formData.adresse || ''}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Adresse"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="ville">Ville</label>
                    <input
                      type="text"
                      id="ville"
                      name="ville"
                      value={formData.ville || ''}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Ville"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="pays">Pays</label>
                    <input
                      type="text"
                      id="pays"
                      name="pays"
                      value={formData.pays || ''}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Pays"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Column 2: Other sections */}
            <div className="column-stack">
              {/* Informations de connexion */}
              <section className="form-section">
                <h2 className="section-title">Informations de connexion</h2>
                <div className="section-content">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="identifiant">Identifiant</label>
                      <input
                        type="text"
                        id="identifiant"
                        name="identifiant"
                        value={formData.identifiant || ''}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="Identifiant"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="password">Mot de passe</label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={handlePasswordFocus}
                        className="form-control"
                        placeholder="Mot de passe"
                        disabled={isSubmitting}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirmer</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={handleConfirmPasswordFocus}
                        className="form-control"
                        placeholder="Confirmer"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              </section>
              
              {/* Désactivation du compte */}
              <section className="form-section danger-section">
                <h2 className="section-title danger-title">
                  {formData.estDesactive ? "Activation du compte" : "Désactivation du compte"}
                </h2>
                <div className="section-content">
                  {/* Debug information with no margin */}
                  <div style={{ fontSize: '12px', color: '#666', margin: 0, padding: 0 }}>
                    État du compte: {formData.estDesactive ? 'Désactivé' : 'Actif'}
                  </div>
                  
                  {formData.estDesactive === true ? (
                    <>
                      {/* Display reason for deactivation */}
                      <div className="form-group deactivation-inline">
                        <span className="deactivation-label">Raison de désactivation:</span>
                        <span className="deactivation-reason-display">
                          {deactivationReason || formData.raisonDesactivation || "Aucune raison fournie"}
                        </span>
                      </div>
                      
                      <div className="deactivate-btn-container">
                        <button 
                          type="button" 
                          className="btn btn-primary deactivate-btn"
                          onClick={handleActivate}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Activation...' : 'Activer'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="vertical-deactivation-container">
                        <label htmlFor="deactivationReason" className="deactivation-label-vertical">Raison de désactivation</label>
                        <textarea
                          id="deactivationReason"
                          name="deactivationReason"
                          value={deactivationReason}
                          onChange={(e) => setDeactivationReason(e.target.value)}
                          className="form-control deactivation-textarea"
                          placeholder="Veuillez saisir la raison de désactivation..."
                          rows={2}
                          disabled={isSubmitting}
                          autoComplete="off"
                          data-form-type="other"
                          autoCapitalize="off"
                          autoCorrect="off"
                          spellCheck="false"
                        />
                      </div>
                      
                      <div className="deactivate-btn-container">
                        <button 
                          type="button" 
                          className="btn btn-danger deactivate-btn"
                          onClick={handleDeactivate}
                          disabled={isSubmitting || !deactivationReason.trim()}
                        >
                          Désactiver
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </section>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary cancel-btn" 
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button 
              type="submit" 
              className="btn btn-primary save-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserPage; 