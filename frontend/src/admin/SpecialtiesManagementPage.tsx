import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SpecialtiesManagementPage.css';
import { useToast } from '../shared/components/ToastContext';

// Define Specialty interface
interface Specialty {
  id?: number;
  idSpecialite?: number;
  specialiteId?: number;
  nom: string;
  description: string;
  codeSpecialite?: string;
}

// Define NewSpecialty interface for form submission
interface NewSpecialty {
  codeSpecialite: string;
  nom: string;
  description: string;
}

// Back Arrow Icon
const BackArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5"></path>
    <path d="M12 19l-7-7 7-7"></path>
  </svg>
);

// Edit Icon
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

// Delete Icon
const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

// Add Specialty Icon
const AddIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

// Close Icon
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// Loading Icon
const LoadingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotating-icon">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
  </svg>
);

const SpecialtiesManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingSpecialtyId, setEditingSpecialtyId] = useState<number | null>(null);
  
  // Confirmation dialog state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [specialtyToDelete, setSpecialtyToDelete] = useState<{id: number, nom: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  // Form state
  const [newSpecialty, setNewSpecialty] = useState<NewSpecialty>({
    codeSpecialite: '',
    nom: '',
    description: ''
  });
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState<{
    codeSpecialite?: string;
    nom?: string;
    description?: string;
    general?: string;
  }>({});

  const fetchSpecialties = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/specialites');
      console.log('API Response:', response.data);
      
      // Extract specialties from response
      const specialtiesData = Array.isArray(response.data) 
        ? response.data 
        : response.data.data || response.data.content || response.data.specialites || [];
        
      console.log('Processed specialties data:', specialtiesData);
      
      // Check the structure of each specialty object
      if (specialtiesData.length > 0) {
        console.log('First specialty object structure:', JSON.stringify(specialtiesData[0]));
        console.log('ID property type:', typeof specialtiesData[0].id);
        console.log('ID value:', specialtiesData[0].id);
      }
      
      setSpecialties(specialtiesData);
      setError(null);
    } catch (err) {
      console.error('Error fetching specialties:', err);
      setError('Erreur lors du chargement des spécialités. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const handleBack = () => {
    navigate('/notes'); // Navigate back to the NotesPage
  };
  
  const openCreateModal = () => {
    setIsEditMode(false);
    setEditingSpecialtyId(null);
    setIsModalOpen(true);
    setNewSpecialty({
      codeSpecialite: '',
      nom: '',
      description: ''
    });
    setFormErrors({});
  };
  
  const openEditModal = (specialty: Specialty) => {
    console.log('Editing specialty:', specialty);
    
    // Find the ID regardless of what property name is used
    const specialtyId = specialty.id || specialty.idSpecialite || specialty.specialiteId;
    
    if (!specialtyId) {
      console.error('Could not find ID for specialty:', specialty);
      showToast('Erreur: Impossible de modifier cette spécialité (ID manquant)', 'error');
      return;
    }
    
    setIsEditMode(true);
    setEditingSpecialtyId(specialtyId);
    setIsModalOpen(true);
    setNewSpecialty({
      codeSpecialite: specialty.codeSpecialite || '',
      nom: specialty.nom,
      description: specialty.description
    });
    setFormErrors({});
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingSpecialtyId(null);
  };
  
  const openDeleteConfirmation = (specialty: Specialty) => {
    // Find the ID regardless of what property name is used
    const specialtyId = specialty.id || specialty.idSpecialite || specialty.specialiteId;
    
    if (!specialtyId) {
      console.error('Could not find ID for specialty to delete:', specialty);
      showToast('Erreur: Impossible de supprimer cette spécialité (ID manquant)', 'error');
      return;
    }
    
    setSpecialtyToDelete({ 
      id: specialtyId,
      nom: specialty.nom 
    });
    setShowDeleteConfirmation(true);
  };
  
  const closeDeleteConfirmation = () => {
    setShowDeleteConfirmation(false);
    setSpecialtyToDelete(null);
  };
  
  const handleDelete = async () => {
    if (!specialtyToDelete) return;
    
    setIsDeleting(true);
    
    try {
      await axios.delete(`/api/specialites/${specialtyToDelete.id}`);
      
      // Close the confirmation dialog
      closeDeleteConfirmation();
      
      // Show success message
      showToast('La spécialité a été supprimée avec succès', 'success');
      
      // Refresh the specialties list
      await fetchSpecialties();
    } catch (err) {
      console.error('Error deleting specialty:', err);
      showToast('Erreur lors de la suppression de la spécialité', 'error');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSpecialty(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  const validateForm = (): boolean => {
    const errors: {
      codeSpecialite?: string;
      nom?: string;
      description?: string;
    } = {};
    
    if (!newSpecialty.codeSpecialite.trim()) {
      errors.codeSpecialite = 'Le code de spécialité est requis';
    }
    
    if (!newSpecialty.nom.trim()) {
      errors.nom = 'Le nom est requis';
    }
    
    if (!newSpecialty.description.trim()) {
      errors.description = 'La description est requise';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (isEditMode && editingSpecialtyId !== null && editingSpecialtyId !== undefined) {
        console.log('Updating specialty with ID:', editingSpecialtyId);
        
        // Ensure we have a valid ID before making the request
        if (isNaN(Number(editingSpecialtyId))) {
          throw new Error(`Invalid specialty ID: ${editingSpecialtyId}`);
        }
        
        // Update existing specialty
        await axios.put(`/api/specialites/${editingSpecialtyId}`, newSpecialty);
        showToast('La spécialité a été mise à jour avec succès', 'success');
      } else {
        // Create new specialty
        await axios.post('/api/specialites', newSpecialty);
        showToast('La spécialité a été ajoutée avec succès', 'success');
      }
      
      // Close modal immediately
      closeModal();
      
      // Refresh specialties list
      await fetchSpecialties();
      
    } catch (err) {
      console.error('Error saving specialty:', err);
      const errorMessage = isEditMode 
        ? `Erreur lors de la modification de la spécialité (ID: ${editingSpecialtyId}). Veuillez réessayer.`
        : 'Erreur lors de l\'ajout de la spécialité. Veuillez réessayer.';
      
      setFormErrors(prev => ({
        ...prev,
        general: errorMessage
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="specialties-page">
      <div className="specialties-header">
        <button className="back-button" onClick={handleBack} aria-label="Retour">
          <BackArrowIcon />
          <span>Retour</span>
        </button>
      </div>
      <div className="specialties-content">
        <div className="specialties-container">
          <div className="specialties-title-section">
            <h1 className="specialties-title">Gestion des spécialités</h1>
            <button className="add-specialty-button" onClick={openCreateModal}>
              <AddIcon />
              <span>Ajouter une spécialité</span>
            </button>
          </div>
          
          <div className="specialties-table-container">
            {isLoading ? (
              <div className="loading-container">
                <LoadingIcon />
                <span>Chargement des spécialités...</span>
              </div>
            ) : error ? (
              <div className="error-container">
                <p className="error-message">{error}</p>
                <button onClick={() => window.location.reload()} className="retry-button">
                  Réessayer
                </button>
              </div>
            ) : (
              <table className="specialties-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Spécialité</th>
                    <th>Description</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {specialties.length > 0 ? (
                    specialties
                      .filter(specialty => specialty.nom !== 'Générale')
                      .map((specialty) => {
                        // Get the ID using any of the possible property names
                        const specialtyId = specialty.id || specialty.idSpecialite || specialty.specialiteId;
                        
                        return (
                          <tr key={specialtyId}>
                            <td>{specialty.codeSpecialite || '-'}</td>
                            <td>{specialty.nom}</td>
                            <td>{specialty.description}</td>
                            <td>
                              <div className="action-buttons">
                                <button 
                                  className="action-btn" 
                                  aria-label="Modifier"
                                  onClick={() => openEditModal(specialty)}
                                >
                                  <EditIcon />
                                </button>
                                <button
                                  className="action-btn action-btn-delete"
                                  aria-label="Supprimer"
                                  onClick={() => openDeleteConfirmation(specialty)}
                                >
                                  <DeleteIcon />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan={4} className="no-data-message">
                        Aucune spécialité trouvée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal for adding/editing specialty */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{isEditMode ? 'Modifier la spécialité' : 'Ajouter une spécialité'}</h2>
              <button className="close-button" onClick={closeModal}>
                <CloseIcon />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="specialty-form">
              <div className="form-group">
                <label htmlFor="codeSpecialite">
                  Code de spécialité <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="codeSpecialite"
                  name="codeSpecialite"
                  value={newSpecialty.codeSpecialite}
                  onChange={handleInputChange}
                  className={formErrors.codeSpecialite ? 'error' : ''}
                />
                {formErrors.codeSpecialite && (
                  <span className="error-text">{formErrors.codeSpecialite}</span>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="nom">
                  Nom <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={newSpecialty.nom}
                  onChange={handleInputChange}
                  className={formErrors.nom ? 'error' : ''}
                />
                {formErrors.nom && (
                  <span className="error-text">{formErrors.nom}</span>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="description">
                  Description <span className="required">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={newSpecialty.description}
                  onChange={handleInputChange}
                  className={formErrors.description ? 'error' : ''}
                />
                {formErrors.description && (
                  <span className="error-text">{formErrors.description}</span>
                )}
              </div>
              
              {formErrors.general && (
                <div className="general-error">
                  {formErrors.general}
                </div>
              )}
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button" 
                  onClick={closeModal}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <LoadingIcon /> : isEditMode ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      {showDeleteConfirmation && specialtyToDelete && (
        <div className="modal-overlay">
          <div className="modal-content confirmation-dialog">
            <div className="modal-header">
              <h2>Confirmation de suppression</h2>
              <button className="close-button" onClick={closeDeleteConfirmation}>
                <CloseIcon />
              </button>
            </div>
            
            <div className="confirmation-body">
              <p>Êtes-vous sûr de vouloir supprimer la spécialité <strong>{specialtyToDelete.nom}</strong> ?</p>
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
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? <LoadingIcon /> : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialtiesManagementPage; 