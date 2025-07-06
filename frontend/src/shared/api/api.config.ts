// The backend controllers already include the /api prefix in their mappings
// We need to directly use the /api prefix without duplicating it

// This prefix should be added to all endpoints to use the Vite proxy
const API_PREFIX = '/api';

// All API endpoints that will be used through the Vite proxy
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_PREFIX}/auth/login`,
  },
  
  // Patient endpoints
  PATIENTS: {
    SEARCH: `${API_PREFIX}/patients`,
    GET_BY_ID: (ipp: string) => `${API_PREFIX}/agent/patient/${ipp}`,
    CREATE: `${API_PREFIX}/patients/new`,
    UPDATE: (ipp: string) => `${API_PREFIX}/patients/${ipp}/modify`,
  },
  
  // Visit endpoints
  VISITS: {
    GET_BY_PATIENT: (ipp: string) => `${API_PREFIX}/patients/${ipp}/visites`,
    GET_ACTIVE_BY_PATIENT: (ipp: string) => `${API_PREFIX}/patients/${ipp}/visites/active`,
    GET_ALL_ACTIVE: `${API_PREFIX}/visites/active`,
    GET_MEDECIN_ACTIVE: (id: string) => `${API_PREFIX}/medecins/${id}/visites/active`,
    GET_TODAY_COMPLETED: `${API_PREFIX}/visites/completed/today`,
    GET_MEDECIN_TODAY_COMPLETED: (id: string) => `${API_PREFIX}/medecins/${id}/visites/completed/today`,
    GET_COMPLETED_BY_DATE: (dateStr: string) => `${API_PREFIX}/visites/completed/${dateStr}`,
    GET_UPCOMING_TODAY: `${API_PREFIX}/visites/upcoming/today`,
    CREATE: (ipp: string) => `${API_PREFIX}/patients/${ipp}/visites/new`,
    GET_BY_ID: (id: number) => `${API_PREFIX}/visites/${id}`,
    UPDATE: (id: number) => `${API_PREFIX}/visites/${id}`,
    DELETE: (id: number) => `${API_PREFIX}/visites/${id}`,
    END: (id: number) => `${API_PREFIX}/visites/${id}/end`,
    SAVE_NOTE: (id: number) => `${API_PREFIX}/visites/${id}/note`,
  },
  
  // Document endpoints
  DOCUMENTS: {
    GET_BY_PATIENT: (ipp: string) => `${API_PREFIX}/patients/${ipp}/documents`,
    UPLOAD: (ipp: string) => `${API_PREFIX}/patients/${ipp}/documents/upload`,
    GET_BY_ID: (id: number) => `${API_PREFIX}/documents/${id}`,
    DELETE: (id: number) => `${API_PREFIX}/documents/${id}`,
    UPDATE_METADATA: (id: number) => `${API_PREFIX}/documents/${id}`,
    UPDATE_FILE: (id: number) => `${API_PREFIX}/documents/${id}/file`,
  },

  // Doctor endpoints
  DOCTORS: {
    GET_ALL: `${API_PREFIX}/medecins`,
    GET_BY_SPECIALTY: (specialtyId: number) => `${API_PREFIX}/medecins?specialite=${specialtyId}`,
    GET_UNAVAILABLE: `${API_PREFIX}/medecins?status=UNAVAILABLE`,
    GET_UNAVAILABLE_BY_SPECIALTY: (specialtyId: number) => `${API_PREFIX}/medecins?status=UNAVAILABLE&specialite=${specialtyId}`,
    GET_BY_ID: (id: string) => `${API_PREFIX}/medecins/${id}`,
  },

  // Specialty endpoints
  SPECIALTIES: {
    GET_FILTERABLE: `${API_PREFIX}/specialites?filterable=true`,
  },

  // Appointment endpoints
  GET_APPOINTMENTS: '/api/appointments',
  CREATE_APPOINTMENT: '/api/appointments',
  UPDATE_APPOINTMENT: '/api/appointments',
  DELETE_APPOINTMENT: '/api/appointments',
  PERMANENT_DELETE_APPOINTMENT: '/api/appointments/permanent-delete',
  GET_AVAILABLE_DOCTORS: '/api/appointments/doctors/available',
  
  // Medical Forms endpoints
  FORMULAIRES: {
    GET_MODELES: `${API_PREFIX}/formulaires/modeles`,
    GET_MODELES_BY_SPECIALITE: (idSpecialite: number) => `${API_PREFIX}/formulaires/modeles/specialite/${idSpecialite}`,
    GET_MODELE_STRUCTURE: (idModele: number) => `${API_PREFIX}/formulaires/modeles/${idModele}/structure`,
    GET_LATEST_PATIENT_SUBMISSION: (idModele: number, idPatient: string) => `${API_PREFIX}/formulaires/modeles/${idModele}/soumissions/patient/${idPatient}/latest`,
    SUBMIT_FORM: `${API_PREFIX}/formulaires`,
    DELETE_MODELE: (idModele: number) => `${API_PREFIX}/formulaires/modeles/${idModele}`,
    UPDATE_MODELE_BASE: (idModele: number) => `${API_PREFIX}/formulaires/modeles/${idModele}`,
    UPDATE_MODELE_COMPLET: `${API_PREFIX}/formulaires/modeles/complet`,
  },
  
  // Certificate endpoints
  CERTIFICATS: {
    CREATE: `${API_PREFIX}/certificats`,
  },
  
  // Allergies endpoints
  ALLERGIES: {
    GET_BY_PATIENT: (patientId: string) => `${API_PREFIX}/allergies/patient/${patientId}`,
    CREATE: `${API_PREFIX}/allergies`,
    UPDATE: (idAllergie: number) => `${API_PREFIX}/allergies/${idAllergie}`,
    DELETE: (idAllergie: number) => `${API_PREFIX}/allergies/${idAllergie}`,
  },
  
  // Medications endpoints
  MEDICAMENTS: {
    SEARCH: `${API_PREFIX}/medicaments/search`,
  },
  
  // Ordonnances endpoints
  ORDONNANCES: {
    // Use the singular form to match backend controller expectations
    GET_ACTIVE_BY_PATIENT_VISIT: (idPatient: string, idVisite: number) => 
      `${API_PREFIX}/ordonnances/patient/${idPatient}/visite/${idVisite}?statut=en_cours`,
    GET_BY_PATIENT: (idPatient: string) => `${API_PREFIX}/ordonnances/patient/${idPatient}`,
    CREATE_EMPTY: `${API_PREFIX}/ordonnances/empty`,
    DELETE: (idOrdonnance: string) => `${API_PREFIX}/ordonnances/${idOrdonnance}`,
  },
  
  // Factures endpoints
  FACTURES: {
    GET_BY_PATIENT: (idPatient: string) => `${API_PREFIX}/factures/patient/${idPatient}`,
    CREATE: `${API_PREFIX}/factures`,
    PREPARE: `${API_PREFIX}/factures/prepare`,
    GENERATE_PDF: `${API_PREFIX}/factures/generate-pdf`,
    GENERATE_PDF_BY_ID: (idFacture: string) => `${API_PREFIX}/factures/${idFacture}/generate-pdf`,
    GET_BY_DATE: `${API_PREFIX}/factures/by-date`,
    GET_TODAY: `${API_PREFIX}/factures/today`,
    GET_PENDING: `${API_PREFIX}/factures/pending`
  },
  
  // Prescriptions endpoints
  PRESCRIPTIONS: {
    ADD_TO_ORDONNANCE: (idOrdonnance: string) => 
      `${API_PREFIX}/prescriptions/ordonnance/${idOrdonnance}`,
  },
};

/**
 * This helper keeps the /api prefix but avoids a duplicate /api/api path issue.
 * Since we're using the Vite proxy that forwards /api to http://localhost:8080, 
 * and the backend controllers already have /api in their paths,
 * we need to be careful to avoid duplicate /api prefixes.
 */
export const getApiUrl = (endpoint: string): string => {
  // If the endpoint already starts with /api, return it as is
  // This supports the API_ENDPOINTS constants defined above
  if (endpoint.startsWith('/api/')) {
    return endpoint;
  }
  
  // Otherwise, add the /api prefix
  // This helps with any custom endpoints that aren't in API_ENDPOINTS
  return `/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
};

// Export the API prefix for use elsewhere
export default API_PREFIX;