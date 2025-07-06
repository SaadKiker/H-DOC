# H-DOC Frontend Development Guide

## Project Overview

H-DOC (Système de Gestion des Dossiers Médicaux - SGDM) is a medical records management system with the following components:

- **Backend**: Spring Boot REST API (this repository)
- **Frontend**: React.js application (to be implemented)
- **Database**: PostgreSQL hosted on Supabase

This guide provides comprehensive information for implementing the frontend application that will interact with the existing backend API.

## System Architecture

### Backend Structure
```
com.hdoc.sgdm
├── config/        # Configuration classes
├── controller/    # REST API controllers
├── dto/           # Data Transfer Objects
│   ├── request/   # Request DTOs
│   └── response/  # Response DTOs
├── entity/        # JPA entity classes
├── exception/     # Custom exceptions and handlers
├── mapper/        # Object mapping utilities
├── repository/    # Spring Data repositories
├── security/      # Security configurations (temporarily removed)
├── service/       # Business logic services
└── util/          # Utility classes
```

### Tech Stack
- **Backend**: Spring Boot 3.4.4, Java 17
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase for document storage

## Role-Based User Interface

The system supports three different user roles, each with different access and capabilities:

### 1. AGENT
- **Status**: Fully implemented in the backend
- **Description**: Administrative staff who manage patients, visits, and documents
- **Features**: Full access to patient management, visit management, document upload

### 2. MEDECIN (Doctor)
- **Status**: Placeholder for future development
- **Description**: Medical professionals who consult with patients
- **Features**: For demo, show a placeholder screen with "Doctor interface under development"

### 3. ADMIN
- **Status**: Placeholder for future development  
- **Description**: System administrators who manage users and settings
- **Features**: For demo, show a placeholder screen with "Admin interface under development"

## Frontend Routing Strategy

### Authentication and Role-Based Routing

When a user logs in, the backend returns their information including their role. The frontend should use this role to direct users to different interfaces:

```javascript
// Example frontend routing logic
const handleLogin = async (credentials) => {
  try {
    const response = await api.post('/api/auth/login', credentials);
    
    if (response.data.success) {
      // Store user data including role
      setUser(response.data.utilisateur);
      
      // Route based on role
      switch(response.data.utilisateur.role.toUpperCase()) {
        case 'AGENT':
          navigate('/agent/dashboard');
          break;
        case 'MEDECIN':
          navigate('/medecin/placeholder');
          break;
        case 'ADMIN':
          navigate('/admin/placeholder');
          break;
        default:
          setError('Unknown user role');
      }
    } else {
      setError(response.data.message);
    }
  } catch (error) {
    setError('Login failed. Please try again.');
  }
};
```

### Suggested Route Structure

```
/login                    - Public login page

# Agent Routes (fully implemented)
/agent/dashboard          - Agent home view
/agent/patients           - Patient search/listing
/agent/patients/new       - New patient form
/agent/patients/:ipp      - Patient detail view
/agent/patients/:ipp/documents - Patient documents
/agent/patients/:ipp/visits    - Patient visits

# Doctor Routes (placeholder for demo)
/medecin/placeholder      - "Doctor interface under development" page

# Admin Routes (placeholder for demo)
/admin/placeholder        - "Admin interface under development" page
```

## API Endpoints Reference

### Authentication

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/auth/login` | POST | User authentication | `{ "identifiant": "string", "motDePasse": "string" }` | `{ "success": boolean, "message": "string", "utilisateur": { "idUtilisateur": "UUID", "nom": "string", "prenom": "string", "role": "string", ... } }` |

### Patient Management

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/patients/new` | POST | Create new patient | Patient information | `{ "status": "string", "message": "string", "patient": PatientDTO }` |
| `/api/patients` | GET | Search patients | Query params (nom, prenom, etc.) | `{ "status": "string", "message": "string", "patients": [PatientDTO] }` |
| `/api/patients/{ipp}/modify` | PUT | Update patient info | Updated patient fields | `{ "status": "string", "message": "string", "patient": PatientDTO }` |

