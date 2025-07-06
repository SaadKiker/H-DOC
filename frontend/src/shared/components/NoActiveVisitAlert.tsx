import React, { useState } from 'react';

interface NoActiveVisitAlertProps {
  isOpen: boolean;
  onClose: () => void;
}

const NoActiveVisitAlert: React.FC<NoActiveVisitAlertProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <h3>Visite requise</h3>
          </div>
          <button className="close-modal-button" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <p>Vous devez démarrer une visite avec ce patient pour accéder à cette fonctionnalité.</p>
        </div>
        <div className="modal-footer">
          <button className="submit-btn" onClick={onClose} style={{ width: '100%' }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoActiveVisitAlert; 