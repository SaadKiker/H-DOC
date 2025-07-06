import axios from './axios';
import { API_ENDPOINTS } from './api.config';
import { Appointment, AppointmentFormData, AvailableDoctorsResponse } from '../../dashboard/types';
import { AxiosResponse } from 'axios';

// Get appointments with optional filtering
export const getAppointments = async (
  startDate: string,
  endDate: string,
  doctorId?: string,
  includeAllStatuses: boolean = false
): Promise<Appointment[]> => {
  try {
    let url = `${API_ENDPOINTS.GET_APPOINTMENTS}?startDate=${startDate}&endDate=${endDate}`;
    
    if (doctorId) {
      url += `&doctorId=${doctorId}`;
    }
    
    // Add the new includeAllStatuses parameter to get all appointments regardless of status
    if (includeAllStatuses) {
      url += `&includeAllStatuses=true`;
    }
    
    const response = await axios.get(url);
    
    // Handle various response formats
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && response.data.status === 'SUCCESS' && Array.isArray(response.data.appointments)) {
      return response.data.appointments;
    } else if (response.data && response.data.appointments && Array.isArray(response.data.appointments)) {
      return response.data.appointments;
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    console.warn('Unexpected appointments response format, returning empty array');
    return [];
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }
};

// Validate appointment type to ensure it's one of the specified types
const validateAppointmentType = (type?: string): string => {
  const validTypes = ['CONSULTATION', 'SUIVI', 'CONTROLE'];
  const upperCaseType = type?.toUpperCase() || '';
  
  return validTypes.includes(upperCaseType) ? upperCaseType : 'CONSULTATION'; // Default to CONSULTATION if invalid
};

/**
 * NOTE FOR BACKEND TEAM:
 * The frontend is currently adding +1 hour to appointments before sending to the backend
 * because the backend appears to subtract 1 hour from the times it receives.
 * 
 * This is handled in the AppointmentForm component when collecting the date/time from the form.
 * If this time offset issue is fixed in the backend, the hour adjustment in the frontend should be removed.
 */

// Create a new appointment
export const createAppointment = async (appointmentData: AppointmentFormData): Promise<Appointment> => {
  try {
    // Ensure the appointment type is valid
    const typeVisit = validateAppointmentType(appointmentData.typeVisit || appointmentData.typeVisite);
    
    // Prepare the data for the API with validated type - match backend schema exactly
    const apiData = {
      idPatient: appointmentData.idPatient,
      idMedecin: appointmentData.idMedecin,
      dateHeure: appointmentData.dateHeure,
      durationMinutes: appointmentData.durationMinutes,
      note: appointmentData.commentaire || '',
      service: appointmentData.service || '',
      typeVisit: typeVisit
    };
    
    console.log('Creating appointment with data:', apiData);
    
    // Direct API call with properly adjusted time
    const response = await axios.post(API_ENDPOINTS.CREATE_APPOINTMENT, apiData);
    
    if (response.data) {
      return response.data;
    }
    
    throw new Error('Failed to create appointment - no data returned from API');
  } catch (error: unknown) {
    console.error('Error creating appointment:', error);
    
    // Try to get a friendly error message
    const axiosError = error as any;
    if (axiosError?.response?.data?.message) {
      const errorMessage = axiosError.response.data.message;
      
      // If the message contains keywords about scheduling conflicts
      if (errorMessage.includes('déjà un rendez-vous') || 
          errorMessage.includes('médecin a déjà un rendez-vous')) {
        throw new Error('Ce créneau horaire n\'est pas disponible. Veuillez choisir un autre horaire.');
      }
      
      throw new Error(errorMessage);
    } else if (error instanceof Error) {
    throw error;
    }
    
    // Generic error if we couldn't get a specific message
    throw new Error('Erreur lors de la création du rendez-vous. Veuillez réessayer.');
  }
};

// Update an existing appointment
export const updateAppointment = async (id: string, appointmentData: AppointmentFormData): Promise<Appointment> => {
  try {
    // Ensure the appointment type is valid
    const typeVisit = validateAppointmentType(appointmentData.typeVisit || appointmentData.typeVisite);
    
    // Create minimal API data without any custom fields that might cause issues
    // Match backend schema exactly
    const apiData = {
      idPatient: appointmentData.idPatient,
      idMedecin: appointmentData.idMedecin,
      dateHeure: appointmentData.dateHeure,
      durationMinutes: appointmentData.durationMinutes,
      note: appointmentData.commentaire || '',
      service: appointmentData.service || '',
      typeVisit: typeVisit
    };
    
    console.log('Updating appointment with data:', apiData);
    
    // Try the simplest approach first: PUT to update endpoint
    try {
      const updateEndpoint = `/api/appointments/${id}`;
      const response = await axios.put(updateEndpoint, apiData);
    
      if (response.data) {
        return response.data;
      }
    } catch (putError) {
      console.error('Error with PUT request:', putError);
      throw putError;
    }
    
    throw new Error('Failed to update appointment - all approaches failed');
  } catch (error) {
    console.error('Error updating appointment:', error);
    
    // Extract any error message from the response if available
    const axiosError = error as any;
    if (axiosError?.response?.data?.message) {
      const errorMessage = axiosError.response.data.message;
      
      // If error is about doctor availability but this is the same patient,
      // provide a more helpful message
      if (errorMessage.includes('médecin a déjà un rendez-vous')) {
        throw new Error('Impossible de modifier ce rendez-vous car il y a un conflit d\'horaire. Veuillez choisir un autre créneau.');
      }
      
      throw new Error(errorMessage);
    } else if (axiosError?.response?.data?.error) {
      throw new Error(axiosError.response.data.error);
    } else if (error instanceof Error) {
    throw error;
    }
    
    // Generic error if we couldn't get a specific message
    throw new Error('Erreur lors de la mise à jour du rendez-vous. Veuillez réessayer.');
  }
};

// Delete/cancel an appointment
export const deleteAppointment = async (id: string): Promise<void> => {
  try {
    // Use the permanent delete endpoint to ensure the appointment is completely deleted
    // from the database instead of just having its status changed to ANNULER
    await axios.delete(`${API_ENDPOINTS.PERMANENT_DELETE_APPOINTMENT}/${id}`);
  } catch (error) {
    console.error('Error deleting appointment:', error);
    throw error;
  }
};

// Get available doctors for a time slot
export const getAvailableDoctors = async (
  startDateTime: string,
  endDateTime: string
): Promise<string[]> => {
  try {
    const url = `${API_ENDPOINTS.GET_AVAILABLE_DOCTORS}?startDateTime=${startDateTime}&endDateTime=${endDateTime}`;
    
    const response = await axios.get<AvailableDoctorsResponse | string[]>(url);
    
    // Handle both possible response formats:
    // 1. Array of doctor IDs directly
    // 2. Object with doctors property containing array of IDs
    if (Array.isArray(response.data)) {
      return response.data; // Direct array of doctor IDs
    } else if (response.data && Array.isArray(response.data.doctors)) {
      return response.data.doctors; // Nested array in 'doctors' property
    }
    
    console.log('Unexpected doctor availability response format:', response.data);
    return [];
  } catch (error) {
    console.error('Error fetching available doctors:', error);
    throw error;
  }
}; 