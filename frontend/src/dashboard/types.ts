export interface Patient {
  idPatient: string;
  ipp: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  sexe: string;
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  cin: string;
  nationalite: string;
  etatCivil: string;
  contactUrgencePrenom: string;
  contactUrgenceRelation: string;
  contactUrgenceAdresse: string;
  contactUrgenceTelephone: string;
  typeAdmission: string;
  dateAdmission: string;
  dateCreation: string;
}

export interface Visit {
  idVisite: number;
  typeVisite: string;
  dateDebut: string;
  dateFin?: string;
  statut: string;
  service: string;
  idMedecin?: string;
  patient?: Patient;
  medecin?: Doctor;
  fromAppointment?: boolean;
  rendezVous?: RendezVous;
  note?: string;
  commentaire?: string;
}

export interface Document {
  idDocument: number;
  idPatient: string;
  nomPatient: string;
  prenomPatient: string;
  ippPatient: string;
  nom: string;
  description?: string;
  typeDocument: string;
  dateAjout: string;
  url: string;
}

export interface PatientSearchResponse {
  status?: string;
  message?: string;
  patients?: Patient[];
}

export interface CompletedVisitsResponse {
  status?: string;
  message?: string;
  visites: Visit[];
  count?: number;
}

export interface Doctor {
  idMedecin: string;
  idSpecialite?: number | string;
  nomSpecialite: string;
  nom: string;
  prenom: string;
  status: 'AVAILABLE' | 'UNAVAILABLE';
}

export interface Specialty {
  // Support both potential naming conventions from backend
  id?: number;
  idSpecialite?: number; 
  nom?: string;
  nomSpecialite?: string;
  description?: string;
  code?: string;
}

export interface Appointment {
  id?: string;
  idPatient: string;
  idMedecin: string;
  dateHeure: string;
  durationMinutes: number;
  commentaire?: string;
  note?: string;
  status?: string;
  service?: string;
  typeVisite?: string;
  typeVisit?: string;
  
  // Complete objects
  patient?: Patient;
  medecin?: Doctor;
  
  // Backward compatibility fields
  nomPatient?: string;
  prenomPatient?: string;
  nomMedecin?: string;
  specialiteMedecin?: string;
}

export interface AppointmentFormData {
  idPatient: string;
  idMedecin: string;
  dateHeure: string;
  durationMinutes: number;
  commentaire: string;
  service: string;
  typeVisite: string;
  typeVisit: string;
}

export interface AvailableDoctorsResponse {
  status?: string;
  message?: string;
  doctors: string[]; // Array of doctor UUIDs
}

export interface RendezVousResponse {
  id?: string;
  idRendezVous?: string;
  idPatient: string;
  idMedecin: string;
  dateHeure: string;
  dateDebut: string; // For compatibility with existing Visit interface
  durationMinutes?: number;
  commentaire?: string;
  status?: string;
  service?: string;
  typeVisite?: string;
  typeVisit?: string;
  note?: string;
  
  // Complete objects
  patient?: Patient;
  medecin?: Doctor;
}

export interface UpcomingAppointmentsResponse {
  status: string;
  message: string;
  appointments: RendezVousResponse[];
  count: number;
}

export enum RendezVousStatus {
  PLANIFIE = 'PLANIFIE',
  COMMENCE = 'COMMENCE',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE',
  ABSENCE = 'ABSENCE',
  LATE = 'LATE',
  EN_COURS = 'EN_COURS',
  COMPLETE = 'COMPLETE'
}

export interface RendezVous {
  idRendezVous: number;
  patient?: Patient;
  medecin?: Doctor;
  dateHeure: string;
  status: RendezVousStatus;
  service?: string;
  typeVisite?: string;
  commentaire?: string;
}

// Medical Forms Types
export interface ModeleFormulaire {
  idModele: number;
  nom: string;
  description?: string;
  idSpecialite: number;
  nomSpecialite?: string;
}

export interface ChampFormulaire {
  idChamp: number;
  idSection: number;
  nom: string; // field label
  estObligatoire: boolean;
  typeChamp: string; // input type: select, radio, checkbox, number, search, textarea, date, etc.
  placeholder?: string; // optional UI hint
  ordreAffichage: number;
  valeursPossibles?: string; // A ;-separated string of options or NULL
  unite?: string; // Unit to display for number fields
  section_formulaire?: string; // The section this field belongs to
}

export interface SectionFormulaire {
  idSection: number;
  idModele: number;
  nom: string;
  description?: string;
  ordreAffichage: number;
  idParentSection?: number | null;
  sousSections: SectionFormulaire[];
  champs: ChampFormulaire[];
}

export interface FormulaireResponse {
  status?: string;
  message?: string;
  modeles?: ModeleFormulaire[];
}

// Form submission types
export interface FormReponse {
  idChamp: number;
  valeur: string;
  idSection: number;
}

export interface FormSubmissionPayload {
  idPatient: string;
  idVisite: number;
  idModele: number;
  idMedecin: string;
  status?: string;
  reponses: FormReponse[];
}

export interface FormSubmissionResponse {
  status?: string;
  message?: string;
  idFormulaireSoumis?: number;
}