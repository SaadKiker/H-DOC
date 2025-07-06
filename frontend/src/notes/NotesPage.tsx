import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotesPage.css';

// Back Arrow Icon
const BackArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5"></path>
    <path d="M12 19l-7-7 7-7"></path>
  </svg>
);

// User Management Icon
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

// Specialties Management Icon
const SpecialtyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
    <path d="M12 8v8"></path>
    <path d="M8 12h8"></path>
  </svg>
);

// Forms Management Icon
const FormIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const NotesPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard'); // Redirect to dashboard instead of previous page
  };

  const navigateToUserManagement = () => {
    navigate('/admin/users');
  };

  const navigateToSpecialtiesManagement = () => {
    navigate('/admin/specialties');
  };

  const navigateToFormsManagement = () => {
    navigate('/medical-forms');
  };

  return (
    <div className="notes-page">
      <div className="notes-header">
        <button className="back-button" onClick={handleBack} aria-label="Retour">
          <BackArrowIcon />
          <span>Retour</span>
        </button>
      </div>
      <div className="notes-content">
        <div className="admin-buttons-container">
          <button className="admin-button" onClick={navigateToUserManagement}>
            <UserIcon />
            <span>Gérer les utilisateurs</span>
          </button>
          <button className="admin-button" onClick={navigateToSpecialtiesManagement}>
            <SpecialtyIcon />
            <span>Gérer les spécialités</span>
          </button>
          <button className="admin-button" onClick={navigateToFormsManagement}>
            <FormIcon />
            <span>Gérer les formulaires</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotesPage; 