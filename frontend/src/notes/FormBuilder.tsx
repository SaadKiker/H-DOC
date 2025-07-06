import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../shared/api/api.config';
import { useToast } from '../shared/components/ToastContext';
import './FormBuilder.css';
import { 
  FormModel, 
  getFormStructureById, 
  updateFormModelComplete 
} from '../shared/api/formService';

// Types for form state management
interface FormField {
  id?: number;        // Added for edit mode
  idChamp?: number;   // Added for edit mode
  nom: string;
  estObligatoire: boolean;
  typeChamp: string;
  placeholder: string;
  ordreAffichage: number;
  valeursPossibles: string[] | null;
  unite: string | null;
}

interface FormSection {
  id?: number;        // Added for edit mode
  idSection?: number; // Added for edit mode
  nom: string;
  description: string;
  ordreAffichage: number;
  champs: FormField[];
}

interface FormData {
  id?: number;        // Added for edit mode
  idModele?: number;  // Added for edit mode
  nom: string;
  description: string;
  idSpecialite: number;
  prix: number;
  sections: FormSection[];
}

// Types for API submission
interface ApiFormField {
  idChamp?: number;   // Added for edit mode
  nom: string;
  estObligatoire: boolean;
  typeChamp: string;
  placeholder: string;
  ordreAffichage: number;
  valeursPossibles: string | null;
  unite: string | null;
}

interface ApiFormSection {
  idSection?: number; // Added for edit mode
  nom: string;
  description: string;
  ordreAffichage: number;
  champs: ApiFormField[];
}

interface ApiFormData {
  idModele?: number;  // Added for edit mode
  nom: string;
  description: string;
  idSpecialite: number;
  prix: number;
  sections: ApiFormSection[];
}

interface FormBuilderProps {
  specialtyId: number;
  onCancel: () => void;
  onSuccess: () => void;
  formToEdit?: FormModel; // Optional prop for edit mode
}

// Field type options
const fieldTypeOptions = [
  { value: 'text', label: 'Texte' },
  { value: 'textarea', label: 'Text area' },
  { value: 'number', label: 'Nombre' },
  { value: 'radio', label: 'Boutons radio' },
  { value: 'checkbox', label: 'Cases à cocher' }
];

// Icons
const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"></path>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
  </svg>
);

const AddIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

// Loading Spinner Icon
const LoadingSpinnerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="loading-spinner">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10" strokeLinecap="round" strokeWidth="4" />
  </svg>
);

