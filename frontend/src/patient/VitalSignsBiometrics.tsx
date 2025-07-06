import React, { useState, useEffect, useRef } from 'react';
import axios from '../shared/api/axios';
import { API_ENDPOINTS } from '../shared/api/api.config';
import { ChampFormulaire, SectionFormulaire, FormReponse } from '../dashboard/types';
import './PatientProfile.css';
import './VitalSignsBiometrics.css';
import { useToast } from '../shared/components/ToastContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatWithOptions } from 'date-fns/fp';
import NoActiveVisitAlert from '../shared/components/NoActiveVisitAlert';

// LoadingSpinner component
const LoadingSpinner = () => (
  <div className="loading-spinner-container">
    <div className="loading-spinner"></div>
  </div>
);

// RightArrowIcon component for the close button
const RightArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6"/>
  </svg>
);

interface BiometricFormPanelProps {
  isOpen: boolean;
  onClose: () => void;
  patientIPP: string;
  patientId?: string;
  activeVisitId?: number | null;
  getCurrentDoctorId?: () => string | null;
  onSubmitSuccess?: () => void;
}

// CSS class for removing spin buttons from number inputs
// Add it here outside any component to avoid hook ordering issues
const noSpinButtonsStyle = `
  .no-spin-buttons::-webkit-outer-spin-button,
  .no-spin-buttons::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .no-spin-buttons {
    -moz-appearance: textfield;
  }
`;

