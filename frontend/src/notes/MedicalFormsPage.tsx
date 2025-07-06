import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MedicalFormsPage.css';
import { useToast } from '../shared/components/ToastContext';
import { getFormModelsBySpecialty, FormModel, deleteFormModel } from '../shared/api/formService';
import FormBuilder from './FormBuilder';
import { useAuth } from '../auth/AuthContext';

// Define Specialty interface
interface Specialty {
  id?: number;
  idSpecialite?: number;
  specialiteId?: number;
  nom: string;
  description: string;
  codeSpecialite?: string;
}

// Icons
const BackArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5"></path>
    <path d="M12 19l-7-7 7-7"></path>
  </svg>
);

const FormIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const AddFormIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="12" y1="18" x2="12" y2="12"></line>
    <line x1="9" y1="15" x2="15" y2="15"></line>
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const LoadingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotating-icon">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const MedicalFormsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Side panel state
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);
  const [forms, setForms] = useState<FormModel[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState<boolean>(false);
  const [isCreatingForm, setIsCreatingForm] = useState<boolean>(false);
  const [formToEdit, setFormToEdit] = useState<FormModel | null>(null);
  
  // Delete confirmation state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [formToDelete, setFormToDelete] = useState<FormModel | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchSpecialties = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/specialites');
      
      // Extract specialties from response
      let specialtiesData = Array.isArray(response.data) 
        ? response.data 
        : response.data.data || response.data.content || response.data.specialites || [];
        
      // Filter out the 'Générale' specialty
      specialtiesData = specialtiesData.filter((specialty: Specialty) => specialty.nom !== 'Générale');
      
      setSpecialties(specialtiesData);
      setError(null);
    } catch (err) {
      console.error('Error fetching specialties:', err);
      setError('Erreur lors du chargement des spécialités. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch forms by specialty ID using our new service
  const fetchFormsBySpecialtyId = async (specialtyId: number) => {
    setIsLoadingForms(true);
    
    try {
      // Use the real API service to get forms for this specialty
      const formsData = await getFormModelsBySpecialty(specialtyId);
      console.log('Forms data received:', formsData); // Debug log to see form structure
      setForms(formsData);
    } catch (err) {
      console.error('Error fetching forms:', err);
      showToast('Erreur lors du chargement des formulaires', 'error');
      setForms([]);
    } finally {
      setIsLoadingForms(false);
    }
  };

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const handleBack = () => {
    navigate('/notes'); // Navigate back to the NotesPage
  };
  
  const handleSpecialtyClick = (specialty: Specialty) => {
    // Find the ID regardless of what property name is used
    const specialtyId = specialty.id || specialty.idSpecialite || specialty.specialiteId;
    
    if (!specialtyId) {
      console.error('Could not find ID for specialty:', specialty);
      showToast('Erreur: Impossible de charger les formulaires pour cette spécialité (ID manquant)', 'error');
      return;
    }
    
    setSelectedSpecialty(specialty);
    setIsPanelOpen(true);
    setIsCreatingForm(false);
    setFormToEdit(null);
    fetchFormsBySpecialtyId(specialtyId);
  };
  
  const closePanel = () => {
    setIsPanelOpen(false);
    setSelectedSpecialty(null);
    setForms([]);
    setIsCreatingForm(false);
    setFormToEdit(null);
  };
  
  const handleAddFormClick = () => {
    setIsCreatingForm(true);
    setFormToEdit(null);
  };
  
  const handleCancelFormCreation = () => {
    setIsCreatingForm(false);
    setFormToEdit(null);
  };
  
  const handleFormCreationSuccess = () => {
    setIsCreatingForm(false);
    setFormToEdit(null);
    
    // Refresh the forms list
    if (selectedSpecialty) {
      const specialtyId = selectedSpecialty.id || selectedSpecialty.idSpecialite || selectedSpecialty.specialiteId;
      if (specialtyId) {
        fetchFormsBySpecialtyId(specialtyId);
      }
    }
  };

  const handleFormClick = (form: FormModel) => {
    console.log('Form clicked for editing:', form);
    setFormToEdit(form);
    setIsCreatingForm(true);
  };
  
  const openDeleteConfirmation = (form: FormModel, event: React.MouseEvent) => {
    // Prevent the click from bubbling up to the form item
    event.stopPropagation();
    
    console.log('Form to delete:', form); // Debug log to see form structure
    setFormToDelete(form);
    setShowDeleteConfirmation(true);
  };
  
  const closeDeleteConfirmation = () => {
    setShowDeleteConfirmation(false);
    setFormToDelete(null);
  };
  
  const handleDeleteForm = async () => {
    if (!formToDelete) return;
    
    // Ensure we have a valid form ID - check both possible ID properties
    // API data structure uses 'idModele' but our interface uses 'id'
    const formId = formToDelete.id || (formToDelete as any).idModele;
    if (!formId) {
      console.error('Form ID is missing or invalid:', formToDelete);
      showToast('Erreur: ID du formulaire invalide', 'error');
      closeDeleteConfirmation();
      return;
    }
    
    console.log('Attempting to delete form with ID:', formId); // Debug log
    setIsDeleting(true);
    
    try {
      // Use the formService function to delete the form
      await deleteFormModel(formId);
      
      // Close the confirmation dialog
      closeDeleteConfirmation();
      
      // Show success message
      showToast('Le formulaire a été supprimé avec succès', 'success');
      
      // Refresh the forms list
      if (selectedSpecialty) {
        const specialtyId = selectedSpecialty.id || selectedSpecialty.idSpecialite || selectedSpecialty.specialiteId;
        if (specialtyId) {
          fetchFormsBySpecialtyId(specialtyId);
        }
      }
    } catch (err) {
      console.error('Error deleting form:', err);
      showToast('Erreur lors de la suppression du formulaire', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="medical-forms-page">
      {/* Content overlay when side panel is open */}
      <div 
        className={`content-overlay ${isPanelOpen ? 'visible' : ''}`}
        onClick={closePanel}
      />

      <div className="medical-forms-header">
        <button className="back-button" onClick={handleBack} aria-label="Retour">
          <BackArrowIcon />
          <span>Retour</span>
        </button>
      </div>
      <div className="medical-forms-content">
        <div className="medical-forms-container">
          <div className="medical-forms-title-section">
            <h1 className="medical-forms-title">Gestion des formulaires médicaux</h1>
          </div>
          
          {isLoading ? (
            <div className="loading-container">
              <LoadingIcon />
              <span>Chargement des spécialités...</span>
            </div>
          ) : error ? (
            <div className="error-container">
              <div className="error-message">{error}</div>
              <button className="retry-button" onClick={fetchSpecialties}>
                Réessayer
              </button>
            </div>
          ) : specialties.length === 0 ? (
            <div className="no-data-message">
              Aucune spécialité trouvée. Veuillez en ajouter dans la section de gestion des spécialités.
            </div>
          ) : (
            <div className="specialties-grid">
              {specialties.map(specialty => {
                // Find the ID regardless of what property name is used
                const specialtyId = specialty.id || specialty.idSpecialite || specialty.specialiteId;
                
                return (
                  <div 
                    key={specialtyId} 
                    className="specialty-card" 
                    onClick={() => handleSpecialtyClick(specialty)}
                  >
                    <div className="specialty-icon">
                      <FormIcon />
                    </div>
                    <h3 className="specialty-name">{specialty.nom}</h3>
                    <p className="specialty-description">{specialty.description}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Side Panel for Forms */}
      <div className={`side-panel ${isPanelOpen ? 'open' : ''}`}>
        <div className="side-panel-header">
          <h2>{selectedSpecialty?.nom || 'Formulaires'}</h2>
          <div className="side-panel-actions">
            {!isCreatingForm && (
              <button className="add-form-button" onClick={handleAddFormClick}>
                <AddFormIcon />
                <span>Ajouter un formulaire</span>
              </button>
            )}
            <button className="close-panel-button" onClick={closePanel} aria-label="Fermer">
              <CloseIcon />
            </button>
          </div>
        </div>
        <div className="side-panel-content">
          {isCreatingForm && selectedSpecialty ? (
            <FormBuilder
              specialtyId={selectedSpecialty.id || selectedSpecialty.idSpecialite || selectedSpecialty.specialiteId || 0}
              onCancel={handleCancelFormCreation}
              onSuccess={handleFormCreationSuccess}
              formToEdit={formToEdit || undefined}
            />
          ) : isLoadingForms ? (
            <div className="loading-container">
              <LoadingIcon />
              <span>Chargement des formulaires...</span>
            </div>
          ) : forms.length === 0 ? (
            <div className="no-data-message">
              Aucun formulaire trouvé pour cette spécialité.
            </div>
          ) : (
            <div className="forms-list admin-forms-list">
              {forms.map(form => (
                <div 
                  key={form.id} 
                  className="form-item clickable" 
                  onClick={() => handleFormClick(form)}
                >
                  <div className="form-item-icon">
                    <FormIcon />
                  </div>
                  <div className="form-item-details">
                    <h3 className="form-item-name">{form.nom}</h3>
                    <p className="form-item-description">{form.description || 'Aucune description disponible'}</p>
                  </div>
                  {user?.role === 'ADMIN' && (
                    <button 
                      className="form-delete-button" 
                      onClick={(e) => openDeleteConfirmation(form, e)}
                      aria-label="Supprimer le formulaire"
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal - rendered at the document body level with highest z-index */}
      {showDeleteConfirmation && formToDelete && (
        ReactDOM.createPortal(
          <div className="delete-confirmation-overlay">
            <div className="modal-content confirmation-dialog">
              <div className="modal-header">
                <h2>Confirmation de suppression</h2>
                <button className="close-button" onClick={closeDeleteConfirmation}>
                  <CloseIcon />
                </button>
              </div>
              
              <div className="confirmation-body">
                <p>Êtes-vous sûr de vouloir supprimer le formulaire <strong>{formToDelete.nom}</strong> ?</p>
                <p className="warning-text">Cette action est irréversible.</p>
              </div>
              
              <div className="confirmation-actions">
                <button 
                  className="cancel-button" 
                  onClick={closeDeleteConfirmation}
                >
                  Annuler
                </button>
                <button 
                  className="delete-button"
                  onClick={handleDeleteForm}
                  disabled={isDeleting}
                >
                  {isDeleting ? <LoadingIcon /> : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      )}
    </div>
  );
};

export default MedicalFormsPage; 