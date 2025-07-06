import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { API_ENDPOINTS } from '../shared/api/api.config';
import axios from 'axios';
import './OrdonnancesTable.css';

// Interfaces for typing data from the API
interface Prescription {
  idPrescription: number;
  id_prescription?: number;
  medicament: {
    nom: string;
  };
  dosage: string;
  unite?: string;
  unite_dosage?: string;
  route?: string;
  voie?: string;
  frequence: string;
  duree: string;
  unite_duree?: string;
  duree_unite?: string;
}

interface Ordonnance {
  // Allow both naming conventions from the API
  idOrdonnance?: string;
  id_ordonnance?: string;
  dateCreation?: string;
  date_creation?: string;
  medecin?: {
    nom: string;
    prenom: string;
  };
  nom_medecin?: string;
  prenom_medecin?: string;
  statut?: string;
  url?: string;
  prescriptions: Prescription[];
}

// Chevron icon component
const ChevronIcon = ({ isExpanded }: { isExpanded?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ 
      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.2s ease'
    }}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

// Three dots menu icon component
const ThreeDotsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="three-dots-icon"
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

// Warning icon for the confirmation modal
const WarningIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#f59e0b"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

// Close icon for the confirmation modal
const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// Confirmation modal component
interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }: ConfirmationModalProps) => {
  if (!isOpen) return null;
  
  // Use React Portal to render the modal at the document body level
  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">
            <WarningIcon />
            <h3>{title}</h3>
          </div>
          <button className="close-modal-button" onClick={onCancel}>
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onCancel}>Annuler</button>
          <button className="submit-btn" onClick={onConfirm}>Confirmer</button>
        </div>
      </div>
    </div>,
    document.body // Mount the portal on the document body
  );
};

interface OrdonnancesTableProps {
  patientId: string;
  onHasInProgressOrdonnance?: (hasInProgress: boolean) => void;
  refreshTrigger?: number;
  userRole?: string;
}

