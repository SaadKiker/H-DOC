import axios from 'axios';
import API_PREFIX, { getApiUrl } from './api.config';

console.log('Axios is configured for API proxy:', API_PREFIX);

// Get the current origin to ensure we use the correct port
const currentOrigin = window.location.origin;
console.log('Current origin:', currentOrigin);

// Since we're using Vite's proxy, we set the baseURL to the current origin
// This ensures that requests use the same port that the app is running on
const axiosInstance = axios.create({
  baseURL: currentOrigin, // Use the current origin to ensure correct port
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // Increased timeout for slower connections
  withCredentials: true, // This is important for cookies/CORS
});

// Add custom header to identify requests
axiosInstance.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Create wrapper methods to ensure consistent URL handling for all API calls
const api = {
  get: <T>(url: string, config?: any) => {
    const apiUrl = getApiUrl(url);
    return axiosInstance.get<T>(apiUrl, config);
  },
  post: <T>(url: string, data?: any, config?: any) => {
    const apiUrl = getApiUrl(url);
    return axiosInstance.post<T>(apiUrl, data, config);
  },
  put: <T>(url: string, data?: any, config?: any) => {
    const apiUrl = getApiUrl(url);
    return axiosInstance.put<T>(apiUrl, data, config);
  },
  delete: <T>(url: string, config?: any) => {
    const apiUrl = getApiUrl(url);
    return axiosInstance.delete<T>(apiUrl, config);
  },
  patch: <T>(url: string, data?: any, config?: any) => {
    const apiUrl = getApiUrl(url);
    return axiosInstance.patch<T>(apiUrl, data, config);
  }
};

axiosInstance.interceptors.request.use(
  (config) => {
    // Special handling for login requests
    if (config.url?.includes('/auth/login')) {
      // Make sure login requests are properly formatted
      config.headers['Content-Type'] = 'application/json';
      return config;
    }
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        config.headers['X-User-ID'] = user.idUtilisateur;
      } catch (error) {
        console.error('Error parsing user from localStorage', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if not on login page already
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Export both the wrapped api object and the raw axiosInstance
export { api };
export default axiosInstance;