const FormBuilder: React.FC<FormBuilderProps> = ({ specialtyId, onCancel, onSuccess, formToEdit }) => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!formToEdit); // Set to true if we're loading an existing form
  const [formData, setFormData] = useState<FormData>({
    nom: '',
    description: '',
    idSpecialite: specialtyId,
    prix: 0,
    sections: [
      {
        nom: '',
        description: '',
        ordreAffichage: 1,
        champs: [
          {
            nom: '',
            estObligatoire: false,
            typeChamp: 'text',
            placeholder: '',
            ordreAffichage: 1,
            valeursPossibles: null,
            unite: null
          }
        ]
      }
    ]
  });
  
  // Check if we're in edit mode
  const isEditMode = !!formToEdit;
  
  // Load form data if in edit mode
  useEffect(() => {
    const loadFormData = async () => {
      if (!formToEdit) return;
      
      try {
        // Get the form ID from either id or idModele property
        const formId = formToEdit.id || (formToEdit as any).idModele;
        if (!formId) {
          throw new Error('Form ID is missing');
        }
        
        // Load full form structure
        const formStructure = await getFormStructureById(formId);
        console.log('Loaded form structure:', formStructure);
        
        // Basic form data
        const loadedFormData: FormData = {
          id: formToEdit.id,
          idModele: formToEdit.idModele || formToEdit.id, // Use either one
          nom: formToEdit.nom || '',
          description: formToEdit.description || '',
          idSpecialite: formToEdit.specialiteId || formToEdit.idSpecialite || specialtyId,
          prix: formToEdit.prix || 0,
          sections: []
        };
        
        // Handle both array format and object with structure property
        if (Array.isArray(formStructure)) {
          // Direct array of sections
          loadedFormData.sections = formStructure.map((section: any, sIndex: number) => {
            const parsedSection: FormSection = {
              id: section.id,
              idSection: section.idSection,
              nom: section.nom || '',
              description: section.description || '',
              ordreAffichage: section.ordreAffichage || sIndex + 1,
              champs: []
            };
            
            // Parse fields
            if (section.champs && Array.isArray(section.champs)) {
              parsedSection.champs = section.champs.map((field: any, fIndex: number) => {
                // Parse possible values if it's a string
                let valeursPossibles = null;
                if (field.valeursPossibles) {
                  if (typeof field.valeursPossibles === 'string') {
                    valeursPossibles = field.valeursPossibles.split(';').filter((v: string) => v.trim() !== '');
                  } else if (Array.isArray(field.valeursPossibles)) {
                    valeursPossibles = field.valeursPossibles;
                  }
                }
                
                return {
                  id: field.id,
                  idChamp: field.idChamp,
                  nom: field.nom || '',
                  estObligatoire: field.estObligatoire || false,
                  typeChamp: field.typeChamp || 'text',
                  placeholder: field.placeholder || '',
                  ordreAffichage: field.ordreAffichage || fIndex + 1,
                  valeursPossibles,
                  unite: field.unite || null
                };
              });
            }
            
            return parsedSection;
          });
        } else if (formStructure && formStructure.structure) {
          // Object with structure property
          const { structure } = formStructure;
          
          // Parse sections
          if (structure.sections && Array.isArray(structure.sections)) {
            loadedFormData.sections = structure.sections.map((section: any, sIndex: number) => {
              const parsedSection: FormSection = {
                id: section.id,
                idSection: section.idSection,
                nom: section.nom || '',
                description: section.description || '',
                ordreAffichage: section.ordreAffichage || sIndex + 1,
                champs: []
              };
              
              // Parse fields
              if (section.champs && Array.isArray(section.champs)) {
                parsedSection.champs = section.champs.map((field: any, fIndex: number) => {
                  // Parse possible values if it's a string
                  let valeursPossibles = null;
                  if (field.valeursPossibles) {
                    if (typeof field.valeursPossibles === 'string') {
                      valeursPossibles = field.valeursPossibles.split(';').filter((v: string) => v.trim() !== '');
                    } else if (Array.isArray(field.valeursPossibles)) {
                      valeursPossibles = field.valeursPossibles;
                    }
                  }
                  
                  return {
                    id: field.id,
                    idChamp: field.idChamp,
                    nom: field.nom || '',
                    estObligatoire: field.estObligatoire || false,
                    typeChamp: field.typeChamp || 'text',
                    placeholder: field.placeholder || '',
                    ordreAffichage: field.ordreAffichage || fIndex + 1,
                    valeursPossibles,
                    unite: field.unite || null
                  };
                });
              }
              
              return parsedSection;
            });
          }
        } else {
          throw new Error('Invalid form structure received');
        }
        
        // Make sure we have at least one section with one field
        if (loadedFormData.sections.length === 0) {
          loadedFormData.sections = [
            {
              nom: '',
              description: '',
              ordreAffichage: 1,
              champs: [
                {
                  nom: '',
                  estObligatoire: false,
                  typeChamp: 'text',
                  placeholder: '',
                  ordreAffichage: 1,
                  valeursPossibles: null,
                  unite: null
                }
              ]
            }
          ];
        }
        
        // Update form data state
        setFormData(loadedFormData);
      } catch (error) {
        console.error('Error loading form data:', error);
        showToast('Erreur lors du chargement du formulaire', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (formToEdit) {
      loadFormData();
    }
  }, [formToEdit, specialtyId, showToast]);

  // Update form main properties
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'prix' ? parseFloat(value) || 0 : value
    });
  };

  // Update section properties
  const handleSectionChange = (sectionIndex: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updatedSections = [...formData.sections];
    updatedSections[sectionIndex] = {
      ...updatedSections[sectionIndex],
      [name]: value
    };
    setFormData({
      ...formData,
      sections: updatedSections
    });
  };

  // Update field properties
  const handleFieldChange = (
    sectionIndex: number, 
    fieldIndex: number, 
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    const updatedSections = [...formData.sections];
    
    if (name === 'typeChamp' && value !== updatedSections[sectionIndex].champs[fieldIndex].typeChamp) {
      // Reset valeursPossibles when changing field type
      const needsPossibleValues = ['radio', 'checkbox'].includes(value);
      if (needsPossibleValues) {
        // Initialiser avec deux options par défaut - au moins, pour éviter les erreurs
        updatedSections[sectionIndex].champs[fieldIndex].valeursPossibles = ['Option 1', 'Option 2'];
      } else {
        updatedSections[sectionIndex].champs[fieldIndex].valeursPossibles = null;
      }
    }
    
    updatedSections[sectionIndex].champs[fieldIndex] = {
      ...updatedSections[sectionIndex].champs[fieldIndex],
      [name]: name === 'estObligatoire' ? checked : value
    };
    
    setFormData({
      ...formData,
      sections: updatedSections
    });
  };

  // Update possible values for select/radio/checkbox fields
  const handlePossibleValuesChange = (
    sectionIndex: number,
    fieldIndex: number,
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { value } = e.target;
    const valuesArray = value ? value.split('\n').filter(v => v.trim() !== '') : [];
    
    const updatedSections = [...formData.sections];
    updatedSections[sectionIndex].champs[fieldIndex].valeursPossibles = valuesArray.length > 0 ? valuesArray : null;
    
    setFormData({
      ...formData,
      sections: updatedSections
    });
  };

  // Add a new section
  const addSection = () => {
    const newSection: FormSection = {
      nom: '',
      description: '',
      ordreAffichage: formData.sections.length + 1,
      champs: [
        {
          nom: '',
          estObligatoire: false,
          typeChamp: 'text',
          placeholder: '',
          ordreAffichage: 1,
          valeursPossibles: null,
          unite: null
        }
      ]
    };
    
    setFormData({
      ...formData,
      sections: [...formData.sections, newSection]
    });
  };

  // Remove a section
  const removeSection = (sectionIndex: number) => {
    if (formData.sections.length <= 1) {
      showToast('Le formulaire doit contenir au moins une section', 'warning');
      return;
    }

    const updatedSections = formData.sections.filter((_, index) => index !== sectionIndex);
    // Update display order of remaining sections
    updatedSections.forEach((section, index) => {
      section.ordreAffichage = index + 1;
    });
    
    setFormData({
      ...formData,
      sections: updatedSections
    });
  };

  // Add a new field to a section
  const addField = (sectionIndex: number) => {
    const updatedSections = [...formData.sections];
    const newField: FormField = {
      nom: '',
      estObligatoire: false,
      typeChamp: 'text',
      placeholder: '',
      ordreAffichage: updatedSections[sectionIndex].champs.length + 1,
      valeursPossibles: null,
      unite: null
    };
    
    updatedSections[sectionIndex].champs.push(newField);
    
    setFormData({
      ...formData,
      sections: updatedSections
    });
  };

  // Remove a field from a section
  const removeField = (sectionIndex: number, fieldIndex: number) => {
    if (formData.sections[sectionIndex].champs.length <= 1) {
      showToast('Chaque section doit contenir au moins un champ', 'warning');
      return;
    }

    const updatedSections = [...formData.sections];
    updatedSections[sectionIndex].champs = updatedSections[sectionIndex].champs
      .filter((_, index) => index !== fieldIndex);
    
    // Update display order of remaining fields
    updatedSections[sectionIndex].champs.forEach((field, index) => {
      field.ordreAffichage = index + 1;
    });
    
    setFormData({
      ...formData,
      sections: updatedSections
    });
  };

  // Add a new option to a field's possible values
  const addOption = (sectionIndex: number, fieldIndex: number) => {
    const updatedSections = [...formData.sections];
    const field = updatedSections[sectionIndex].champs[fieldIndex];
    
    // Initialize valeursPossibles if it doesn't exist
    if (!field.valeursPossibles) {
      field.valeursPossibles = [];
    }
    
    field.valeursPossibles.push('');
    
    setFormData({
      ...formData,
      sections: updatedSections
    });
  };

  // Update a specific option value
  const handleOptionChange = (
    sectionIndex: number,
    fieldIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const updatedSections = [...formData.sections];
    const field = updatedSections[sectionIndex].champs[fieldIndex];
    
    if (field.valeursPossibles) {
      field.valeursPossibles[optionIndex] = value;
      
      setFormData({
        ...formData,
        sections: updatedSections
      });
    }
  };

  // Remove a specific option
  const removeOption = (sectionIndex: number, fieldIndex: number, optionIndex: number) => {
    // Ne pas permettre de supprimer les 2 premières options
    if (optionIndex < 2) {
      return;
    }
    
    const updatedSections = [...formData.sections];
    const field = updatedSections[sectionIndex].champs[fieldIndex];
    
    if (field.valeursPossibles && field.valeursPossibles.length > 2) {
      field.valeursPossibles = field.valeursPossibles.filter((_, index) => index !== optionIndex);
      
      setFormData({
        ...formData,
        sections: updatedSections
      });
    }
  };

  // Convert FormData to ApiFormData for submission
  const convertToApiFormat = (data: FormData): ApiFormData => {
    const apiData: ApiFormData = {
      ...data,
      // Include idModele for edit mode
      ...(data.idModele && { idModele: data.idModele }),
      sections: data.sections.map(section => ({
        ...section,
        // Include idSection for edit mode (if it exists)
        ...(section.idSection && { idSection: section.idSection }),
        champs: section.champs.map(field => {
          let valeursPossibles: string | null = null;
          
          // Convert array of values to semicolon-separated string for radio/checkbox fields
          if (['radio', 'checkbox'].includes(field.typeChamp) && field.valeursPossibles) {
            valeursPossibles = field.valeursPossibles
              .filter(val => val.trim() !== '')
              .join(';'); // Use semicolon as separator
            
            // Ensure we have at least 2 options
            if (!valeursPossibles || valeursPossibles.split(';').length < 2) {
              valeursPossibles = 'Option 1;Option 2';
            }
          }
          
          return {
            ...field,
            // Include idChamp for edit mode (if it exists)
            ...(field.idChamp && { idChamp: field.idChamp }),
            valeursPossibles
          };
        })
      }))
    };
    
    return apiData;
  };

  // Create a new form based on the current one
  const createCopyOfForm = async () => {
    // Create a copy of the form data without ID fields
    const newFormData: FormData = {
      ...formData,
      nom: `${formData.nom} (Copie)`, // Suggest it's a copy
      id: undefined, // Remove ID
      idModele: undefined, // Remove ID
      sections: formData.sections.map(section => ({
        ...section,
        id: undefined, // Remove section ID
        idSection: undefined, // Remove section ID
        champs: section.champs.map(field => ({
          ...field,
          id: undefined, // Remove field ID
          idChamp: undefined, // Remove field ID
        }))
      }))
    };

    setIsSubmitting(true);
    
    try {
      // Convert form data to API format
      const apiFormData = convertToApiFormat(newFormData);
      
      console.log('Creating copy of form:', JSON.stringify(apiFormData));
      
      // Create new form
      await axios.post(`${API_ENDPOINTS.FORMULAIRES.GET_MODELES}/complet`, apiFormData);
      showToast('Nouvelle copie du formulaire créée avec succès', 'success');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating form copy:', error);
      showToast(`Erreur lors de la création de la copie: ${error.message || 'Erreur inconnue'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit form to create a new form model
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.nom.trim()) {
      showToast('Veuillez saisir un nom pour le formulaire', 'error');
      return;
    }
    
    // Validate each section has a name
    for (let i = 0; i < formData.sections.length; i++) {
      if (!formData.sections[i].nom.trim()) {
        showToast(`Veuillez saisir un nom pour la section ${i + 1}`, 'error');
        return;
      }
      
      // Validate each field has a name
      for (let j = 0; j < formData.sections[i].champs.length; j++) {
        const field = formData.sections[i].champs[j];
        if (!field.nom.trim()) {
          showToast(`Veuillez saisir un nom pour le champ ${j + 1} de la section "${formData.sections[i].nom}"`, 'error');
          return;
        }
        
        // Validate that radio/checkbox fields have possible values
        if (['radio', 'checkbox'].includes(field.typeChamp)) {
          if (!field.valeursPossibles || field.valeursPossibles.length < 2) {
            showToast(`Veuillez ajouter au moins deux options pour le champ "${field.nom}"`, 'error');
            return;
          }
          
          // Check for empty options
          const emptyOptions = field.valeursPossibles.filter(value => !value.trim());
          if (emptyOptions.length > 0) {
            showToast(`Veuillez remplir toutes les options pour le champ "${field.nom}"`, 'error');
            return;
          }
        }
      }
    }
    
    setIsSubmitting(true);
    
    try {
      // Convert form data to API format
      const apiFormData = convertToApiFormat(formData);
      
      // Debug: afficher l'objet avant envoi
      console.log('Sending to server:', JSON.stringify(apiFormData));
      
      if (isEditMode) {
        try {
          // Update existing form
          await updateFormModelComplete(apiFormData);
          showToast('Formulaire mis à jour avec succès', 'success');
          onSuccess();
        } catch (error: any) {
          console.error('Error updating form:', error);
          
          if (error.message && error.message.includes('a déjà été utilisé')) {
            // Special handling for forms that cannot be modified due to usage
            const confirmCopy = window.confirm(
              'Ce formulaire a déjà été utilisé par des patients et ne peut pas être entièrement modifié. Voulez-vous créer une copie du formulaire avec vos modifications?'
            );
            
            if (confirmCopy) {
              await createCopyOfForm();
            } else {
              showToast(
                'Modification annulée. Vous pouvez créer un nouveau formulaire à la place.', 
                'warning'
              );
            }
          } else {
            showToast(`Erreur lors de la mise à jour du formulaire: ${error.message || 'Erreur inconnue'}`, 'error');
          }
        }
      } else {
        // Create new form
        await axios.post(`${API_ENDPOINTS.FORMULAIRES.GET_MODELES}/complet`, apiFormData);
        showToast('Formulaire créé avec succès', 'success');
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      showToast(`Erreur lors de la ${isEditMode ? 'mise à jour' : 'création'} du formulaire: ${error.message || 'Erreur inconnue'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="form-builder loading">
        <div className="loading-container">
          <LoadingSpinnerIcon />
          <span>Chargement du formulaire...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="form-builder">
      <h3 className="form-builder-title">
        {isEditMode ? 'Modification du formulaire' : 'Création d\'un nouveau formulaire'}
      </h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-section general-info">
          <h4 className="form-section-title">Informations générales</h4>
          
          <div className="form-group">
            <label htmlFor="nom">Nom du formulaire *</label>
            <input
              type="text"
              id="nom"
              name="nom"
              value={formData.nom}
              onChange={handleFormChange}
              required
              placeholder="Ex: Formulaire de consultation initiale"
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              placeholder="Description du formulaire et son utilisation..."
              className="form-control"
              rows={3}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="prix">Prix (MAD)</label>
            <input
              type="number"
              id="prix"
              name="prix"
              value={formData.prix}
              onChange={handleFormChange}
              min="0"
              step="0.01"
              className="form-control"
              placeholder="0.00"
            />
          </div>
        </div>
        
        {formData.sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="form-section section-container-2">
            <div className="section-header">
              <h4 className="form-section-title">Section {sectionIndex + 1}</h4>
              <button 
                type="button" 
                className="delete-button"
                onClick={() => removeSection(sectionIndex)}
                aria-label="Supprimer cette section"
              >
                <DeleteIcon />
              </button>
            </div>
            
            <div className="form-group">
              <label htmlFor={`section-${sectionIndex}-nom`}>Nom de la section *</label>
              <input
                type="text"
                id={`section-${sectionIndex}-nom`}
                name="nom"
                value={section.nom}
                onChange={(e) => handleSectionChange(sectionIndex, e)}
                required
                placeholder="Ex: Antécédents médicaux"
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor={`section-${sectionIndex}-description`}>Description</label>
              <textarea
                id={`section-${sectionIndex}-description`}
                name="description"
                value={section.description}
                onChange={(e) => handleSectionChange(sectionIndex, e)}
                placeholder="Description de cette section..."
                className="form-control"
                rows={2}
              />
            </div>
            
            <h5 className="fields-title">Champs</h5>
            
            {section.champs.map((field, fieldIndex) => (
              <div key={fieldIndex} className="field-container">
                <div className="field-header">
                  <h6 className="field-title">Champ {fieldIndex + 1}</h6>
                  <button 
                    type="button" 
                    className="delete-button"
                    onClick={() => removeField(sectionIndex, fieldIndex)}
                    aria-label="Supprimer ce champ"
                  >
                    <DeleteIcon />
                  </button>
                </div>
                
                <div className="form-group">
                  <label htmlFor={`field-${sectionIndex}-${fieldIndex}-nom`}>Nom du champ *</label>
                  <input
                    type="text"
                    id={`field-${sectionIndex}-${fieldIndex}-nom`}
                    name="nom"
                    value={field.nom}
                    onChange={(e) => handleFieldChange(sectionIndex, fieldIndex, e)}
                    required
                    placeholder="Ex: Maladies chroniques"
                    className="form-control"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group field-type">
                    <label htmlFor={`field-${sectionIndex}-${fieldIndex}-type`}>Type *</label>
                    <select
                      id={`field-${sectionIndex}-${fieldIndex}-type`}
                      name="typeChamp"
                      value={field.typeChamp}
                      onChange={(e) => handleFieldChange(sectionIndex, fieldIndex, e)}
                      className="form-control"
                    >
                      {fieldTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group field-required">
                    <div className="checkbox-container">
                      <input
                        type="checkbox"
                        id={`field-${sectionIndex}-${fieldIndex}-required`}
                        name="estObligatoire"
                        checked={field.estObligatoire}
                        onChange={(e) => handleFieldChange(sectionIndex, fieldIndex, e)}
                        className="checkbox-input"
                      />
                      <label htmlFor={`field-${sectionIndex}-${fieldIndex}-required`}>
                        Obligatoire
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor={`field-${sectionIndex}-${fieldIndex}-placeholder`}>Placeholder</label>
                  <input
                    type="text"
                    id={`field-${sectionIndex}-${fieldIndex}-placeholder`}
                    name="placeholder"
                    value={field.placeholder}
                    onChange={(e) => handleFieldChange(sectionIndex, fieldIndex, e)}
                    placeholder="Ex: Décrire ici..."
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor={`field-${sectionIndex}-${fieldIndex}-unite`}>Unité</label>
                  <input
                    type="text"
                    id={`field-${sectionIndex}-${fieldIndex}-unite`}
                    name="unite"
                    value={field.unite || ''}
                    onChange={(e) => handleFieldChange(sectionIndex, fieldIndex, e)}
                    placeholder="Ex: kg, cm, °C..."
                    className="form-control"
                  />
                </div>
                
                {['radio', 'checkbox'].includes(field.typeChamp) && (
                  <div className="form-group options-group">
                    <label>
                      Valeurs possibles *
                    </label>
                    
                    {/* Liste des options avec boutons de suppression uniquement pour les options > 2 */}
                    {(field.valeursPossibles || []).length === 0 && (
                      <p className="no-options-message">Aucune option. Ajoutez-en une ci-dessous.</p>
                    )}
                    
                    {(field.valeursPossibles || []).map((option, optionIndex) => (
                      <div key={optionIndex} className="option-row">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(sectionIndex, fieldIndex, optionIndex, e.target.value)}
                          placeholder={`Option ${optionIndex + 1}`}
                          className="form-control option-input"
                          required
                        />
                        {/* Bouton de suppression uniquement pour les options au-delà des 2 premières */}
                        {optionIndex >= 2 && (
                          <button 
                            type="button"
                            onClick={() => removeOption(sectionIndex, fieldIndex, optionIndex)}
                            className="delete-option-button-neutral"
                            aria-label="Supprimer cette option"
                          >
                            <DeleteIcon />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {/* Bouton pour ajouter une nouvelle option */}
                    <button
                      type="button"
                      onClick={() => addOption(sectionIndex, fieldIndex)}
                      className="add-option-button"
                    >
                      <AddIcon /> Ajouter une option
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            <button 
              type="button" 
              className="add-field-button"
              onClick={() => addField(sectionIndex)}
            >
              <AddIcon /> Ajouter un champ
            </button>
          </div>
        ))}
        
        <button 
          type="button" 
          className="add-section-button"
          onClick={addSection}
        >
          <AddIcon /> Ajouter une section
        </button>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinnerIcon /> {isEditMode ? 'Mise à jour en cours...' : 'Création en cours...'}
              </>
            ) : (isEditMode ? 'Mettre à jour' : 'Créer le formulaire')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormBuilder; 