const OrdonnancesTable: React.FC<OrdonnancesTableProps> = ({ 
  patientId,
  onHasInProgressOrdonnance,
  refreshTrigger = 0,
  userRole
}) => {
  const [ordonnances, setOrdonnances] = useState<Ordonnance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    ordonnanceId: '',
    title: '',
    message: ''
  });
  
  // Reference to the dropdown menu for detecting outside clicks
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchOrdonnances = async () => {
      try {
        setLoading(true);
        const response = await axios.get(API_ENDPOINTS.ORDONNANCES.GET_BY_PATIENT(patientId));
        console.log("Ordonnances API response:", response.data);
        
        // Debug log to check statuses
        if (response.data && Array.isArray(response.data)) {
          console.log("Ordonnances statuses:", response.data.map(ord => ({
            id: ord.idOrdonnance || ord.id_ordonnance,
            status: ord.statut
          })));
        }
        
        setOrdonnances(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching ordonnances:', err);
        setError('Erreur lors du chargement des ordonnances');
        setLoading(false);
      }
    };

    if (patientId) {
      fetchOrdonnances();
    }
  }, [patientId, refreshTrigger]);

  // Add an effect to handle clicks outside of the menu
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Check for in-progress ordonnances and notify parent component
  useEffect(() => {
    if (onHasInProgressOrdonnance && ordonnances.length > 0) {
      const hasInProgress = ordonnances.some(ord => {
        const status = ord.statut?.toLowerCase() || '';
        
        // Only return true if the ordonnance has at least one prescription
        return (status === 'en_cours' || status === 'in_progress') && 
               ord.prescriptions && 
               ord.prescriptions.length > 0;
      });
      
      onHasInProgressOrdonnance(hasInProgress);
    } else if (onHasInProgressOrdonnance) {
      // If there are no ordonnances at all, make sure to set the flag to false
      onHasInProgressOrdonnance(false);
    }
  }, [ordonnances, onHasInProgressOrdonnance]);

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) {
      return '--/--/----';
    }
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '--/--/----';
      }
      
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return '--/--/----';
    }
  };

  const formatReference = (ordonnance: Ordonnance): string => {
    const id = ordonnance.id_ordonnance || ordonnance.idOrdonnance;
    return id ? `ORD-${id}` : 'ORD-?';
  };

  const getOrderId = (ordonnance: Ordonnance): string => {
    return (ordonnance.id_ordonnance || ordonnance.idOrdonnance || '').toString();
  };

  const getOrderDate = (ordonnance: Ordonnance): string | undefined => {
    return ordonnance.date_creation || ordonnance.dateCreation;
  };

  const getDoctorName = (ordonnance: Ordonnance): string => {
    // Check for both formats of doctor info
    if (ordonnance.medecin?.prenom && ordonnance.medecin?.nom) {
      return `Dr. ${ordonnance.medecin.prenom} ${ordonnance.medecin.nom}`;
    } else if (ordonnance.prenom_medecin && ordonnance.nom_medecin) {
      return `Dr. ${ordonnance.prenom_medecin} ${ordonnance.nom_medecin}`;
    }
    return 'Médecin non spécifié';
  };

  const toggleRowExpansion = (ordonnanceId: string, event: React.MouseEvent) => {
    // Don't toggle when clicking the PDF link button or the three dots menu
    if ((event.target as HTMLElement).closest('.voir-pdf-button') || 
        (event.target as HTMLElement).closest('.three-dots-menu-container')) {
      return;
    }
    
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(ordonnanceId)) {
      newExpandedRows.delete(ordonnanceId);
    } else {
      newExpandedRows.add(ordonnanceId);
    }
    setExpandedRows(newExpandedRows);
  };

  const openPdfInNewTab = (url: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row expansion
    if (url) {
      window.open(url, '_blank');
    }
  };

  const toggleMenu = (ordonnanceId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row expansion
    if (activeMenu === ordonnanceId) {
      setActiveMenu(null);
    } else {
      setActiveMenu(ordonnanceId);
    }
  };

  const openDeleteConfirmation = (ordonnanceId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row expansion
    setConfirmationModal({
      isOpen: true,
      ordonnanceId: ordonnanceId,
      title: 'Supprimer l\'ordonnance',
      message: 'Êtes-vous sûr de vouloir supprimer cette ordonnance ? Cette action est irréversible.'
    });
    setActiveMenu(null); // Close the dropdown menu
  };

  const closeConfirmationModal = () => {
    setConfirmationModal(prev => ({ ...prev, isOpen: false }));
  };

  const confirmDeleteOrdonnance = async () => {
    try {
      await axios.delete(API_ENDPOINTS.ORDONNANCES.DELETE(confirmationModal.ordonnanceId));
      // Remove the deleted ordonnance from the local state
      setOrdonnances(prevOrdonnances => 
        prevOrdonnances.filter(ord => 
          getOrderId(ord) !== confirmationModal.ordonnanceId
        )
      );
    } catch (err) {
      console.error('Error deleting ordonnance:', err);
      // Show error notification (using the app's approach)
      alert('Erreur lors de la suppression de l\'ordonnance');
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'finalisée':
      case 'finalisee':
      case 'finalized':
      case 'finalise':
        return 'Finalisée';
      case 'en_cours':
      case 'in_progress':
        return 'En cours';
      default:
        return status;
    }
  };

  const formatMedicationDetails = (prescription: Prescription): React.ReactNode => {
    const medicament = prescription.medicament?.nom || 'Non spécifié';
    
    // Format dosage with unit - handle all naming conventions
    let dosageWithUnit;
    if (prescription.dosage) {
      if (prescription.unite_dosage) {
        dosageWithUnit = `${prescription.dosage} ${prescription.unite_dosage}`;
      } else if (prescription.unite) {
        dosageWithUnit = `${prescription.dosage} ${prescription.unite}`;
      } else {
        dosageWithUnit = prescription.dosage;
      }
    } else {
      dosageWithUnit = 'Non spécifié';
    }
    
    // Handle both naming conventions for administration route
    const voie = prescription.route || prescription.voie || 'Non spécifié';
    
    const frequence = prescription.frequence || 'Non spécifié';
    
    // Format duration with unit - explicitly handle spacing and check for both field names
    let dureeWithUnit;
    if (prescription.duree) {
      if (prescription.unite_duree) {
        dureeWithUnit = `${prescription.duree} ${prescription.unite_duree}`;
      } else if (prescription.duree_unite) {
        dureeWithUnit = `${prescription.duree} ${prescription.duree_unite}`;
      } else {
        dureeWithUnit = prescription.duree;
      }
    } else {
      dureeWithUnit = 'Non spécifié';
    }
      
    return (
      <>
        <strong>{medicament}</strong> – {dosageWithUnit} – {voie} – {frequence} – {dureeWithUnit}
      </>
    );
  };

  const isFinalized = (ordonnance: Ordonnance): boolean => {
    // Check if the ordonnance status is finalized in any of the possible formats
    const status = ordonnance.statut?.toLowerCase() || '';
    // Include all possible variations of "finalized" status
    return status === 'finalisée' || 
           status === 'finalisee' || 
           status === 'finalized' ||
           status === 'finalise';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // Filter ordonnances to only show finalized ones
  const finalizedOrdonnances = ordonnances.filter(isFinalized);
  
  // Debug log to see what's being filtered
  console.log("All ordonnances count:", ordonnances.length);
  console.log("Finalized ordonnances count:", finalizedOrdonnances.length);
  console.log("Filtered out ordonnances:", ordonnances.filter(o => !isFinalized(o)).map(o => ({
    id: o.idOrdonnance || o.id_ordonnance,
    status: o.statut
  })));

  if (finalizedOrdonnances.length === 0) {
    return (
      <div className="empty-state">
        <br />
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="48" 
          height="48" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#aaa" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="8" y1="13" x2="16" y2="13"></line>
          <line x1="8" y1="17" x2="16" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <p>Aucune ordonnance finalisée disponible pour le moment</p>
        <p className="empty-state-sub-text">Seules les ordonnances finalisées sont affichées dans cette table</p>
      </div>
    );
  }

  return (
    <>
      <div className="ordonnances-table-container">
        <table className="ordonnances-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}></th>
              <th>Numéro de référence</th>
              <th>Date de prescription</th>
              <th>Prescrit par</th>
              <th>Fichier</th>
              {userRole === 'MEDECIN' && (
                <th style={{ width: '50px' }}></th> /* Column for actions menu - doctors only */
              )}
            </tr>
          </thead>
          <tbody>
            {finalizedOrdonnances.map((ordonnance) => {
              const orderId = getOrderId(ordonnance);
              return (
              <React.Fragment key={orderId}>
                <tr 
                  className={`ordonnance-row ${expandedRows.has(orderId) ? 'expanded' : ''}`}
                  onClick={(e) => toggleRowExpansion(orderId, e)}
                >
                  <td className="chevron-cell">
                    <ChevronIcon isExpanded={expandedRows.has(orderId)} />
                  </td>
                  <td>{formatReference(ordonnance)}</td>
                  <td>{formatDate(getOrderDate(ordonnance))}</td>
                  <td>{getDoctorName(ordonnance)}</td>
                  <td>
                    {ordonnance.url && (
                      <button 
                        className="voir-pdf-button"
                        onClick={(e) => openPdfInNewTab(ordonnance.url || '', e)}
                      >
                        voir
                      </button>
                    )}
                  </td>
                  {userRole === 'MEDECIN' && (
                    <td className="actions-cell">
                      <div className="three-dots-menu-container" ref={activeMenu === orderId ? menuRef : null}>
                        <button 
                          className="three-dots-button"
                          onClick={(e) => toggleMenu(orderId, e)}
                          aria-label="Options"
                        >
                          <ThreeDotsIcon />
                        </button>
                        {activeMenu === orderId && (
                          <div className="dropdown-menu">
                            <button 
                              className="dropdown-item delete-item"
                              onClick={(e) => openDeleteConfirmation(orderId, e)}
                            >
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
                {expandedRows.has(orderId) && (
                  <tr className="prescriptions-row">
                    <td colSpan={userRole === 'MEDECIN' ? 6 : 5}>
                      <div className="prescriptions-container">
                        <h4>Médicaments prescrits</h4>
                        {!ordonnance.prescriptions || ordonnance.prescriptions.length === 0 ? (
                          <p className="no-prescriptions">Aucun médicament prescrit</p>
                        ) : (
                          <div className="prescriptions-list">
                            {ordonnance.prescriptions.map((prescription) => (
                              <div key={prescription.idPrescription} className="prescription-item">
                                {formatMedicationDetails(prescription)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )})}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onConfirm={confirmDeleteOrdonnance}
        title={confirmationModal.title}
        message={confirmationModal.message}
        onCancel={closeConfirmationModal}
      />
    </>
  );
};

export default OrdonnancesTable; 