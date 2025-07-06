# H-DOC Project Progress Tracker

<!-- 
NOTE TO FUTURE DEVELOPERS AND CLAUDE: 
This PROGRESS.md file serves as a historical record of the development process.
When updating, please follow these guidelines:

1. APPEND NEW CONTENT: Add new completed features under appropriate sections or create new sections
2. PRESERVE HISTORY: Do not remove existing content - this file tracks the full project journey
3. UPDATE DATES: When adding new content, update the "Current Progress" date at the top
4. ADD API ENDPOINTS: When implementing new endpoints, add them to the API Endpoints table
5. MARK COMPLETIONS: Use the ✅ emoji to mark completed items

This approach ensures we maintain a chronological record of development progress.
-->

## Project Overview

H-DOC (Système de Gestion des Dossiers Médicaux - SGDM) is a medical records management system with:
- Backend: Spring Boot REST API
- Frontend: React.js application (separate repository)
- Database: PostgreSQL hosted on Supabase

## Project Structure

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

## API Endpoints

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/auth/login` | POST | User authentication with role information | ✅ Implemented |
| `/api/patients/new` | POST | Create new patient | ✅ Implemented |
| `/api/patients` | GET | Search patients | ✅ Implemented |
| `/api/patients/{ipp}/modify` | PUT | Update patient information | ✅ Implemented |
| `/api/patients/{ipp}/documents/upload` | POST | Upload document for patient | ✅ Implemented |
| `/api/patients/{ipp}/documents` | GET | Get all documents for a patient | ✅ Implemented |
| `/api/documents/{id}` | GET | Get specific document | ✅ Implemented |
| `/api/documents/{id}` | DELETE | Delete document | ✅ Implemented |
| `/api/patients/{ipp}/visites/new` | POST | Start a new visit for patient | ✅ Implemented |
| `/api/patients/{ipp}/visites` | GET | Get all visits for a patient | ✅ Implemented |
| `/api/patients/{ipp}/visites/active` | GET | Get active visits for a patient | ✅ Implemented |
| `/api/visites/{id}` | GET | Get specific visit | ✅ Implemented |
| `/api/visites/{id}` | PUT | Update visit information | ✅ Implemented |
| `/api/visites/{id}` | DELETE | Delete a visit | ✅ Implemented |
| `/api/visites/{id}/end` | POST | End an active visit | ✅ Implemented |
| `/api/visites/active` | GET | Get all active visits with count | ✅ Implemented |
| `/api/visites/completed/today` | GET | Get all visits completed on a specific day with count (defaults to today) | ✅ Implemented |
| `/api/medecins` | GET | Get all doctors (optional speciality or status filter) | ✅ Implemented |
| `/api/medecins/{id}/active-visits` | GET | Get count of active visits for a doctor | ✅ Implemented |
| `/api/medecins/{id}/status` | PUT | Update a doctor's availability status | ✅ Implemented |
| `/api/medecins/{id}/visites/active` | GET | Get the active visit for a specific doctor | ✅ Implemented |
| `/api/specialites` | GET | Get all medical specialties (with optional filterable param) | ✅ Implemented |

## Current Progress (as of April 15, 2025)

### Database Schema Update
1. ✅ Updated database schema to include new tables and relationships:
   - Added `rendez_vous` table for appointment scheduling
   - Added `facture` table for billing management
   - Added `id_visite` field to `document_importe` table
   - Modified database relationships for better data integrity
   - Removed `portail_patient` table (patient portal now managed differently)
   - Added `couverture_type` to patient table for insurance information

### Doctor Management
1. ✅ Implemented doctor assignment functionality
   - Created Medecin entity and repository for doctor information
   - Created Specialite entity and repository for medical specialties
   - Enhanced VisiteDTO to include doctor details (name, specialty)
   - Added endpoints to retrieve doctors and filter by specialty
   - Integrated doctor information with visits
   - Added proper mapping between doctors and visits
   
2. ✅ Added doctor availability management
   - Added status field to track doctor availability (AVAILABLE, UNAVAILABLE, ON_LEAVE, SICK)
   - Created endpoint to update doctor status
   - Enhanced doctor listing to filter by availability status
   - Tracking of doctor workload via active visits count
   - Only available doctors are shown for visit assignments
   
3. ✅ Resolved doctor assignment issues
   - Fixed visit creation to properly assign doctors
   - Implemented automatic doctor status updates when assigned/unassigned
   - Enhanced data loading to ensure doctor details appear in visit information
   - Added speciality filtering with GEN specialty exclusion
   - Optimized database queries for doctor information retrieval
   
4. ✅ Enhanced doctor workflow management
   - Added endpoint to retrieve the active visit for a specific doctor
   - Improved doctor workload tracking and visit assignment
   - Streamlined doctor-patient interaction workflow

### Visit Management
1. ✅ Implemented visit functionality
   - Created Visite entity and repository with appropriate relationships
   - Implemented start visit endpoint for patients
   - Added ability to retrieve visits by patient, including active visits
   - Integrated document system with visit entity
   - Documents are no longer associated with visits
   - Added proper validation and error handling
   - Added functionality to end visits with automatic date/time tracking
   - Added functionality to edit and delete visits
2. ✅ Visit status management
   - Automatic tracking of visit start time
   - Support for different visit statuses (IN_PROGRESS, COMPLETED)
   - Support for different visit types (CONSULTATION, HOSPITALISATION, etc.)
   - Ability to distinguish between active and completed visits
   - Support for optional doctor association (idMedecin field can be null until doctor functionality is implemented)
3. ✅ Dashboard functionality for monitoring visits
   - Added endpoint to get all active visits with count
   - Added endpoint to get completed visits by date with count
   - Support for viewing historical completed visits by date
   - Solved the midnight boundary issue for date-based queries

### Document Management
1. ✅ Implemented document upload functionality
   - Created DocumentImporte entity and repository
   - Integrated with Supabase storage bucket (development mode)
   - Added endpoints for uploading, retrieving, and deleting documents
2. ✅ Added document validation
   - Required fields validation
   - Proper error handling
3. ✅ Created document association with patients
   - One-to-many relationship between Patient and DocumentImporte
   - Proper database mapping with JPA/Hibernate
   - Removed association between documents and visits (March 30, 2025)

### Backend Setup
1. ✅ Project initialized with Spring Boot 3.4.4
2. ✅ Connected to Supabase PostgreSQL database
3. ✅ Spring Security temporarily removed for initial development 

### Authentication
1. ✅ Created User authentication system:
   - Created Utilisateur entity with repository 
   - Implemented login endpoint with simple authentication
   - Added validation for login requests
   - Included user role information in login response (AGENT, MEDECIN, ADMIN)
   - Role-based routing will be handled by the frontend
   - Tested login functionality successfully

### Database
1. ✅ Database schema created in Supabase with 15 tables:
   - Core tables: utilisateur, patient, medecin, specialite
   - Visit tables: visite, ordonnance, prescription, medicament, rendez_vous, facture
   - Document tables: document_importe
   - Form tables: modeles_formulaires, sections_formulaires, champs_formulaires, formulaires_patients, reponses_formulaires

<!-- 
DATABASE SCHEMA (PostgreSQL)

champs_formulaires:
- id_champ (PK)
- id_section (FK -> sections_formulaires)
- nom
- est_obligatoire
- type_champ
- placeholder
- ordre_affichage
- valeurs_possibles
- unite

document_importe:
- id_document (PK)
- id_patient (FK -> patient)
- nom
- description
- type_document
- date_ajout
- url
- id_visite (FK -> visite)

formulaires_patients:
- id_formulaire (PK)
- id_patient (FK -> patient)
- id_modele (FK -> modeles_formulaires)
- status
- id_medecin (FK -> medecin)
- id_visite (FK -> visite)
- date_remplissage

medecin:
- id_medecin (PK)
- id_specialite (FK -> specialite)
- id_medecin (FK -> utilisateur)

medicament:
- id_medicament (PK)
- nom (unique)
- description

modeles_formulaires:
- id_modele (PK)
- nom
- description
- id_specialite (FK -> specialite)

ordonnance:
- id_ordonnance (PK)
- id_patient (FK -> patient)
- id_visite (FK -> visite)
- id_medecin (FK -> medecin)
- date_creation
- url

patient:
- id_patient (PK, UUID)
- ipp (unique)
- nom
- prenom
- date_naissance
- lieu_naissance
- sexe
- adresse
- ville
- telephone
- nationalite
- etat_civil
- email (unique)
- cin
- contact_urgence_prenom
- contact_urgence_relation
- contact_urgence_adresse
- contact_urgence_telephone
- type_admission
- date_admission
- date_creation
- couverture_type

prescription:
- id_prescription (PK)
- id_medicament (FK -> medicament)
- id_ordonnance (FK -> ordonnance)
- dosage
- unite_dosage
- route
- frequence
- instructions
- date_debut
- duree
- duree_unite

reponses_formulaires:
- id_reponse (PK)
- id_formulaire (FK -> formulaires_patients)
- id_champ (FK -> champs_formulaires)
- valeur
- id_section (FK -> sections_formulaires)

sections_formulaires:
- id_section (PK)
- id_modele (FK -> modeles_formulaires)
- nom
- description
- ordre_affichage
- id_parent_section (FK -> sections_formulaires self-reference)

specialite:
- id_specialite (PK)
- code_specialite
- nom (unique)
- description

utilisateur:
- id_utilisateur (PK, UUID)
- nom
- prenom
- identifiant (unique)
- mot_de_passe
- role
- email
- sexe
- date_naissance
- telephone
- adresse
- ville
- pays
- date_creation
- est_desactive
- raison_desactivation

visite:
- id_visite (PK)
- id_patient (FK -> patient)
- id_medecin (FK -> medecin)
- date_debut
- date_fin
- statut
- motif
- type_visite
- service
- id_rdv (FK -> rendez_vous)

rendez_vous:
- id_rdv (PK)
- id_patient (FK -> patient)
- id_medecin (FK -> medecin)
- date_heure
- duration_minutes
- status
- note

facture:
- id_facture (PK)
- id_patient (FK -> patient)
- id_visite (FK -> visite)
- montant
- mode_paiement
- status
- date_facturation
-->

### Patient Management
1. ✅ Created Patient entity with repository
2. ✅ Implemented patient creation with validation
   - Unique constraints for email and CIN
   - Data validation for required fields
   - Automatic IPP generation in format P000001
3. ✅ Implemented patient search functionality
   - Search by name, CIN, or partial text
   - Return formatted response with consistent structure
4. ✅ Implemented patient information update
   - Validation to prevent duplicate emails/CINs
   - Error handling for constraint violations
   - Field-by-field updates for patient information
5. ✅ Implemented document management for patients
   - Upload documents to Supabase storage bucket
   - Associate documents with patients in the database
   - Get all documents for a specific patient
   - Retrieve and delete specific documents

## Technical Notes

- Spring Security will be re-added later when basic functionality is stable
- Password encryption is not yet implemented for development simplicity
- Frontend expects JSON responses with consistent structure
- All API endpoints will be under /api/* path prefix
- Login endpoint returns user details on successful authentication

## Recent Changes

### April 15, 2025
- Updated database schema with significant changes:
  - Added new tables: `rendez_vous` and `facture` for appointment and billing management
  - Added relationship between documents and visits via `id_visite` FK in `document_importe`
  - Removed `portail_patient` table as patient portal is now managed differently
  - Added `couverture_type` to patient table for insurance coverage information
  - Enhanced database structure for better data integrity and new feature support

### April 2, 2025
- Removed 'lieu' attribute from the Visite entity:
  - Updated entity class, DTOs, mappers and service classes
  - Simplified visit data model by removing unnecessary field
  - Maintained backward compatibility with existing functionality

### March 31, 2025
- Enhanced dashboard functionality with date-aware visit monitoring:
  - Updated `/api/visites/completed/today` endpoint to accept an optional date parameter
  - Added ability to view completed visits for any specific date
  - Solved the midnight boundary issue for monitoring completed visits
  - Maintained backward compatibility with existing implementations
  - Improved documentation for frontend integration

### March 30, 2025
- Added dashboard functionality for monitoring visits:
  - Created new endpoint `/api/visites/active` for all active visits across all patients
  - Created new endpoint `/api/visites/completed/today` for all visits completed today
  - Added count information to all visit list responses
  - Modified existing endpoints to include visit counters
  - Useful for dashboards showing real-time hospital activity

- Clarified role-based user routing:
  - Confirmed login endpoint already returns user role (AGENT, MEDECIN, ADMIN)
  - Frontend will handle routing based on the role received
  - Simplified backend implementation by removing unnecessary endpoints
  
- Added edit and delete functionality for visits:
  - Created new endpoints `/api/visites/{id}` (PUT and DELETE methods)
  - Implemented service methods to update and delete visits
  - Added validation to prevent modifying or deleting completed visits
  - Added proper error handling for invalid operations

- Added functionality to end visits:
  - Created new endpoint `/api/visites/{id}/end`
  - Implemented service method to update visit status and end date
  - Added validation to prevent ending already completed visits
  - Automatic date/time tracking for visit completion

- Removed association between documents and visits:
  - Updated document entity to remove visit relationship
  - Updated visit entity to remove documents collection
  - Modified DTOs and service classes to reflect this change
  - Documents are now only associated with patients