import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UsersManagementPage.css';

// Define User interface
interface User {
  idUtilisateur?: string;
  id?: number;
  utilisateurId?: number;
  identifiant?: string;
  username?: string;
  email?: string;
  role?: string;
  nom?: string;
  prenom?: string;
  dateCreation?: string;
  dateModification?: string;
  actif?: boolean;
  estDesactive?: boolean;
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

// Add User Icon
const AddUserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="8.5" cy="7" r="4"></circle>
    <line x1="20" y1="8" x2="20" y2="14"></line>
    <line x1="23" y1="11" x2="17" y2="11"></line>
  </svg>
);

// Search Icon
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

// Loading Icon
const LoadingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotating-icon">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
  </svg>
);

const UsersManagementPage: React.FC = () => {
  const navigate = useNavigate();
  
  // State for form inputs
  const [searchTerm, setSearchTerm] = useState('');
  const [userType, setUserType] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  
  // State for API results
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleBack = () => {
    navigate('/notes'); // Navigate to the NotesPage
  };

  // Function to extract users array from API response
  const extractUsersFromResponse = (response: any): User[] => {
    // Log the response to see its structure
    console.log('API Response:', response);
    
    // Check if response is an array directly
    if (Array.isArray(response)) {
      console.log('Response is an array with length:', response.length);
      return response;
    }
    
    // Check common response patterns
    if (response && typeof response === 'object') {
      // Look for common property names that might contain the users array
      const possibleArrayProps = ['data', 'content', 'items', 'users', 'utilisateurs', 'results', 'result'];
      
      for (const prop of possibleArrayProps) {
        if (Array.isArray(response[prop])) {
          console.log(`Found users array in response.${prop} with length:`, response[prop].length);
          return response[prop];
        }
      }
      
      // If we can't find any array in common properties, check all properties
      for (const key in response) {
        if (Array.isArray(response[key])) {
          console.log(`Found users array in response.${key} with length:`, response[key].length);
          return response[key];
        }
      }
    }
    
    // If we can't find an array, return an empty array
    console.error('Could not find users array in API response:', response);
    return [];
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      // Determine which API endpoint to call based on the includeInactive checkbox
      const endpoint = includeInactive ? '/api/utilisateurs' : '/api/utilisateurs/actifs';
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const rawData = await response.json();
      console.log('Raw API response:', rawData);
      
      // Extract the users array from the response
      let usersData = extractUsersFromResponse(rawData);
      
      // Log raw user data before modification
      console.log('Raw users data (before status mapping):', 
        usersData.map(u => ({ id: u.id, nom: u.nom, actif: u.actif, estDesactive: u.estDesactive })));
      
      // Ensure user status properties are consistent
      usersData = usersData.map(user => {
        // Create new user object with processed status
        const updatedUser = {
          ...user,
          // Explicitly determine estDesactive status
          estDesactive: user.estDesactive === true
        };
        
        return updatedUser;
      });
      
      // Log processed user data
      console.log('Processed users data (after status mapping):', 
        usersData.map(u => ({ id: u.id, nom: u.nom, actif: u.actif, estDesactive: u.estDesactive })));
      
      setUsers(usersData);
      
      // Ensure usersData is an array before filtering
      if (!Array.isArray(usersData)) {
        console.error('Expected array but got:', typeof usersData, usersData);
        throw new Error('Invalid data format received from server');
      }
      
      // Filter the results on the frontend
      let filtered = [...usersData]; // Create a new array to avoid mutation
      
      // Filter by name if search term is provided
      if (searchTerm.trim()) {
        filtered = filtered.filter((user: User) => {
          const fullName = `${user.nom || ''} ${user.prenom || ''}`.toLowerCase();
          return fullName.includes(searchTerm.toLowerCase());
        });
      }
      
      // Filter by role if selected
      if (userType) {
        // Map the user-friendly labels to their API values
        const roleValue = userType === 'Médecin' ? 'MEDECIN' : 
                          userType === 'Agent' ? 'AGENT' :
                          userType === 'Admin' ? 'ADMIN' : '';
        
        if (roleValue) {
          filtered = filtered.filter((user: User) => 
            user.role?.toUpperCase() === roleValue
          );
        }
      }
      
      setFilteredUsers(filtered);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Une erreur est survenue lors de la recherche. Veuillez réessayer.');
      setFilteredUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = () => {
    // Navigate to the create user page
    navigate('/admin/users/new');
  };

  // For development/testing - dummy users data
  const dummyUsers: User[] = [
    {
      id: 1,
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@example.com',
      role: 'MEDECIN',
      actif: true,
      estDesactive: false
    },
    {
      id: 2,
      nom: 'Martin',
      prenom: 'Sophie',
      email: 'sophie.martin@example.com',
      role: 'AGENT',
      actif: true,
      estDesactive: false
    },
    {
      id: 3,
      nom: 'Dubois',
      prenom: 'Michel',
      email: 'michel.dubois@example.com',
      role: 'ADMIN',
      actif: false,
      estDesactive: true
    },
    {
      id: 4,
      nom: 'Bernard',
      prenom: 'Marie',
      email: 'marie.bernard@example.com',
      role: 'MEDECIN',
      actif: true, 
      estDesactive: false
    }
  ];

  // For testing API without calling real API in development
  useEffect(() => {
    // Check if in development mode based on window location
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
    
    if (isDevelopment) {
      const mockApiCall = async () => {
        try {
          // Try real API call first
          const response = await fetch('/api/utilisateurs');
          
          // If we get a valid response, use that
          if (response.ok) {
            const data = await response.json();
            console.log('Real API call succeeded:', data);
            return;
          }
        } catch (err) {
          // If API call fails, log this for development
          console.log('Using dummy data for development as real API failed');
          
          // Use dummy data when API is not available
          setUsers(dummyUsers);
          setFilteredUsers(dummyUsers);
          setHasSearched(true); // Make the table visible
        }
      };
      
      mockApiCall();
    }
  }, []);

  return (
    <div className="users-management-page">
      <div className="users-header">
        <button className="back-button" onClick={handleBack} aria-label="Retour">
          <BackArrowIcon />
          <span>Retour</span>
        </button>
      </div>
      <div className="users-content">
        {/* Search Section */}
        <div className="search-section">
          <div className="search-header">
            <h2 className="search-title">Recherche d'utilisateurs</h2>
            <button 
              className="add-user-button"
              onClick={handleCreateUser}
              title="Créer un nouveau utilisateur"
            >
              <AddUserIcon /> Créer un utilisateur
            </button>
          </div>
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-field">
              <input 
                type="text" 
                placeholder="Rechercher par nom" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="radio-group">
              <label className="radio-label">
                <input 
                  type="radio" 
                  name="userType" 
                  value="Médecin"
                  checked={userType === 'Médecin'}
                  onChange={() => setUserType('Médecin')}
                />
                Médecin
              </label>
              <label className="radio-label">
                <input 
                  type="radio" 
                  name="userType" 
                  value="Agent"
                  checked={userType === 'Agent'}
                  onChange={() => setUserType('Agent')}
                />
                Agent
              </label>
              <label className="radio-label">
                <input 
                  type="radio" 
                  name="userType" 
                  value="Admin"
                  checked={userType === 'Admin'}
                  onChange={() => setUserType('Admin')}
                />
                Admin
              </label>
            </div>
            <label className="checkbox-label">
              <input 
                type="checkbox"
                checked={includeInactive}
                onChange={() => setIncludeInactive(!includeInactive)}
              />
              Inclure les utilisateurs désactivés
            </label>
            <div className="button-container">
              <button 
                type="submit" 
                className="btn btn-search"
                disabled={isLoading}
              >
                {isLoading ? <LoadingIcon /> : <SearchIcon />}
                {isLoading ? 'Recherche en cours...' : 'Rechercher'}
              </button>
            </div>
          </form>
        </div>

        {/* Results Section */}
        <div className="results-section">
          <h2 className="results-title">Liste des utilisateurs</h2>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {hasSearched ? (
                  filteredUsers.length > 0 ? (
                    filteredUsers.map((user, index) => {
                      // Explicitly check if user is deactivated
                      const isDeactivated = user.estDesactive === true;
                      
                      return (
                        <tr 
                          key={user.idUtilisateur || user.id || index}
                          className={isDeactivated ? "user-row-inactive" : ""}
                        >
                          <td>{user.nom || '-'}</td>
                          <td>{user.prenom || '-'}</td>
                          <td>{user.email || '-'}</td>
                          <td>{user.role || '-'}</td>
                          <td>
                            <span className={isDeactivated ? "status-inactive" : "status-active"}>
                              {isDeactivated ? "Désactivé" : "Actif"}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="action-btn" 
                                title="Modifier"
                                onClick={() => navigate(`/admin/users/edit/${user.idUtilisateur || user.id}`)}
                              >
                                <EditIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                        Aucun utilisateur trouvé
                      </td>
                    </tr>
                  )
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                      Utilisez les filtres ci-dessus et cliquez sur Rechercher pour afficher les utilisateurs
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersManagementPage; 