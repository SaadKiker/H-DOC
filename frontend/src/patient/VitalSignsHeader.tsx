import { useState, useEffect } from 'react';
import axios from '../shared/api/axios';
import { API_ENDPOINTS, getApiUrl } from '../shared/api/api.config';
import './PatientProfile.css';
import { useToast } from '../shared/components/ToastContext';
import { BiometricFormPanel } from './VitalSignsBiometrics';
import NoActiveVisitAlert from '../shared/components/NoActiveVisitAlert';

// Define interfaces for vital signs data
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

interface VitalSignsHeaderProps {
  patientIPP: string;
  patientId?: string;
  openForm?: (modelId: number) => void;
  activeVisitId?: number | null;
  getCurrentDoctorId?: () => string | null;
  onFormVisibilityChange?: (isVisible: boolean) => void;
}

// Define reference ranges for vital signs
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

const VitalSignsHeader = ({ patientIPP, patientId, openForm, activeVisitId, getCurrentDoctorId, onFormVisibilityChange }: VitalSignsHeaderProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [vitalSignsForms, setVitalSignsForms] = useState<VitalSignsForm[]>([]);
  const { showToast } = useToast();
  const [isFormPanelOpen, setIsFormPanelOpen] = useState<boolean>(false);
  const [showNoVisitAlert, setShowNoVisitAlert] = useState<boolean>(false);

  useEffect(() => {
    if (patientId) {
      fetchVitalSignsData();
    } else if (patientIPP) {
      // Fallback to IPP if patientId is not available
      fetchVitalSignsData();
    }
  }, [patientId, patientIPP]);

  // Fetch vital signs data
  const fetchVitalSignsData = async () => {
    if (!patientId && !patientIPP) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Using the same endpoint format as VitalSignsBiometrics which works
      const response = await axios.get(`/api/formulaires/patient/${patientId || patientIPP}`);
      console.log('Vital signs data response:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        // Filter for forms where idModele === 1 (Signes vitaux et biométrie)
        const vitalSigns = response.data.filter((form: VitalSignsForm) => form.idModele === 1);
        
        // Sort by date (newest first)
        const sortedData = vitalSigns.sort((a: VitalSignsForm, b: VitalSignsForm) => {
          return new Date(b.dateRemplissage).getTime() - new Date(a.dateRemplissage).getTime();
        });
        
        setVitalSignsForms(sortedData);
      } else {
        console.warn('Unexpected response format from vital signs API:', response.data);
        setVitalSignsForms([]);
      }
    } catch (err: any) {
      console.error('Error fetching vital signs data:', err);
      setError('Impossible de charger les données. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format value with unit
  const formatValue = (value: string, unit?: string) => {
    if (!value) return '--';
    return unit ? `${value} ${unit}` : value;
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
        return `Aujourd'hui, ${date.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
      }
      
      // Format date for non-today dates
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

  // Handle adding new vital signs data - directly open the local form panel
  const handleAddBiometricData = () => {
    // Check if there's an active visit
    if (!activeVisitId) {
      // No active visit, show the alert
      setShowNoVisitAlert(true);
      return;
    }
    
    // Has active visit, proceed as normal
    setIsFormPanelOpen(true);
    
    // Notify parent component that form is open
    if (onFormVisibilityChange) {
      onFormVisibilityChange(true);
    }
  };

  // Close the biometric form panel
  const handleCloseBiometricForm = () => {
    setIsFormPanelOpen(false);
    
    // Notify parent component that form is closed
    if (onFormVisibilityChange) {
      onFormVisibilityChange(false);
    }
  };

  // Add a handler to close the no visit alert
  const handleCloseNoVisitAlert = () => {
    setShowNoVisitAlert(false);
  };

  // Get the most recent vital signs
  const getLatestVitalSigns = () => {
    if (vitalSignsForms.length === 0) return null;
    return vitalSignsForms[0];
  };

  // Get response value by field name
  const getResponseValue = (responses: VitalSign[], fieldName: string) => {
    const response = responses.find(r => r.nomChamp === fieldName);
    // For Tension artérielle specifically, don't add the unit - we'll handle it specially in the UI
    if (fieldName === 'Tension artérielle') {
      return response ? response.valeur : '--';
    }
    return response ? formatValue(response.valeur, response.unite) : '--';
  };

  // Function to separate value and unit for styling
  const formatValueForDisplay = (valueWithUnit: string) => {
    if (valueWithUnit === '--') return { value: '--', unit: '' };
    
    // Special case for blood pressure values with slashes - DON'T MODIFY THEM
    if (valueWithUnit.includes('/')) {
      // Return the entire string as value, no unit
      return { value: valueWithUnit, unit: '' };
    }
    
    // For values that already have units (e.g., "37 °C")
    const matches = valueWithUnit.match(/^([\d./]+)\s*(.*)$/);
    if (matches && matches.length >= 3) {
      return { 
        value: matches[1].trim(), 
        unit: matches[2].trim() 
      };
    }
    
    return { value: valueWithUnit, unit: '' };
  };

  // Function to check if a value is within normal range and return its status
  const checkValueStatus = (fieldName: string, value: string): { status: ValueStatus, displayValue: string } => {
    if (value === '--' || !REFERENCE_RANGES[fieldName]) {
      return { status: ValueStatus.NORMAL, displayValue: value };
    }

    // Special case for blood pressure which might be in format "120/80 mmHg"
    if (fieldName === 'Tension artérielle') {
      // For TA, extract only the systolic value for status checking
      // but preserve the original value for display
      let systolic = 0;
      
      // Extract the systolic value (first number before slash)
      if (value.includes('/')) {
        const parts = value.split('/');
        systolic = parseFloat(parts[0].trim());
      } else {
        // If no slash, try to parse the whole value
        systolic = parseFloat(value);
      }
      
      // If we couldn't parse a value, return normal status with original value
      if (isNaN(systolic) || systolic === 0) {
        return { status: ValueStatus.NORMAL, displayValue: value };
      }
      
      // Determine status from systolic value but keep the original value for display
      if (systolic < REFERENCE_RANGES[fieldName].criticalMin!) {
        return { status: ValueStatus.CRITICAL_LOW, displayValue: `↓↓ ${value}` };
      } else if (systolic < REFERENCE_RANGES[fieldName].min) {
        return { status: ValueStatus.LOW, displayValue: `↓ ${value}` };
      } else if (systolic > REFERENCE_RANGES[fieldName].criticalMax!) {
        return { status: ValueStatus.CRITICAL_HIGH, displayValue: `↑↑ ${value}` };
      } else if (systolic > REFERENCE_RANGES[fieldName].max) {
        return { status: ValueStatus.HIGH, displayValue: `↑ ${value}` };
      }
      
      return { status: ValueStatus.NORMAL, displayValue: value };
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

  // Render the overview cards
  const renderOverviewCards = () => {
    const latestData = getLatestVitalSigns();
    if (!latestData) return null;

    const responses = latestData.reponses;
    
      // Key vital signs to display in the overview
  const overviewItems = [
    { name: 'Tension artérielle', shortName: 'Tension artérielle', id: 'tension', isVitalSign: true, specialFormat: true },
    { name: 'Fréquence cardiaque', shortName: 'Fréquence cardiaque', id: 'frequence-cardiaque', isVitalSign: true },
    { name: 'Fréquence respiratoire', shortName: 'Fréquence respiratoire', id: 'frequence-respiratoire', isVitalSign: true },
    { name: 'SpO2', shortName: 'SpO2', id: 'spo2', isVitalSign: true },
    { name: 'Poids', shortName: 'Poids', id: 'poids', isVitalSign: false },
    { name: 'Taille', shortName: 'Taille', id: 'taille', isVitalSign: false },
    { name: 'IMC (calc.)', shortName: 'IMC (calc.)', id: 'imc', isVitalSign: false },
    { name: 'Périmètre brachial', shortName: 'Périmètre brachial', id: 'perimetre', isVitalSign: false }
  ];

    return (
      <div className="vital-signs-metrics-row">
        {overviewItems.map(item => {
          const rawValue = getResponseValue(responses, item.name);
          const { value, unit } = formatValueForDisplay(rawValue);
          
          // Only check value status for vital signs, not biometrics
          const { status, displayValue } = item.isVitalSign 
            ? checkValueStatus(item.name, value) 
            : { status: ValueStatus.NORMAL, displayValue: value };
          
          // Get styling based on status
          let backgroundColor = 'rgba(30, 81, 59, 0.05)'; // Default background
          
          if (status === ValueStatus.CRITICAL_HIGH || status === ValueStatus.CRITICAL_LOW) {
            // Red Alert - Critically Abnormal
            backgroundColor = '#ffe5e5'; // Light red background
          } else if (status === ValueStatus.HIGH || status === ValueStatus.LOW) {
            // Orange Alert - Slightly Abnormal
            backgroundColor = '#fff3e0'; // Light orange background
          }
          
          return (
            <div 
              key={item.id} 
              className="vital-sign-inline-item"
              style={{
                backgroundColor: item.isVitalSign ? backgroundColor : 'rgba(30, 81, 59, 0.05)'
              }}
            >
              <span className="vital-sign-label">{item.shortName}</span>
              <span className="vital-sign-value-inline">
                {item.specialFormat && item.name === 'Tension artérielle' ? (
                  // Ultra-simple formatting for Tension artérielle - use value exactly as stored
                  (() => {
                    const taValue = item.isVitalSign ? displayValue : value;
                    
                    // Check if it's missing a value
                    if (taValue === '--') return <span className="vital-sign-number">--</span>;
                    
                    // Display the entire value as-is, with mmHg as a separate span
                    return (
                      <>
                        <span className="vital-sign-number">{taValue}</span>
                        <span className="vital-sign-unit">mmHg</span>
                      </>
                    );
                  })()
                ) : (
                  // Standard formatting for other values
                  <>
                    <span 
                      className="vital-sign-number"
                      style={{ 
                        color: '#333', // Always black
                      }}
                    >
                      {item.isVitalSign ? displayValue : value}
                    </span>
                    {unit && <span className="vital-sign-unit">{unit}</span>}
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="loading-spinner-container">
      <div className="loading-spinner"></div>
    </div>
  );

  return (
    <div className="vital-signs-header-container">
      <div className="vital-signs-header-top">
        <h3 className="vital-signs-section-title">
          Signes vitaux et biométrie
          {vitalSignsForms.length > 0 && (
            <span style={{ 
              fontWeight: 400, 
              color: '#666',
              marginLeft: '8px',
              fontSize: '14px'
            }}>
              — {formatDate(vitalSignsForms[0].dateRemplissage)}
            </span>
          )}
        </h3>
        <button 
          className="add-vitals-button"
          onClick={handleAddBiometricData}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Enregistrer les signes vitaux
        </button>
      </div>
      
      <div className="vital-signs-content">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button className="retry-button" onClick={fetchVitalSignsData}>
              Réessayer
            </button>
          </div>
        ) : vitalSignsForms.length === 0 ? (
          <div className="no-vitals-message">
            Aucune donnée de signes vitaux disponible.
          </div>
        ) : (
          renderOverviewCards()
        )}
      </div>

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
    </div>
  );
};

export default VitalSignsHeader; 