### Document Management

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/patients/{ipp}/documents/upload` | POST | Upload document | Multipart form data | `{ "success": boolean, "message": "string", "document": DocumentDTO }` |
| `/api/patients/{ipp}/documents` | GET | Get patient documents | - | `{ "success": boolean, "message": "string", "documents": [DocumentDTO] }` |
| `/api/documents/{id}` | GET | Get specific document | - | `{ "success": boolean, "message": "string", "document": DocumentDTO }` |
| `/api/documents/{id}` | DELETE | Delete document | - | `{ "success": boolean, "message": "string" }` |

### Visit Management

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/patients/{ipp}/visites/new` | POST | Start new visit | `{ "typeVisite": "string", "motif": "string", "service": "string" }` | `{ "status": "string", "message": "string", "visite": VisiteDTO }` |
| `/api/patients/{ipp}/visites` | GET | Get all patient visits | - | `{ "status": "string", "message": "string", "visites": [VisiteDTO] }` |
| `/api/patients/{ipp}/visites/active` | GET | Get active visits | - | `{ "status": "string", "message": "string", "visites": [VisiteDTO] }` |
| `/api/visites/{id}` | GET | Get specific visit | - | `{ "status": "string", "message": "string", "visite": VisiteDTO }` |
| `/api/visites/{id}` | PUT | Update visit | `{ "typeVisite": "string", "motif": "string", etc. }` | `{ "status": "string", "message": "string", "visite": VisiteDTO }` |
| `/api/visites/{id}` | DELETE | Delete visit | - | `{ "status": "string", "message": "string" }` |
| `/api/visites/{id}/end` | POST | End active visit | `{}` | `{ "status": "string", "message": "string", "visite": VisiteDTO }` |

## Data Models (DTOs)

### User (UtilisateurDTO)
```typescript
interface UtilisateurDTO {
  idUtilisateur: string; // UUID
  nom: string;
  prenom: string;
  identifiant: string;
  role: string; // "AGENT", "MEDECIN", or "ADMIN"
  email: string;
  sexe: string;
  dateNaissance: string; // ISO date format
  telephone: string;
  adresse: string;
  ville: string;
  pays: string;
  dateCreation: string; // ISO datetime
  estDesactive: boolean;
  raisonDesactivation?: string;
}
```

### Patient (PatientDTO)
```typescript
interface PatientDTO {
  idPatient: string; // UUID
  ipp: string; // Unique patient identifier (format: P000001)
  nom: string;
  prenom: string;
  dateNaissance: string; // ISO date format
  lieuNaissance: string;
  sexe: string;
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  cin: string; // National ID
  nationalite: string;
  etatCivil: string;
  contactUrgencePrenom: string;
  contactUrgenceRelation: string;
  contactUrgenceAdresse: string;
  contactUrgenceTelephone: string;
  typeAdmission: string;
  dateAdmission: string; // ISO date format
  dateCreation: string; // ISO datetime format
}
```

### Visit (VisiteDTO)
```typescript
interface VisiteDTO {
  idVisite: number;
  typeVisite: string; // e.g., "CONSULTATION", "HOSPITALISATION"
  dateDebut: string; // ISO datetime
  dateFin?: string; // ISO datetime, null if visit is active
  statut: string; // "IN_PROGRESS" or "COMPLETED"
  motif: string;
  idMedecin?: string; // UUID, null if no doctor assigned
  service?: string;
  patient: PatientDTO;
}
```

### Document (DocumentImporteDTO)
```typescript
interface DocumentImporteDTO {
  idDocument: number;
  idPatient: string; // UUID
  nomPatient: string;
  prenomPatient: string;
  ippPatient: string;
  nom: string; // Document name
  description?: string;
  typeDocument: string;
  dateAjout: string; // ISO datetime
  url: string; // Document URL in storage
}
```

## Agent Interface Requirements

For the demo, the AGENT interface should be fully functional with the following features:

### 1. Patient Management
- **Patient Search**: Search box to find patients by name, IPP, etc.
- **Patient Details**: View complete patient information
- **Patient Creation**: Form to add new patients
- **Patient Update**: Ability to modify patient information

### 2. Visit Management
- **Visit List**: View all visits for a patient
- **Active Visits**: Highlight/filter active (ongoing) visits
- **Start Visit**: Button/form to start a new visit for a patient
- **End Visit**: Button to complete an active visit (only visible for active visits)
- **Edit Visit**: Ability to modify visit details (only for active visits)
- **Delete Visit**: Remove a visit (only for active visits)

### 3. Document Management
- **Document Upload**: Interface to upload patient documents
- **Document List**: View all documents for a patient
- **Document View**: Open/view a specific document
- **Document Deletion**: Remove documents from the system

### 4. Interface Elements
- **Navigation**: Clear structure to move between sections
- **Dashboard**: Overview/summary view (can be simple for demo)
- **Tabs**: For patient details, visits, and documents
- **User Info**: Display logged-in user and role
- **Logout**: Ability to sign out

