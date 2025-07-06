import axiosInstance, { api } from '../shared/api/axios';
import { API_ENDPOINTS } from '../shared/api/api.config';
import { LoginResponse } from './types';

export const login = async (identifiant: string, motDePasse: string) => {
  try {
    console.log(`Attempting login with credentials: ${identifiant}`);
    console.log(`Login endpoint: ${API_ENDPOINTS.AUTH.LOGIN}`);
    
    // Make the login request with the api wrapper
    // This will automatically ensure the correct URL is used
    const response = await api.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      identifiant,
      motDePasse
    });
    
    console.log('Login response received:', {
      status: response.status,
      success: response.data?.success
    });
    
    if (!response.data) {
      throw new Error('Empty response data received from server');
    }
    
    // Validate response structure
    if (typeof response.data !== 'object') {
      console.error('Response data is not an object:', response.data);
      throw new Error('Invalid response format: not an object');
    }
    
    return response.data;
  } catch (error: unknown) {
    const err = error as Error & { 
      response?: { 
        data?: unknown;
        status?: number;
        statusText?: string;
      },
      message?: string,
      code?: string,
      request?: any
    };
    
    console.error('Login error:', {
      message: err.message,
      code: err.code,
      status: err.response?.status,
      statusText: err.response?.statusText,
      responseData: err.response?.data
    });
    
    // Network errors (server not running or unreachable)
    if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
      throw new Error('Le serveur backend n\'est pas accessible. Veuillez vérifier que le serveur est en cours d\'exécution.');
    }
    
    // Handle specific HTTP error codes
    if (err.response?.status === 401) {
      throw new Error('Identifiant ou mot de passe incorrect.');
    }
    
    if (err.response?.status === 400) {
      throw new Error('Données de connexion invalides.');
    }
    
    if (err.response?.status === 415) {
      throw new Error('Le serveur n\'accepte pas le format de la requête. Vérifiez les en-têtes Content-Type.');
    }
    
    if (err.response?.status === 500) {
      throw new Error('Erreur serveur. Veuillez contacter l\'administrateur système.');
    }
    
    // If the error wasn't caught by any of the above handlers, rethrow it
    throw error;
  }
};
