import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from './authService';
import { useAuth } from './AuthContext';
import { User } from './types';

const Login = () => {
  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    console.log(`Login attempt with user: ${identifiant}`);
    console.log(`API base URL: ${apiBaseUrl}`);

    try {
      const response = await login(identifiant, motDePasse);
      console.log('Login response processed:', {
        success: response?.success,
        hasUser: !!response?.utilisateur
      });
      
      // Successful login
      if (response && response.success && response.utilisateur) {
        const userData = response.utilisateur;
        // Store user data in auth context
        authLogin(userData as User);
        
        if (userData.role) {
          navigate('/dashboard');
        } else {
          setError('Rôle utilisateur non reconnu');
        }
      } 
      // Response with error message
      else if (response && response.message) {
        setError(response.message);
      } 
      // Unexpected response format
      else {
        setError('Format de réponse non reconnu');
        console.error('Unexpected response format:', response);
      }
    } catch (err: unknown) {
      // Handle error
      const error = err as Error;
      
      // Display appropriate error message
      if (error.message) {
        // Use error message directly if it's a custom error from authService
        setError(error.message);
      } else {
        // Generic fallback
        setError('Une erreur inattendue est survenue. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <div className="login-header">
          <div className="logo-container">
            <img src="/whiteBgColor.png" alt="H-DOC Logo" className="logo-image" />
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="identifiant">Identifiant</label>
            <input
              type="text"
              id="identifiant"
              value={identifiant}
              onChange={(e) => setIdentifiant(e.target.value)}
              required
              autoComplete="username"
              placeholder="Entrez votre identifiant"
              style={{ 
                fontSize: '1rem', 
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem'
              }}
            />
          </div>
          <div className="form-group">
            <label htmlFor="motDePasse">Mot de passe</label>
            <input
              type="password"
              id="motDePasse"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Entrez votre mot de passe"
              style={{ fontSize: '1rem' }}
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading} 
            style={{ width: '100%', marginTop: '1.5rem' }}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connexion en cours...
              </>
            ) : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;