## UI/UX Guidelines

### 1. Role-Based Color Scheme (Optional)
- **AGENT**: Blue-based theme
- **MEDECIN**: Green-based theme (placeholder)
- **ADMIN**: Purple-based theme (placeholder)

### 2. Responsive Design
- Ensure the application works on different screen sizes
- Focus on desktop experience but provide basic mobile compatibility

### 3. Error Handling
- Display meaningful error messages from the backend
- Form validation with clear feedback

### 4. Loading States
- Show loading indicators during API requests
- Handle loading, success, and error states for operations

## Development Environment Setup

### Backend API Base URL
- **Development**: `http://localhost:8080/api`

### Authentication
- All API requests (except login) should include auth info (session or token-based)
- Currently using simple authentication (no JWT yet)

### Document Handling
- Documents are stored in Supabase
- Document URLs are returned in the document DTO
- Frontend should use these URLs to display documents

## Placeholder Pages for Demo

### Doctor (MEDECIN) Placeholder
For users with the MEDECIN role, show a simple placeholder page:

```jsx
function MedecinPlaceholder() {
  return (
    <div className="placeholder-page">
      <h1>Espace Médecin</h1>
      <div className="placeholder-message">
        <p>Cette section est en cours de développement.</p>
        <p>Les fonctionnalités pour les médecins seront disponibles dans une prochaine version.</p>
      </div>
    </div>
  );
}
```

### Admin Placeholder
For users with the ADMIN role, show a simple placeholder page:

```jsx
function AdminPlaceholder() {
  return (
    <div className="placeholder-page">
      <h1>Espace Administrateur</h1>
      <div className="placeholder-message">
        <p>Cette section est en cours de développement.</p>
        <p>Les fonctionnalités d'administration seront disponibles dans une prochaine version.</p>
      </div>
    </div>
  );
}
```

## Implementation Timeline Suggestion

1. **Foundation & Authentication (1-2 days)**
   - Project setup
   - API service layer
   - Authentication and role-based routing
   - Layout structure

2. **Patient Management (2-3 days)**
   - Patient search/listing
   - Patient detail view
   - Patient create/edit forms

3. **Visit Management (2-3 days)**
   - Visit listing
   - Start/end visit functionality
   - Visit edit/delete

4. **Document Management (1-2 days)**
   - Document upload
   - Document listing and viewing
   - Document deletion

5. **Integration & Refinement (1-2 days)**
   - Connect all components
   - Navigation flow
   - Error handling
   - Loading states

6. **Placeholders & Polish (1 day)**
   - Doctor/Admin placeholders
   - UI refinement
   - Final testing

## Testing Notes

### 1. User Accounts for Testing
Create test users in the database with different roles:
- AGENT user: For testing the fully implemented features
- MEDECIN user: For testing the doctor placeholder
- ADMIN user: For testing the admin placeholder

### 2. Test Data
- Create sample patients for testing
- Generate test visits and documents

### 3. API Testing with Postman
- Before implementing UI components, test API endpoints with Postman
- Verify data structures match expected format

## Technical Considerations

### 1. State Management
Consider using a state management solution:
- Context API + useReducer for simpler applications
- Redux or MobX for more complex state

### 2. Form Handling
Patient and visit forms have complex validation requirements:
- Consider using Formik or React Hook Form
- Implement validation based on backend requirements

### 3. API Integration
- Create a centralized API service layer
- Handle API errors consistently
- Consider using React Query for data fetching

### 4. Authentication
- Store user information in secure storage
- Implement protected routes
- Handle session expiration

## Demo Preparation

For the demo presentation, have the following scenarios ready:

1. **Multi-Role Login**
   - Show login as different user types
   - Demonstrate the role-based routing

2. **Patient Workflow**
   - Create a new patient
   - Search for and view patient details
   - Update patient information

3. **Visit Management**
   - Start a new visit for a patient
   - View active visits
   - End a visit
   - Show edit/delete functionality

4. **Document Handling**
   - Upload documents to patient records
   - View and manage documents

## Conclusion

This guide provides a comprehensive overview of the H-DOC frontend requirements and integration with the existing backend. Focus first on the AGENT interface functionality, as this is the primary demo target. The placeholder pages for MEDECIN and ADMIN roles allow for a complete demonstration of the system's intended multi-role architecture while prioritizing development time on the core features.

If you have any questions or need clarification on any aspect of this guide, please contact the backend development team.