const BiometricFormPanel = ({ isOpen, onClose, patientIPP, patientId, activeVisitId, getCurrentDoctorId, onSubmitSuccess }: BiometricFormPanelProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formStructure, setFormStructure] = useState<SectionFormulaire[]>([]);
  const [formResponses, setFormResponses] = useState<{[key: number]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const { showToast } = useToast();
  
  // References for section scrolling
  const sectionRefs = useRef<{[key: number]: HTMLDivElement | null}>({});
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Add the style to the document once - moved from renderField to component top level
  useEffect(() => {
    const styleId = 'remove-number-spinners-style';
    if (!document.getElementById(styleId)) {
      const styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.textContent = noSpinButtonsStyle;
      document.head.appendChild(styleElement);
    }
    
    return () => {
      // Optional cleanup - could remove the style on component unmount if needed
      // const styleElement = document.getElementById(styleId);
      // if (styleElement) document.head.removeChild(styleElement);
    };
  }, []);
  
  console.log('BiometricFormPanel rendered, isOpen:', isOpen, 'formStructure length:', formStructure.length);
  
  useEffect(() => {
    console.log('isOpen changed to:', isOpen);
    if (isOpen) {
      console.log('Panel opened, fetching form structure...');
      fetchFormStructure();
    }
  }, [isOpen, patientIPP]);
  
  // Reset form state when panel is closed
  useEffect(() => {
    if (!isOpen) {
      console.log('Panel closed, resetting form state');
      setFormStructure([]);
      setFormResponses({});
      setError(null);
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
  }, [formStructure, activeSection]);
  
  const fetchFormStructure = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching form structure from endpoint:', API_ENDPOINTS.FORMULAIRES.GET_MODELE_STRUCTURE(1));
      
      // Try the main endpoint first
      const response = await axios.get(
        API_ENDPOINTS.FORMULAIRES.GET_MODELE_STRUCTURE(1)
      );
      
      console.log('Form structure API response status:', response.status);
      console.log('Form structure API response data:', response.data);
      
      const data = response.data;
      
      if (Array.isArray(data)) {
        console.log('Setting form structure from array:', data);
        if (data.length > 0) {
          console.log('First section:', data[0]);
          console.log('Field sample from first section:', data[0].champs && data[0].champs[0]);
        }
        setFormStructure(data);
      } else if (data.sections && Array.isArray(data.sections)) {
        console.log('Setting form structure from sections property:', data.sections);
        if (data.sections.length > 0) {
          console.log('First section:', data.sections[0]);
          console.log('Field sample from first section:', data.sections[0].champs && data.sections[0].champs[0]);
        }
        setFormStructure(data.sections);
      } else if (typeof data === 'object' && data !== null) {
        // Handle case where the API returns a single section instead of an array
        console.log('Setting form structure from a single section object:', data);
        if (data.champs && Array.isArray(data.champs)) {
          console.log('Fields from single section:', data.champs);
          setFormStructure([data]);
        } else {
          console.error('Single section object does not have champs array:', data);
          throw new Error('Format de données incorrect: section sans champs');
        }
      } else {
        console.error('Invalid form structure format:', data);
        throw new Error('Format de données incorrect');
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement de la structure du formulaire:', err);
      console.error('Error details:', err.response?.data || err.message);
      
      try {
        // Fallback approach: try a more generic endpoint
        console.log('Trying fallback endpoint...');
        const fallbackResponse = await axios.get(`/api/formulaires/modeles/1`);
        console.log('Fallback response:', fallbackResponse.data);
        
        if (fallbackResponse.data && 
            (Array.isArray(fallbackResponse.data.sections) || 
             Array.isArray(fallbackResponse.data))) {
          // Extract sections from the response
          const sections = Array.isArray(fallbackResponse.data) 
            ? fallbackResponse.data 
            : fallbackResponse.data.sections;
          
          console.log('Setting sections from fallback response:', sections);
          setFormStructure(sections);
        } else {
          throw new Error('Format de données incorrect dans la réponse de secours');
        }
      } catch (fallbackErr: any) {
        console.error('Fallback also failed:', fallbackErr);
        setError('Impossible de charger le formulaire. Veuillez réessayer. Erreur: ' + 
                 (err.response?.data?.message || err.message || 'Erreur inconnue'));
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (fieldId: number, value: string) => {
    // Update the current field value
    setFormResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Check if the current field is either Poids or Taille to trigger IMC calculation
    let isPoidsOrTaille = false;
    let imcFieldId = 0;
    let poidsFieldId = 0;
    let tailleFieldId = 0;
    
    // Find the field IDs for Poids, Taille, and IMC
    const findFieldsInSection = (section: SectionFormulaire) => {
      section.champs.forEach(field => {
        // Check if current field is Poids or Taille
        if (field.idChamp === fieldId) {
          if (field.nom.toLowerCase().includes('poids') || 
              field.nom.toLowerCase().includes('taille')) {
            isPoidsOrTaille = true;
          }
        }
        
        // Store the field IDs for all relevant fields
        if (field.nom.toLowerCase().includes('poids')) {
          poidsFieldId = field.idChamp;
        } else if (field.nom.toLowerCase().includes('taille')) {
          tailleFieldId = field.idChamp;
        } else if (field.nom.toLowerCase().includes('imc')) {
          imcFieldId = field.idChamp;
        }
      });
      
      // Check subsections if they exist
      if (section.sousSections && section.sousSections.length > 0) {
        section.sousSections.forEach(subsection => {
          findFieldsInSection(subsection);
        });
      }
    };
    
    // Search through all sections to find our fields
    formStructure.forEach(section => {
      findFieldsInSection(section);
    });
    
    // Only proceed with IMC calculation if this is a Poids or Taille field update
    // AND we found all the required field IDs
    if (isPoidsOrTaille && imcFieldId > 0 && poidsFieldId > 0 && tailleFieldId > 0) {
      // Get the LATEST values for poids and taille (including the current update)
      const poidsValue = fieldId === poidsFieldId ? value : formResponses[poidsFieldId] || '';
      const tailleValue = fieldId === tailleFieldId ? value : formResponses[tailleFieldId] || '';

      // Only calculate if both values are present and non-empty
      if (poidsValue && tailleValue) {
        // Convert values to numbers
        const poids = parseFloat(poidsValue);
        // Taille might be entered in cm, need to convert to meters for the BMI formula
        let taille = parseFloat(tailleValue);
        
        // Check if values are valid numbers
        if (!isNaN(poids) && !isNaN(taille) && poids > 0 && taille > 0) {
          // Convert height to meters if it's likely in cm (over 3)
          if (taille > 3) {
            taille = taille / 100;
          }
          
          // Calculate IMC: weight / (height * height)
          const imc = poids / (taille * taille);
          
          // Update the IMC field with the calculated value (rounded to 2 decimal places)
          setFormResponses(prev => ({
            ...prev,
            [imcFieldId]: imc.toFixed(2)
          }));
        } else {
          // Clear IMC if values are invalid
          setFormResponses(prev => ({
            ...prev,
            [imcFieldId]: ''
          }));
        }
      } else {
        // Clear IMC if either weight or height is missing
        setFormResponses(prev => ({
          ...prev,
          [imcFieldId]: ''
        }));
      }
    }
  };
  
  const handleCheckboxChange = (fieldId: number, value: string, isChecked: boolean) => {
    setFormResponses(prev => {
      const currentValue = prev[fieldId] || '';
      const values = currentValue ? currentValue.split(',') : [];
      
      if (isChecked) {
        // Add the value if it's not already in the list
        if (!values.includes(value)) {
          values.push(value);
        }
      } else {
        // Remove the value if it exists
        const index = values.indexOf(value);
        if (index !== -1) {
          values.splice(index, 1);
        }
      }
      
      return {
        ...prev,
        [fieldId]: values.join(',')
      };
    });
  };
  
  const scrollToSection = (sectionId: number) => {
    const section = sectionRefs.current[sectionId];
    if (section && contentRef.current) {
      contentRef.current.scrollTo({
        top: section.offsetTop - 10,
        behavior: 'smooth'
      });
    }
  };
  
  const validateForm = (): boolean => {
    let isValid = true;
    let firstInvalidSection: number | null = null;
    let firstInvalidField: Element | null = null;
    
    const validateSection = (section: SectionFormulaire): boolean => {
      let sectionValid = true;
      
      // Check required fields in this section
      section.champs.forEach(field => {
        if (field.estObligatoire) {
          const response = formResponses[field.idChamp];
          if (!response || response.trim() === '') {
            sectionValid = false;
            isValid = false;
            
            // Keep track of the first invalid section for scrolling
            if (firstInvalidSection === null) {
              firstInvalidSection = section.idSection;
              
              // Find the field element
              const fieldElement = document.getElementById(`section-${section.idSection}`);
              if (fieldElement) {
                const fieldId = `field-${field.idChamp}`;
                const inputElement = fieldElement.querySelector(`#${fieldId}, [id*="-${field.idChamp}-"], [id$="-${field.idChamp}"]`);
                if (inputElement) {
                  firstInvalidField = inputElement;
                }
              }
            }
            
            // Highlight the field
            const fieldElement = document.getElementById(`section-${section.idSection}`);
            if (fieldElement) {
              const fieldId = `field-${field.idChamp}`;
              const inputElement = fieldElement.querySelector(`#${fieldId}, [id*="-${field.idChamp}-"], [id$="-${field.idChamp}"]`);
              if (inputElement) {
                // Add validation error class
                inputElement.classList.add('validation-error');
                
                // Special handling for select elements - ensure they're visibly highlighted
                if ((field.typeChamp?.toUpperCase() === 'DROPDOWN' || 
                     field.typeChamp?.toUpperCase() === 'COMBO' || 
                     field.typeChamp?.toUpperCase() === 'COMBOBOX' || 
                     field.typeChamp?.toUpperCase() === 'SELECT') && 
                    inputElement.tagName.toLowerCase() === 'select') {
                  
                  // Add select-specific error class
                  inputElement.classList.add('select-error');
                  
                  // Focus the select to show it needs attention
                  setTimeout(() => {
                    (inputElement as HTMLElement).focus();
                  }, 100);
                  
                  // Blur after a brief moment to avoid keeping focus if user doesn't interact
                  setTimeout(() => {
                    (inputElement as HTMLElement).blur();
                  }, 1000);
                }
                
                // Add an inline error message if one doesn't exist already
                const fieldContainer = inputElement.closest('.form-group');
                if (fieldContainer && !fieldContainer.querySelector('.field-error-message')) {
                  const errorMessage = document.createElement('div');
                  errorMessage.className = 'field-error-message';
                  errorMessage.textContent = 'Ce champ est obligatoire';
                  fieldContainer.appendChild(errorMessage);
                  
                  // Remove the error message when field is modified
                  inputElement.addEventListener('input', function() {
                    const errorMsg = fieldContainer.querySelector('.field-error-message');
                    if (errorMsg) {
                      errorMsg.remove();
                    }
                    inputElement.classList.remove('validation-error');
                    inputElement.classList.remove('select-error');
                  }, { once: true });
                  
                  // For select elements, also listen for change events
                  if (inputElement.tagName.toLowerCase() === 'select') {
                    inputElement.addEventListener('change', function() {
                      const errorMsg = fieldContainer.querySelector('.field-error-message');
                      if (errorMsg) {
                        errorMsg.remove();
                      }
                      inputElement.classList.remove('validation-error');
                      inputElement.classList.remove('select-error');
                    }, { once: true });
                  }
                }
                
                // Remove the validation class after a delay, but keep the message
                setTimeout(() => {
                  inputElement.classList.remove('validation-error');
                }, 5000); // 5 seconds for better visibility
              }
            }
          }
        }
      });
      
      // Check subsections
      if (section.sousSections && section.sousSections.length > 0) {
        section.sousSections.forEach(subsection => {
          if (!validateSection(subsection)) {
            sectionValid = false;
          }
        });
      }
      
      return sectionValid;
    };
    
    // Check all sections
    for (const section of formStructure) {
      validateSection(section);
    }
    
    // Scroll to the first invalid field if there is one
    if (firstInvalidSection !== null) {
      scrollToSection(firstInvalidSection);
      
      // Focus the first invalid field
      if (firstInvalidField) {
        setTimeout(() => {
          (firstInvalidField as HTMLElement).focus();
        }, 500); // Wait for scroll to complete
      }
    }
    
    return isValid;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      // Don't set global error, field-level validation will highlight required fields
      return;
    }
    
    // Check if we have all required IDs
    if (!patientIPP) {
      setError('Impossible de soumettre le formulaire: ID du patient manquant.');
      return;
    }
    
    // Get doctor ID if available
    const doctorId = getCurrentDoctorId ? getCurrentDoctorId() : null;
    if (!doctorId) {
      console.warn('Doctor ID not available, using fallback ID');
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Convert the responses to the expected format for submission
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
      
      // Create the payload to match the expected format
      const payload = {
        idPatient: patientId || patientIPP,
        idVisite: activeVisitId || null,
        idModele: 1, // Fixed for biometrics form
        idMedecin: doctorId && doctorId.includes('-') ? doctorId : "141fc646-b241-4893-b87c-2bc542fe9bc3", // Use fallback UUID if needed
        status: "COMPLETED",
        reponses: reponses
      };
      
      console.log('Submitting biometric form with payload:', payload);
      console.log('Submission endpoint:', API_ENDPOINTS.FORMULAIRES.SUBMIT_FORM);
      
      // Use axios instead of fetch for consistency with the rest of the application
      const response = await axios.post(
        API_ENDPOINTS.FORMULAIRES.SUBMIT_FORM,
        payload
      );
      
      console.log('Form submission response status:', response.status);
      console.log('Form submission response data:', response.data);
      
      if (response.status >= 200 && response.status < 300) {
        if (response.data && response.data.idFormulaire) {
          console.log('Biometric form submitted successfully with ID:', response.data.idFormulaire);
          
          // Use the new toast instead of the inline success message
          showToast('Données biométriques enregistrées avec succès!', 'success');
          
          // Clear form responses after successful submission
          setFormResponses({});
          
          // Close the form panel
          setTimeout(() => {
            onClose();
            // Use the callback instead of page reload
            if (onSubmitSuccess) {
              onSubmitSuccess();
            }
          }, 500);
        } else {
          console.error('Unexpected response format:', response.data);
          throw new Error(response.data?.message || 'Réponse invalide du serveur');
        }
      } else {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
    } catch (err: any) {
      console.error('Erreur lors de la soumission des données biométriques:', err);
      
      // Provide more detailed error information
      let errorMessage = 'Impossible de soumettre le formulaire. Veuillez réessayer.';
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = `Erreur ${err.response.status}: ${err.response.data?.message || err.message}`;
        console.error('Error response data:', err.response.data);
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage = 'Aucune réponse du serveur.';
        console.error('Error request:', err.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderField = (field: ChampFormulaire) => {
    const fieldValue = formResponses[field.idChamp] || '';
    console.log('Rendering field:', field.nom, 'Type:', field.typeChamp, 'ID:', field.idChamp);
    
    // Check if this is the Tension Artérielle field
    const isTensionField = field.nom.toLowerCase().includes('tension') || 
                           field.nom.toLowerCase().includes('artérielle') ||
                           field.nom.toLowerCase().includes('arterielle');
    
    // Common field wrapper styles - removed margin as it's handled by parent card div
    const fieldGroupStyle = {
      width: '100%'
    };
    
    // Common label styles - enhanced for clinical look
    const labelStyle = {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '600' as const, // Changed from 500 to 600
      fontSize: '16px', // Increased from 14px
      color: '#333'
    };
    
    // Common input styles - enhanced for clinical look
    const inputStyle = {
      width: '100%',
      padding: '10px 12px', // Increased padding
      borderRadius: '6px', // Increased border radius
      border: '1px solid #d0d0d0',
      fontSize: '18px', // Increased from 16px to 18px
      backgroundColor: 'white',
      height: '44px', // Set explicit height for consistency
      textAlign: 'center' as const // Center text horizontally
    };
    
    // Common input styles declaration is here
    
    // Required marker style
    const requiredStyle = {
      color: '#ff0000',
      marginLeft: '4px',
      fontSize: '16px',
      fontWeight: '600'
    };
    
    // Unit display style
    const unitStyle = {
      marginLeft: '8px',
      color: '#666',
      fontSize: '15px',
      fontWeight: '500' as const
    };
    
    // Normalize field type to handle case variations
    const fieldType = field.typeChamp?.toUpperCase() || 'TEXT';
    
    // Special handling for Tension Artérielle (Blood Pressure)
    if (isTensionField) {
      // Parse the current value if it exists (format: "systolic / diastolic")
      let systolicValue = '';
      let diastolicValue = '';
      
      if (fieldValue) {
        const parts = fieldValue.split('/');
        if (parts.length === 2) {
          systolicValue = parts[0].trim();
          diastolicValue = parts[1].trim();
        }
      }
      
      // Handle changes to the systolic value
      const handleSystolicChange = (value: string) => {
        const formattedValue = `${value} / ${diastolicValue}`;
        handleInputChange(field.idChamp, formattedValue);
      };
      
      // Handle changes to the diastolic value
      const handleDiastolicChange = (value: string) => {
        const formattedValue = `${systolicValue} / ${value}`;
        handleInputChange(field.idChamp, formattedValue);
      };
      
      return (
        <div className="form-group" key={field.idChamp} style={fieldGroupStyle}>
          <label htmlFor={`field-${field.idChamp}-systolic`} style={labelStyle}>
            {field.nom}
            {field.estObligatoire && <span className="required-marker" style={requiredStyle}>*</span>}
          </label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
                          <input
                type="number"
                id={`field-${field.idChamp}-systolic`}
                value={systolicValue}
                onChange={(e) => handleSystolicChange(e.target.value)}
                placeholder="--.-"
                required={field.estObligatoire}
                className="form-control no-spin-buttons"
              step="any"
              style={{
                ...inputStyle,
                width: 'calc(50% - 10px)',
                textAlign: 'center',
                borderRadius: '6px'
              }}
            />
            <span style={{ 
              margin: '0 10px', 
              fontWeight: 'bold', 
              fontSize: '20px', 
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>/</span>
                          <input
                type="number"
                id={`field-${field.idChamp}-diastolic`}
                value={diastolicValue}
                onChange={(e) => handleDiastolicChange(e.target.value)}
                placeholder="--.-"
                required={field.estObligatoire}
                className="form-control no-spin-buttons"
              step="any"
              style={{
                ...inputStyle,
                width: 'calc(50% - 10px)',
                textAlign: 'center',
                borderRadius: '6px'
              }}
            />
            {field.unite && (
              <span className="input-unit" style={{
                ...unitStyle,
                marginLeft: '10px'
              }}>{field.unite}</span>
            )}
          </div>
        </div>
      );
    }

    switch (fieldType) {
      case 'TEXT':
      case 'VARCHAR':
      case 'CHAR':
      case 'STRING':
        return (
          <div className="form-group" key={field.idChamp} style={fieldGroupStyle}>
            <label htmlFor={`field-${field.idChamp}`} style={labelStyle}>
              {field.nom}
              {field.estObligatoire && <span className="required-marker" style={requiredStyle}>*</span>}
            </label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                id={`field-${field.idChamp}`}
                value={fieldValue}
                onChange={(e) => handleInputChange(field.idChamp, e.target.value)}
                placeholder={field.placeholder || "--"}
                required={field.estObligatoire}
                className="form-control"
                style={inputStyle}
              />
              {field.unite && <span className="input-unit" style={unitStyle}>{field.unite}</span>}
            </div>
          </div>
        );
        
      case 'NUMBER':
      case 'NUMERIC':
      case 'INTEGER':
      case 'FLOAT':
      case 'DOUBLE':
      case 'DECIMAL':
        // Determine if this field likely accepts decimal values based on name or type
        const isDecimalField = 
          field.typeChamp?.toUpperCase() === 'FLOAT' || 
          field.typeChamp?.toUpperCase() === 'DOUBLE' || 
          field.typeChamp?.toUpperCase() === 'DECIMAL' ||
          field.nom.toLowerCase().includes('température') ||
          field.nom.toLowerCase().includes('poids') ||
          field.nom.toLowerCase().includes('taille') ||
          field.nom.toLowerCase().includes('imc');
        
        // Check if this is the IMC field, which should be read-only
        const isIMCField = field.nom.toLowerCase().includes('imc');
        
        return (
          <div className="form-group" key={field.idChamp} style={fieldGroupStyle}>
            <label htmlFor={`field-${field.idChamp}`} style={labelStyle}>
              {field.nom}
              {field.estObligatoire && <span className="required-marker" style={requiredStyle}>*</span>}
            </label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="number"
                id={`field-${field.idChamp}`}
                value={fieldValue}
                onChange={(e) => handleInputChange(field.idChamp, e.target.value)}
                placeholder={isDecimalField ? "--.-" : "--"}
                required={field.estObligatoire}
                className={`form-control no-spin-buttons ${isIMCField ? 'imc-calculated' : ''}`}
                step="any"
                readOnly={isIMCField}
                disabled={isIMCField}
                style={{
                  ...inputStyle,
                  textAlign: 'center',
                  paddingRight: field.unite ? '8px' : '12px',
                  backgroundColor: isIMCField ? '#f5f5f5' : '#fff',
                  border: isIMCField ? '1px dashed #cccccc' : '1px solid #d0d0d0',
                  color: isIMCField ? '#1E513B' : 'inherit',
                  fontWeight: isIMCField ? 600 : 'inherit'
                }}
              />
              {field.unite && (
                <span className="input-unit" style={{
                  ...unitStyle,
                  marginLeft: '10px',
                  backgroundColor: '#fff',
                  padding: '0 10px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '0 6px 6px 0',
                  marginRight: '-1px'
                }}>{field.unite}</span>
              )}
            </div>
          </div>
        );
      
      case 'TEXTAREA':
      case 'TEXT_AREA':
      case 'LONGTEXT':
        return (
          <div className="form-group" key={field.idChamp}>
            <label htmlFor={`field-${field.idChamp}`}>
              {field.nom}
              {field.estObligatoire && <span className="required-marker">*</span>}
            </label>
            <textarea
              id={`field-${field.idChamp}`}
              value={fieldValue}
              onChange={(e) => handleInputChange(field.idChamp, e.target.value)}
              placeholder={field.placeholder || `Entrez ${field.nom.toLowerCase()}`}
              required={field.estObligatoire}
              className="form-control"
              rows={4}
            />
          </div>
        );
        
      case 'CHECKBOX':
      case 'CHECK':
      case 'BOOL':
      case 'BOOLEAN':
        if (field.valeursPossibles) {
          const values = fieldValue ? fieldValue.split(',') : [];
          const options = field.valeursPossibles.split(';').map(opt => {
            const [valeur, libelle] = opt.split('=');
            return { valeur, libelle: libelle || valeur };
          });
          
          return (
            <div className="form-group checkbox-group" key={field.idChamp}>
              <label className="checkbox-group-label">
                {field.nom}
                {field.estObligatoire && <span className="required-marker">*</span>}
              </label>
              <div className="checkbox-options">
                {options.map((option) => (
                  <label className="checkbox-option" key={option.valeur}>
                                          <input
                        type="checkbox"
                        checked={values.includes(option.valeur)}
                        onChange={(e) => handleCheckboxChange(
                          field.idChamp,
                          option.valeur,
                          e.target.checked
                        )}
                      />
                    <span className="checkbox-label">{option.libelle}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        } else {
          // Single checkbox case
          return (
            <div className="form-group single-checkbox" key={field.idChamp}>
              <label className="checkbox-option">
                <input 
                  type="checkbox"
                  checked={fieldValue === 'true' || fieldValue === '1'}
                  onChange={(e) => handleInputChange(field.idChamp, e.target.checked ? 'true' : 'false')}
                />
                <span className="checkbox-label">{field.nom}</span>
                {field.estObligatoire && <span className="required-marker">*</span>}
              </label>
            </div>
          );
        }
        
      case 'RADIO':
      case 'RADIO_BUTTON':
      case 'OPTION':
        if (field.valeursPossibles) {
          const options = field.valeursPossibles.split(';').map(opt => {
            const [valeur, libelle] = opt.split('=');
            return { valeur, libelle: libelle || valeur };
          });
          
          return (
            <div className="form-group radio-group" key={field.idChamp}>
              <label className="radio-group-label">
                {field.nom}
                {field.estObligatoire && <span className="required-marker">*</span>}
              </label>
              <div className="radio-options">
                {options.map((option) => (
                  <label className="radio-option" key={option.valeur}>
                                          <input
                        type="radio"
                        name={`field-${field.idChamp}`}
                        value={option.valeur}
                        checked={fieldValue === option.valeur}
                        onChange={() => handleInputChange(field.idChamp, option.valeur)}
                      />
                    <span className="radio-label">{option.libelle}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        }
        return null;
      
      case 'SELECT':
      case 'DROPDOWN':
      case 'COMBO':
      case 'COMBOBOX':
        if (field.valeursPossibles) {
          const options = field.valeursPossibles.split(';').map(opt => {
            const [valeur, libelle] = opt.split('=');
            return { valeur, libelle: libelle || valeur };
          });
          
          return (
            <div className="form-group" key={field.idChamp}>
              <label htmlFor={`field-${field.idChamp}`}>
                {field.nom}
                {field.estObligatoire && <span className="required-marker">*</span>}
              </label>
              <select
                id={`field-${field.idChamp}`}
                value={fieldValue}
                onChange={(e) => handleInputChange(field.idChamp, e.target.value)}
                required={field.estObligatoire}
                className="form-control"
              >
                <option value="">{field.placeholder || 'Sélectionner...'}</option>
                {options.map((option) => (
                  <option key={option.valeur} value={option.valeur}>
                    {option.libelle}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        return null;
        
      case 'DATE':
      case 'DATETIME':
        return (
          <div className="form-group" key={field.idChamp}>
            <label htmlFor={`field-${field.idChamp}`}>
              {field.nom}
              {field.estObligatoire && <span className="required-marker">*</span>}
            </label>
            <input
              type={fieldType === 'DATETIME' ? 'datetime-local' : 'date'}
              id={`field-${field.idChamp}`}
              value={fieldValue}
              onChange={(e) => handleInputChange(field.idChamp, e.target.value)}
              required={field.estObligatoire}
              className="form-control"
            />
          </div>
        );
    
      // Default case for any other field types - render as text input
      default:
        console.warn('Unknown field type:', field.typeChamp, 'for field:', field.nom, '- rendering as text input');
        return (
          <div className="form-group" key={field.idChamp} style={fieldGroupStyle}>
            <label htmlFor={`field-${field.idChamp}`} style={labelStyle}>
              {field.nom} 
              {field.estObligatoire && <span className="required-marker" style={requiredStyle}>*</span>}
              <small style={{ 
                fontSize: '13px', 
                fontWeight: 'normal', 
                color: '#777',
                marginLeft: '5px'
              }}>(Type: {field.typeChamp})</small>
            </label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                id={`field-${field.idChamp}`}
                value={fieldValue}
                onChange={(e) => handleInputChange(field.idChamp, e.target.value)}
                placeholder={`Entrez ${field.nom.toLowerCase()}`}
                required={field.estObligatoire}
                className="form-control"
                style={inputStyle}
              />
              {field.unite && <span className="input-unit" style={unitStyle}>{field.unite}</span>}
            </div>
          </div>
        );
    }
  };
  
  const renderSections = (sections: SectionFormulaire[]) => {
    return sections.map((section) => (
      <div 
        key={section.idSection} 
        className="form-section"
        ref={(el) => {
          sectionRefs.current[section.idSection] = el;
        }}
        style={{
          marginBottom: '30px',
          padding: '0'
        }}
      >
        <h3 className="section-title" style={{
          margin: '0 0 20px 0',
          color: '#1E513B',
          fontSize: '20px',
          fontWeight: '600',
          paddingBottom: '12px'
        }}>{section.nom}</h3>
        
        <div className="section-fields" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)', // Fixed 2-column layout
          gap: '16px'
        }}>
          {section.champs.map((field) => (
            <div key={field.idChamp} style={{
              padding: '0',
              border: 'none'
            }}>
              {renderField(field)}
            </div>
          ))}
        </div>
        
        {section.sousSections && section.sousSections.length > 0 && (
          <div className="subsections" style={{
            marginTop: '25px',
            marginLeft: '10px',
            paddingLeft: '15px'
          }}>
            {renderSections(section.sousSections)}
          </div>
        )}
      </div>
    ));
  };
  
  return (
    <>
      {/* Custom overlay - visible but doesn't close the form panel when clicked */}
      {isOpen && (
        <div 
          className="sliding-panel-overlay visible" 
          style={{ 
            pointerEvents: 'none',
            zIndex: 998,  // Lower than the form panel's z-index
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            display: 'block'
          }} 
        />
      )}
      
      {/* Sliding panel */}
      <div 
        className={`forms-panel ${isOpen ? 'open' : ''} expanded`} 
        style={{ 
          zIndex: 999,
          backgroundColor: 'white',
          position: 'fixed',  // Fixed position
          top: '60px',        // Match header height
          right: 0,           // Always at the right edge
          width: '50%',       // Exactly 50% width as per requirement
          height: 'calc(100vh - 60px)', // Full height minus header
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)', // Use transform for better performance
          transition: 'transform 0.3s ease',
          boxShadow: '-4px 0 10px rgba(0, 0, 0, 0.1)',
          borderLeft: 0,      // Remove border to avoid extra space
          overflowY: 'hidden', // Changed from auto to hidden for the container
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div className="forms-panel-header" style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#bbbbbb'
        }}>
          <h3 style={{ margin: 0, color: '#000', fontWeight: 500, fontSize: '18px' }}>Signes vitaux et biométrie</h3>
          <button 
            className="panel-close-button" 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#333'
            }}
          >
            <RightArrowIcon />
          </button>
        </div>
        
        <div 
          className="forms-panel-content"
          style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden'
          }}
        >
          {isLoading && (
            <div className="loading-state" style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '100%'
            }}>
              <LoadingSpinner />
              <p style={{ marginTop: '15px', color: '#666' }}>Chargement en cours...</p>
            </div>
          )}
          
          {error && (
            <div className="error-state" style={{
              backgroundColor: '#fff8f8',
              border: '1px solid #ffb6b6',
              borderRadius: '6px',
              padding: '20px',
              margin: '20px 0',
              color: '#d32f2f'
            }}>
              <p style={{ margin: '0 0 15px 0' }}>{error}</p>
              <button className="retry-button" 
                onClick={fetchFormStructure}
                style={{
                  backgroundColor: '#1E513B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Réessayer
              </button>
            </div>
          )}
          
          {!isLoading && !error && formStructure.length > 0 && (
            <div className="form-container" style={{ 
              display: 'flex', 
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              flexDirection: 'column'
            }}>
              {/* Form fields */}
              <div 
                className="form-fields-container" 
                ref={contentRef}
                style={{ 
                  width: '100%',
                  padding: '20px',
                  overflowY: 'auto',
                  backgroundColor: '#fff',
                  flex: 1
                }}
              >
                <div className="form-sections">
                  {renderSections(formStructure)}
                </div>
              </div>
              
              {/* Form action buttons - moved to bottom of form */}
              <div className="form-action-buttons" style={{
                padding: '15px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px solid #e0e0e0',
                backgroundColor: '#fff'
              }}>
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={onClose}
                  disabled={isSubmitting}
                  style={{
                    padding: '12px',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #ddd',
                    color: '#333',
                    borderRadius: '4px',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1,
                    fontWeight: '500',
                    fontSize: '14px',
                    width: '49%',
                    textAlign: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Annuler
                </button>
                <button 
                  type="button" 
                  className="submit-btn" 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  style={{
                    padding: '12px',
                    backgroundColor: '#1E513B',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: '500',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1,
                    fontSize: '14px',
                    width: '49%',
                    textAlign: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isSubmitting ? 'Envoi en cours...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

interface VitalSign {
  idChamp: number;
  nomChamp: string;
  valeur: string;
  unite: string;
  idSection: number;
  nomSection: string;
}

interface VitalSignsForm {
  idFormulaire: number;
  idPatient: string;
  nomPatient: string;
  idModele: number;
  nomModele: string;
  status: string;
  idMedecin: string;
  nomMedecin: string;
  idVisite: number;
  dateRemplissage: string;
  reponses: VitalSign[];
}

interface ReferenceRange {
  min: number;
  max: number;
  criticalMin?: number;
  criticalMax?: number;
}

// Object containing reference ranges for each vital sign
const REFERENCE_RANGES: Record<string, ReferenceRange> = {
  'Tension artérielle': { min: 90, max: 140, criticalMin: 80, criticalMax: 160 }, // Systolic in mmHg
  'Fréquence cardiaque': { min: 60, max: 100, criticalMin: 40, criticalMax: 120 }, // BPM
  'Fréquence respiratoire': { min: 12, max: 20, criticalMin: 8, criticalMax: 25 }, // Breaths per minute
  'SpO2': { min: 95, max: 100, criticalMin: 90 }, // Percentage
  'Température': { min: 36.5, max: 37.5, criticalMin: 35, criticalMax: 39 } // Celsius
};

// Enum for value status
enum ValueStatus {
  NORMAL = 'normal',
  HIGH = 'high',
  LOW = 'low',
  CRITICAL_HIGH = 'critical-high',
  CRITICAL_LOW = 'critical-low',
}

interface VitalSignsBiometricsProps {
  patientIPP: string;
  patientId?: string;
  openForm?: (modelId: number) => void;
  onFormVisibilityChange?: (isVisible: boolean) => void;
  activeVisitId?: number | null;
  getCurrentDoctorId?: () => string | null;
}

const VitalSignsBiometrics = ({ 
  patientIPP, 
  patientId,
  openForm, 
  onFormVisibilityChange,
  activeVisitId,
  getCurrentDoctorId
}: VitalSignsBiometricsProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [vitalSignsForms, setVitalSignsForms] = useState<VitalSignsForm[]>([]);
  const [isFormPanelOpen, setIsFormPanelOpen] = useState<boolean>(false);
  const { showToast } = useToast();
  const [showNoVisitAlert, setShowNoVisitAlert] = useState<boolean>(false);

  // Fetch the vital signs data when the component mounts or patient changes
  useEffect(() => {
    if (patientId) {
      fetchVitalSignsData();
    }
  }, [patientId]);

  // Fetch vital signs data from the API
  const fetchVitalSignsData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetching form submissions for the patient - model ID 1 (Signes vitaux et biométrie)
      const response = await axios.get(`/api/formulaires/patient/${patientId}`);
      
      // Filter for forms where idModele === 1 (Signes vitaux et biométrie)
      const vitalSigns = response.data.filter((form: VitalSignsForm) => form.idModele === 1);
      
      // Sort by dateRemplissage in descending order (newest first)
      const sortedVitalSigns = vitalSigns.sort((a: VitalSignsForm, b: VitalSignsForm) => 
        new Date(b.dateRemplissage).getTime() - new Date(a.dateRemplissage).getTime()
      );

      // Get the 5 most recent submissions
      const recentVitalSigns = sortedVitalSigns.slice(0, 5);
      
      setVitalSignsForms(recentVitalSigns);
    } catch (err: any) {
      console.error('Error fetching vital signs data:', err);
      setError('Erreur lors du chargement des données. Veuillez réessayer.');
      showToast('Impossible de charger les signes vitaux', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Check if the date is today
      const today = new Date();
      const isToday = (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );

      if (isToday) {
        return `Aujourd'hui, ${format(date, 'HH:mm')}`;
      }
      
      // Use a different approach - apply locale formatting directly
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      }) + ', ' + date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Format value with unit
  const formatValue = (value: string, unit?: string) => {
    if (!value || value.trim() === '') return '--';
    return value;
  };

  // Open the biometric form panel
  const handleAddBiometricData = () => {
    if (!activeVisitId) {
      setShowNoVisitAlert(true);
      return;
    }
    
    setIsFormPanelOpen(true);
    if (onFormVisibilityChange) {
      onFormVisibilityChange(true);
    }
  };

  // Close the biometric form panel
  const handleCloseBiometricForm = () => {
    setIsFormPanelOpen(false);
    if (onFormVisibilityChange) {
      onFormVisibilityChange(false);
    }
  };

  // Add a handler to close the no visit alert
  const handleCloseNoVisitAlert = () => {
    setShowNoVisitAlert(false);
  };

  // Group responses by section
  const groupResponsesBySection = (responses: VitalSign[]) => {
    return responses.reduce((grouped, response) => {
      const { idSection, nomSection } = response;
      
      if (!grouped[idSection]) {
        grouped[idSection] = {
          id: idSection,
          name: nomSection,
          responses: []
        };
      }
      
      grouped[idSection].responses.push(response);
      return grouped;
    }, {} as Record<number, { id: number; name: string; responses: VitalSign[] }>);
  };

  // Get the most recent vital signs
  const getLatestVitalSigns = () => {
    if (vitalSignsForms.length === 0) return null;
    return vitalSignsForms[0];
  };

  // Filter vital signs or biometry data
  const filterDataBySection = (data: VitalSignsForm[], sectionId: number) => {
    return data.map(form => {
      const filteredResponses = form.reponses.filter(
        response => response.idSection === sectionId
      );
      return {
        ...form,
        reponses: filteredResponses
      };
    });
  };

  // Get response value by field name
  const getResponseValue = (responses: VitalSign[], fieldName: string) => {
    const response = responses.find(r => r.nomChamp === fieldName);
    return response ? formatValue(response.valeur, response.unite) : '--';
  };

  // Function to check if a value is within normal range and return its status
  const checkValueStatus = (fieldName: string, value: string): { status: ValueStatus, displayValue: string } => {
    if (value === '--' || !REFERENCE_RANGES[fieldName]) {
      return { status: ValueStatus.NORMAL, displayValue: value };
    }

    // Special case for blood pressure which might be in format "120/80" or "120/80 mmHg"
    if (fieldName === 'Tension artérielle') {
      // For TA, we need to check the systolic value to determine status
      // but preserve the original formatted string exactly as-is
      
      // First, get the systolic value for status checking
      let systolic = 0;
      
      // Try to extract the systolic value from the beginning of the string
      if (value.includes('/')) {
        // Match only the first numeric part before the slash
        const match = value.match(/^(\d+(\.\d+)?)/);
        if (match) {
          systolic = parseFloat(match[0]);
        }
      } else if (value !== '--') {
        // If no slash but not empty, try to extract a number
        const match = value.match(/^(\d+(\.\d+)?)/);
        if (match) {
          systolic = parseFloat(match[0]);
        }
      }
      
      // If we couldn't parse a value, return normal status with original value
      if (isNaN(systolic) || systolic === 0) {
        return { status: ValueStatus.NORMAL, displayValue: value };
      }
      
      // Determine status from systolic value but keep the original display value
      let status = ValueStatus.NORMAL;
      let prefix = '';
      
      if (systolic < REFERENCE_RANGES[fieldName].criticalMin!) {
        status = ValueStatus.CRITICAL_LOW;
        prefix = '↓↓ ';
      } else if (systolic < REFERENCE_RANGES[fieldName].min) {
        status = ValueStatus.LOW;
        prefix = '↓ ';
      } else if (systolic > REFERENCE_RANGES[fieldName].criticalMax!) {
        status = ValueStatus.CRITICAL_HIGH;
        prefix = '↑↑ ';
      } else if (systolic > REFERENCE_RANGES[fieldName].max) {
        status = ValueStatus.HIGH;
        prefix = '↑ ';
      }
      
      return { status, displayValue: prefix + value };
    }
    
    // For other metrics, extract value without unit and parse as number
    let numericStr = value;
    // Check if value contains a unit (space followed by characters)
    if (value.includes(' ')) {
      numericStr = value.split(' ')[0]; // Take only the numeric part
    }
    
    const numericValue = parseFloat(numericStr);
    if (isNaN(numericValue)) {
      return { status: ValueStatus.NORMAL, displayValue: value };
    }
    
    const range = REFERENCE_RANGES[fieldName];
    
    // Check for critical ranges first if they exist
    if (range.criticalMin !== undefined && numericValue < range.criticalMin) {
      return { status: ValueStatus.CRITICAL_LOW, displayValue: `↓↓ ${numericStr}` };
    } else if (range.criticalMax !== undefined && numericValue > range.criticalMax) {
      return { status: ValueStatus.CRITICAL_HIGH, displayValue: `↑↑ ${numericStr}` };
    } else if (numericValue < range.min) {
      return { status: ValueStatus.LOW, displayValue: `↓ ${numericStr}` };
    } else if (numericValue > range.max) {
      return { status: ValueStatus.HIGH, displayValue: `↑ ${numericStr}` };
    }
    
    return { status: ValueStatus.NORMAL, displayValue: numericStr };
  };

  // Render vital signs table
  const renderVitalSignsTable = () => {
    if (vitalSignsForms.length === 0) return (
      <div className="empty-state">
        <p>Aucune donnée de signes vitaux disponible.</p>
      </div>
    );

    // Get all forms with vital signs (section ID 1)
    const vitalSignsData = filterDataBySection(vitalSignsForms, 1);

    // Function to get cell styles based on value status
    const getCellStyle = (status: ValueStatus) => {
      let backgroundColor = 'transparent'; // Default background
      let borderColor = '#eaeaea'; // Default border color (light grey)
      
      if (status === ValueStatus.CRITICAL_HIGH || status === ValueStatus.CRITICAL_LOW) {
        // Red Alert - Critically Abnormal
        backgroundColor = '#ffe5e5'; // Light red background
        borderColor = '#ffcccc'; // Slightly darker red border
      } else if (status === ValueStatus.HIGH || status === ValueStatus.LOW) {
        // Orange Alert - Slightly Abnormal
        backgroundColor = '#fff3e0'; // Light orange background
        borderColor = '#ffe0b2'; // Slightly darker orange border
      }
      
      return {
        padding: '12px 16px',
        borderBottom: `1px solid ${borderColor}`,
        borderTop: `1px solid ${borderColor}`,
        color: '#333', // Always black
        backgroundColor: backgroundColor,
        fontSize: '14px'
      };
    };

    return (
      <div className="info-section" style={{
        border: '1px solid #eaeaea',
        borderRadius: '6px',
        overflow: 'hidden',
        marginBottom: '20px',
        backgroundColor: '#fff',
        padding: 0
      }}>
        <h3 style={{
          backgroundColor: '#fff',
          padding: '16px 20px',
          margin: 0,
          fontSize: '20px',
          fontWeight: 600,
          color: '#1E513B',
          borderBottom: '1px solid #eaeaea'
        }}>Signes vitaux</h3>
        <div className="info-table" style={{
          width: '100%',
          overflowX: 'auto',
          padding: '0'
        }}>
          <table className="data-table" style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr>
                <th style={{
                  backgroundColor: '#f5f5f5',
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: 600,
                  color: '#555',
                  fontSize: '14px',
                  borderBottom: '1px solid #eaeaea'
                }}>Date</th>
                <th style={{
                  backgroundColor: '#f5f5f5',
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: 600,
                  color: '#555',
                  fontSize: '14px',
                  borderBottom: '1px solid #eaeaea'
                }}>Température (°C)</th>
                <th style={{
                  backgroundColor: '#f5f5f5',
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: 600,
                  color: '#555',
                  fontSize: '14px',
                  borderBottom: '1px solid #eaeaea'
                }}>TA (mmHg)</th>
                <th style={{
                  backgroundColor: '#f5f5f5',
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: 600,
                  color: '#555',
                  fontSize: '14px',
                  borderBottom: '1px solid #eaeaea'
                }}>Fréquence cardiaque (bpm)</th>
                <th style={{
                  backgroundColor: '#f5f5f5',
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: 600,
                  color: '#555',
                  fontSize: '14px',
                  borderBottom: '1px solid #eaeaea'
                }}>Fréquence respiratoire (rpm)</th>
                <th style={{
                  backgroundColor: '#f5f5f5',
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: 600,
                  color: '#555',
                  fontSize: '14px',
                  borderBottom: '1px solid #eaeaea'
                }}>SpO2 (%)</th>
              </tr>
            </thead>
            <tbody>
              {vitalSignsData.map((form, index) => {
                // Get value status for each vital sign
                const temperatureRaw = form.reponses.find(r => r.nomChamp === 'Température')?.valeur || '--';
                // Get TA value without adding any units - use as is
                const taRaw = form.reponses.find(r => r.nomChamp === 'Tension artérielle')?.valeur || '--';
                
                const fcRaw = form.reponses.find(r => r.nomChamp === 'Fréquence cardiaque')?.valeur || '--';
                const frRaw = form.reponses.find(r => r.nomChamp === 'Fréquence respiratoire')?.valeur || '--';
                const spo2Raw = form.reponses.find(r => r.nomChamp === 'SpO2')?.valeur || '--';
                
                // Check status for each value
                const temperatureStatus = checkValueStatus('Température', temperatureRaw);
                const taStatus = checkValueStatus('Tension artérielle', taRaw);
                const fcStatus = checkValueStatus('Fréquence cardiaque', fcRaw);
                const frStatus = checkValueStatus('Fréquence respiratoire', frRaw);
                const spo2Status = checkValueStatus('SpO2', spo2Raw);
                
                return (
                  <tr key={form.idFormulaire} style={{
                    backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9'
                  }}>
                    <td style={{
                      padding: '12px 16px',
                      paddingLeft: '24px',
                      borderBottom: '1px solid #eaeaea',
                      color: '#333',
                      fontSize: '14px'
                    }}>{formatDate(form.dateRemplissage)}</td>
                    <td style={getCellStyle(temperatureStatus.status)}>
                      {temperatureStatus.displayValue}
                    </td>
                    <td style={getCellStyle(taStatus.status)}>
                      {/* Display TA value as-is without additional formatting */}
                      <span className="text-black">
                        {taStatus.displayValue}
                      </span>
                    </td>
                    <td style={getCellStyle(fcStatus.status)}>
                      {fcStatus.displayValue}
                    </td>
                    <td style={getCellStyle(frStatus.status)}>
                      {frStatus.displayValue}
                    </td>
                    <td style={getCellStyle(spo2Status.status)}>
                      {spo2Status.displayValue}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render biometrics table
  const renderBiometricsTable = () => {
    if (vitalSignsForms.length === 0) return (
      <div className="empty-state">
        <p>Aucune donnée de biométrie disponible.</p>
      </div>
    );

    // Get all forms with biometry data (section ID 2)
    const biometryData = filterDataBySection(vitalSignsForms, 2);

    return (
      <div className="info-section" style={{
        border: '1px solid #eaeaea',
        borderRadius: '6px',
        overflow: 'hidden',
        marginBottom: '20px',
        backgroundColor: '#fff',
        padding: 0
      }}>
        <h3 style={{
          backgroundColor: '#fff',
          padding: '16px 20px',
          margin: 0,
          fontSize: '20px',
          fontWeight: 600,
          color: '#1E513B',
          borderBottom: '1px solid #eaeaea'
        }}>Biométrie</h3>
        <div className="info-table" style={{
          width: '100%',
          overflowX: 'auto',
          padding: '0'
        }}>
          <table className="data-table" style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr>
                <th style={{
                  backgroundColor: '#f5f5f5',
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: 600,
                  color: '#555',
                  fontSize: '14px',
                  borderBottom: '1px solid #eaeaea'
                }}>Date</th>
                <th style={{
                  backgroundColor: '#f5f5f5',
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: 600,
                  color: '#555',
                  fontSize: '14px',
                  borderBottom: '1px solid #eaeaea'
                }}>Poids (kg)</th>
                <th style={{
                  backgroundColor: '#f5f5f5',
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: 600,
                  color: '#555',
                  fontSize: '14px',
                  borderBottom: '1px solid #eaeaea'
                }}>Taille (cm)</th>
                <th style={{
                  backgroundColor: '#f5f5f5',
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: 600,
                  color: '#555',
                  fontSize: '14px',
                  borderBottom: '1px solid #eaeaea'
                }}>IMC (kg/m²)</th>
                <th style={{
                  backgroundColor: '#f5f5f5',
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: 600,
                  color: '#555',
                  fontSize: '14px',
                  borderBottom: '1px solid #eaeaea'
                }}>Périmètre brachial (cm)</th>
              </tr>
            </thead>
            <tbody>
              {biometryData.map((form, index) => (
                <tr key={form.idFormulaire} style={{
                  backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9'
                }}>
                  <td style={{
                    padding: '12px 16px',
                    paddingLeft: '24px',
                    borderBottom: '1px solid #eaeaea',
                    color: '#333',
                    fontSize: '14px'
                  }}>{formatDate(form.dateRemplissage)}</td>
                  <td style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #eaeaea',
                    color: '#333',
                    fontSize: '14px'
                  }}>{getResponseValue(form.reponses, 'Poids')}</td>
                  <td style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #eaeaea',
                    color: '#333',
                    fontSize: '14px'
                  }}>{getResponseValue(form.reponses, 'Taille')}</td>
                  <td style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #eaeaea',
                    color: '#333',
                    fontSize: '14px'
                  }}>{getResponseValue(form.reponses, 'IMC (calc.)')}</td>
                  <td style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #eaeaea',
                    color: '#333',
                    fontSize: '14px'
                  }}>{getResponseValue(form.reponses, 'Périmètre brachial')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <>
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="error-state" style={{
          backgroundColor: '#fff8f8',
          border: '1px solid #ffb6b6',
          borderRadius: '6px',
          padding: '20px',
          margin: '20px 0',
          color: '#d32f2f'
        }}>
          <p style={{ margin: '0 0 15px 0' }}>{error}</p>
          <button className="retry-button" 
            onClick={fetchVitalSignsData}
            style={{
              backgroundColor: '#1E513B',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            Réessayer
          </button>
        </div>
      ) : vitalSignsForms.length === 0 ? (
        <div className="empty-state" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          padding: '40px 20px',
          textAlign: 'center'
        }}>
          <p style={{
            color: '#666',
            marginBottom: '20px',
            fontSize: '16px'
          }}>Aucune donnée disponible. Ajoutez les signes vitaux pour ce patient.</p>
          <button 
            className="add-button"
            onClick={handleAddBiometricData}
            style={{
              backgroundColor: '#1E513B',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              transition: 'background-color 0.2s'
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px' 
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Enregistrer les signes vitaux
            </div>
          </button>
        </div>
      ) : (
        <>
          {/* Tables Section */}
          <div className="vital-signs-tables" style={{
            padding: 0
          }}>
            {renderVitalSignsTable()}
            {renderBiometricsTable()}
          </div>
        </>
      )}
      
      {/* Form Panel */}
      <BiometricFormPanel
        isOpen={isFormPanelOpen}
        onClose={handleCloseBiometricForm}
        patientIPP={patientIPP}
        patientId={patientId}
        activeVisitId={activeVisitId}
        getCurrentDoctorId={getCurrentDoctorId}
        onSubmitSuccess={fetchVitalSignsData}
      />

      {/* Add this component */}
      <NoActiveVisitAlert 
        isOpen={showNoVisitAlert}
        onClose={handleCloseNoVisitAlert}
      />
    </>
  );
};

export default VitalSignsBiometrics;
export { BiometricFormPanel }; 