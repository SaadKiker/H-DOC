export interface User {
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
  [key: string]: unknown;
}

export interface LoginRequest {
  identifiant: string;
  motDePasse: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  utilisateur?: User;
}