import React, { useState, useEffect } from 'react';
import axios from '../shared/api/axios';
import { API_ENDPOINTS } from '../shared/api/api.config';
import { useToast } from '../shared/components/ToastContext';
import './FacturesTable.css';

interface Facture {
  idFacture: number;
  idPatient: string;
  idVisite: number;
  montant: number;
  modePaiement: string;
  status: string;
  dateFacturation: string;
  pdfUrl?: string;
}

interface FacturesTableProps {
  patientId: string;
}

const FacturesTable: React.FC<FacturesTableProps> = ({ patientId }) => {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchFactures = async () => {
      try {
        setLoading(true);
        const response = await axios.get(API_ENDPOINTS.FACTURES.GET_BY_PATIENT(patientId));
        console.log('Factures response data:', response.data);
        
        // Check for pdfUrl in the response data
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          console.log('Sample facture:', response.data[0]);
          if (response.data[0].pdfUrl) {
            console.log('PDF URL exists in the response:', response.data[0].pdfUrl);
          } else {
            console.log('PDF URL is missing in the response');
          }
        }
        
        // Sort factures by creation date (most recent first)
        const sortedFactures = response.data.sort((a: any, b: any) => {
          const dateA = new Date(a.dateFacturation || 0);
          const dateB = new Date(b.dateFacturation || 0);
          return dateB.getTime() - dateA.getTime();
        });
        
        setFactures(sortedFactures);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des factures:', err);
        setError('Erreur lors du chargement des factures');
        setLoading(false);
      }
    };

    if (patientId) {
      fetchFactures();
    }
  }, [patientId]);

  const formatDate = (dateString: string): string => {
    if (!dateString) {
      return '--/--/---- --:--';
    }
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '--/--/---- --:--';
      }
      
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return '--/--/---- --:--';
    }
  };

  const formatMontant = (montant: number): string => {
    return `${montant.toFixed(2)} MAD`;
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

  if (factures.length === 0) {
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
          <rect x="2" y="2" width="20" height="20" rx="2"></rect>
          <line x1="7" y1="8" x2="17" y2="8"></line>
          <line x1="7" y1="12" x2="17" y2="12"></line>
          <line x1="7" y1="16" x2="13" y2="16"></line>
        </svg>
        <p>Aucune facture disponible pour ce patient.</p>
      </div>
    );
  }

  return (
    <div className="factures-table-container">
      <table className="factures-table">
        <thead>
          <tr>
            <th>Date de facturation</th>
            <th>Montant</th>
            <th>Méthode de paiement</th>
            <th>Statut</th>
            <th>Fichier</th>
          </tr>
        </thead>
        <tbody>
          {factures.map((facture) => (
            <tr key={facture.idFacture} className="facture-row">
              <td>{formatDate(facture.dateFacturation)}</td>
              <td>{formatMontant(facture.montant)}</td>
              <td>{facture.modePaiement}</td>
              <td>{facture.status || 'Payé'}</td>
              <td>
                {facture.pdfUrl && facture.pdfUrl.trim() !== '' ? (
                  <a 
                    href={facture.pdfUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="voir-pdf-link"
                  >
                    Voir PDF
                  </a>
                ) : (
                  <i className="no-pdf">Non disponible</i>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FacturesTable; 