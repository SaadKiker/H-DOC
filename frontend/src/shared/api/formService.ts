import axios from './axios';
import { API_ENDPOINTS } from './api.config';

// Form model interface
export interface FormModel {
  id?: number;           // Keep for backward compatibility
  idModele?: number;     // API actually returns this
  nom: string;
  description?: string;
  specialiteId?: number; // Keep for backward compatibility
  idSpecialite?: number; // API actually returns this
  nomSpecialite?: string;
  prix?: number;
  dateCreation?: string;
  statut?: string;
  createdBy?: string;
}

// Form structure interface
export interface FormStructure {
  id: number;
  structure: any; // The structure can be complex, using 'any' for now
}

// Get all form models
export const getAllFormModels = async (): Promise<FormModel[]> => {
  try {
    const response = await axios.get(API_ENDPOINTS.FORMULAIRES.GET_MODELES);
    
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && (Array.isArray(response.data.data) || Array.isArray(response.data.content))) {
      return response.data.data || response.data.content;
    }
    
    console.warn('Unexpected form models response format, returning empty array');
    return [];
  } catch (error) {
    console.error('Error fetching form models:', error);
    throw error;
  }
};

// Get form models by specialty ID
export const getFormModelsBySpecialty = async (specialtyId: number): Promise<FormModel[]> => {
  try {
    const response = await axios.get(API_ENDPOINTS.FORMULAIRES.GET_MODELES_BY_SPECIALITE(specialtyId));
    
    console.log('API response for form models:', response.data);
    
    // Handle different response formats
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && (Array.isArray(response.data.data) || Array.isArray(response.data.content))) {
      return response.data.data || response.data.content;
    }
    
    console.warn('Unexpected form models response format, returning empty array');
    return [];
  } catch (error) {
    console.error(`Error fetching form models for specialty ${specialtyId}:`, error);
    throw error;
  }
};

// Get form model by ID
export const getFormModelById = async (formId: number): Promise<FormModel> => {
  try {
    const response = await axios.get(`${API_ENDPOINTS.FORMULAIRES.GET_MODELES}/${formId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching form model ${formId}:`, error);
    throw error;
  }
};

// Get complete form structure by form model ID
export const getFormStructureById = async (formId: number): Promise<FormStructure> => {
  try {
    const response = await axios.get(API_ENDPOINTS.FORMULAIRES.GET_MODELE_STRUCTURE(formId));
    return response.data;
  } catch (error) {
    console.error(`Error fetching form structure for form ${formId}:`, error);
    throw error;
  }
};

// Search form models by name
export const searchFormModelsByName = async (searchTerm: string): Promise<FormModel[]> => {
  try {
    const response = await axios.get(`${API_ENDPOINTS.FORMULAIRES.GET_MODELES}/search?query=${encodeURIComponent(searchTerm)}`);
    
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && (Array.isArray(response.data.data) || Array.isArray(response.data.content))) {
      return response.data.data || response.data.content;
    }
    
    console.warn('Unexpected search results format, returning empty array');
    return [];
  } catch (error) {
    console.error('Error searching form models:', error);
    throw error;
  }
};

// Delete form model by ID
export const deleteFormModel = async (formId: number): Promise<void> => {
  try {
    if (!formId) {
      throw new Error('Invalid form ID: must be a number');
    }
    
    console.log(`Deleting form model with ID: ${formId}`);
    await axios.delete(API_ENDPOINTS.FORMULAIRES.DELETE_MODELE(formId));
  } catch (error) {
    console.error(`Error deleting form model ${formId}:`, error);
    throw error;
  }
};

// Update basic form model properties (name, description, specialty, price)
export const updateFormModelBasic = async (formId: number, formData: {
  nom: string;
  description?: string;
  idSpecialite: number;
  prix?: number;
}): Promise<FormModel> => {
  try {
    if (!formId) {
      throw new Error('Invalid form ID: must be a number');
    }
    
    console.log(`Updating basic properties of form model with ID: ${formId}`);
    const response = await axios.put(API_ENDPOINTS.FORMULAIRES.UPDATE_MODELE_BASE(formId), formData);
    return response.data;
  } catch (error) {
    console.error(`Error updating form model ${formId}:`, error);
    throw error;
  }
};

// Update complete form model (including structure)
export const updateFormModelComplete = async (formData: any): Promise<FormModel> => {
  try {
    const formId = formData.idModele || formData.id;
    if (!formId) {
      throw new Error('Invalid form ID: form must have idModele property');
    }
    
    console.log(`Updating complete form model with ID: ${formId}`);
    const response = await axios.put(API_ENDPOINTS.FORMULAIRES.UPDATE_MODELE_COMPLET, formData);
    return response.data;
  } catch (error: any) {
    console.error('Error updating form model:', error);
    
    // Specific error handling for 409 Conflict
    if (error.response && error.response.status === 409) {
      throw new Error('Ce formulaire a déjà été utilisé par des patients et ne peut pas être entièrement modifié. Veuillez créer un nouveau formulaire.');
    }
    
    // Handle other status codes
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(`Erreur: ${error.response.data.message}`);
    }
    
    throw error;
  }
}; 