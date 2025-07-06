import React, { useState, useEffect, useCallback, useRef } from 'react';
import { API_ENDPOINTS } from '../shared/api/api.config';
import './AllergiesTable.css';

interface Allergy {
  idAllergie: number;
  idPatient: string;
  allergene: string;
  typeAllergie: string | null;
  gravite: string;
  reaction: string;  // Backend returns single string, comma-separated
  remarques: string | null;
  createdAt: string;
}

interface APIResponse {
  success: boolean;
  message: string;
  allergies: Allergy[];
}

interface AllergiesTableProps {
  patientId: string;
  refreshTrigger?: number;
}

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

const AllergiesTable: React.FC<AllergiesTableProps> = ({ 
  patientId,
  refreshTrigger = 0
}) => {
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  
  // Reference to the dropdown menu for detecting outside clicks
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchAllergies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(API_ENDPOINTS.ALLERGIES.GET_BY_PATIENT(patientId));
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `Error: ${response.status}`;
        console.error('API Error:', errorData);
        throw new Error(errorMessage);
      }
      
      const data: APIResponse = await response.json();
      
      if (data.success && Array.isArray(data.allergies)) {
        setAllergies(data.allergies);
      } else {
        console.error('Unexpected API response format:', data);
        setAllergies([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching allergies:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des allergies');
      setLoading(false);
    }
  }, [patientId]);

  // Initial fetch and refresh when dependencies change
  useEffect(() => {
    if (patientId) {
      fetchAllergies();
    }
  }, [patientId, refreshTrigger, retryCount, fetchAllergies]);

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

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const toggleMenu = (allergyId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent any parent event handlers
    if (activeMenu === allergyId) {
      setActiveMenu(null);
    } else {
      setActiveMenu(allergyId);
    }
  };

  const handleDeleteAllergy = async (allergyId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent any parent event handlers
    
    try {
      const response = await fetch(API_ENDPOINTS.ALLERGIES.DELETE(allergyId), {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Error: ${response.status}`);
      }
      
      // Remove the deleted allergy from the state
      setAllergies(prevAllergies => prevAllergies.filter(allergy => allergy.idAllergie !== allergyId));
      
      // Close the menu
      setActiveMenu(null);
    } catch (err) {
      console.error('Error deleting allergy:', err);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <p>
          <strong>Problème de serveur:</strong> {error}
        </p>
        <p className="error-details">
          Le serveur a rencontré un problème technique. L'équipe est informée et travaille sur la résolution.
        </p>
        <button 
          className="retry-button" 
          onClick={handleRetry}
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (allergies.length === 0) {
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
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <p>Aucune allergie enregistrée pour le moment</p>
      </div>
    );
  }

  return (
    <div className="allergies-table-container">
      <table className="allergies-table">
        <thead>
          <tr>
            <th>Allergène</th>
            <th>Type d'allergie</th>
            <th>Gravité</th>
            <th>Réaction(s)</th>
            <th>Remarques</th>
            <th style={{ width: '50px' }}></th> {/* Column for actions menu */}
          </tr>
        </thead>
        <tbody>
          {allergies.map((allergy) => (
            <tr key={allergy.idAllergie} className="allergy-row">
              <td>{allergy.allergene || "—"}</td>
              <td>{allergy.typeAllergie || "—"}</td>
              <td>{allergy.gravite || "—"}</td>
              <td>{allergy.reaction || "—"}</td>
              <td>{allergy.remarques || "—"}</td>
              <td className="actions-cell">
                <div className="three-dots-menu-container" ref={activeMenu === allergy.idAllergie ? menuRef : null}>
                  {activeMenu === allergy.idAllergie && (
                    <div className="dropdown-menu">
                      <button 
                        className="dropdown-item delete-item"
                        onClick={(e) => handleDeleteAllergy(allergy.idAllergie, e)}
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                  <button 
                    className="three-dots-button"
                    onClick={(e) => toggleMenu(allergy.idAllergie, e)}
                    aria-label="Options"
                  >
                    <ThreeDotsIcon />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AllergiesTable; 