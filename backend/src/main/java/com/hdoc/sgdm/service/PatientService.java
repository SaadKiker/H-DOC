package com.hdoc.sgdm.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hdoc.sgdm.dto.common.CurrentUser;
import com.hdoc.sgdm.dto.common.PatientDTO;
import com.hdoc.sgdm.dto.request.CreatePatientRequest;
import com.hdoc.sgdm.dto.request.UpdatePatientRequest;
import com.hdoc.sgdm.dto.response.PatientResponse;
import com.hdoc.sgdm.dto.response.PatientSearchResponse;
import com.hdoc.sgdm.entity.Patient;
import com.hdoc.sgdm.mapper.PatientMapper;
import com.hdoc.sgdm.repository.PatientRepository;
import com.hdoc.sgdm.repository.VisiteRepository;
import com.hdoc.sgdm.util.IPPGenerator;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final VisiteRepository visiteRepository;
    private final IPPGenerator ippGenerator;

    @Transactional
    public PatientResponse createPatient(CreatePatientRequest request) {
        // Check if patient with this email already exists
        Optional<Patient> existingPatientByEmail = patientRepository.findByEmail(request.getEmail());
        if (existingPatientByEmail.isPresent()) {
            return PatientMapper.toErrorResponse("Un patient avec cet email existe déjà");
        }
        
        // Check if patient with this CIN already exists
        Optional<Patient> existingPatientByCin = patientRepository.findByCin(request.getCin());
        if (existingPatientByCin.isPresent()) {
            return PatientMapper.toErrorResponse("Un patient avec ce CIN existe déjà");
        }
        
        // Convert request directly to entity using mapper
        Patient patient = PatientMapper.fromCreateRequest(request);
        
        // Generate and set IPP
        patient.setIpp(ippGenerator.generateIPP());
        
        // Save patient to database
        Patient savedPatient = patientRepository.save(patient);
        
        // Return success response
        return PatientMapper.toSuccessResponse(savedPatient, "Patient créé avec succès");
    }
    
    @Transactional(readOnly = true)
    public PatientResponse getPatientByIpp(String ipp) {
        Optional<Patient> optionalPatient = patientRepository.findByIpp(ipp);
        if (optionalPatient.isEmpty()) {
            return PatientMapper.toErrorResponse("Aucun patient trouvé avec l'IPP: " + ipp);
        }
        
        Patient patient = optionalPatient.get();
        return PatientMapper.toSuccessResponse(patient, "Patient trouvé");
    }

    @Transactional(readOnly = true)
    public PatientSearchResponse searchPatients(String query, CurrentUser currentUser) {
        // For AGENT and ADMIN roles, no filtering needed
        if (currentUser == null || "AGENT".equals(currentUser.getRole()) || "ADMIN".equals(currentUser.getRole())) {
            // Use the original search logic
            return searchAllPatients(query);
        }
        
        // For MEDECIN role, filter patients based on doctor-patient relationship
        if ("MEDECIN".equals(currentUser.getRole()) && currentUser.getIdMedecin() != null) {
            // Instead of getting all patients first, we now directly filter by doctor ID in the database
            List<UUID> doctorIds = Collections.singletonList(currentUser.getIdMedecin());
            
            // Check if this doctor has any patients at all (for improved user messaging)
            if (patientRepository.findPatientsByDoctorId(currentUser.getIdMedecin()).isEmpty()) {
                return PatientMapper.toEmptySearchResponse("Aucun patient trouvé avec une relation établie avec ce médecin");
            }
            
            // Filter the search results against the doctor's patients at the database level
            return searchPatientsWithRelationship(query, doctorIds);
        }
        
        // Default case - empty results (unknown role or no proper identification)
        return PatientMapper.toEmptySearchResponse("Recherche non autorisée pour ce rôle d'utilisateur");
    }
    
    // Original search logic moved to this method
    private PatientSearchResponse searchAllPatients(String query) {
        List<Patient> results = new ArrayList<>();
        String trimmedQuery = query != null ? query.trim() : "";
        
        // If query is empty, return all patients
        if (trimmedQuery.isEmpty()) {
            List<Patient> allPatients = patientRepository.findAll();
            List<PatientDTO> patientDTOs = PatientMapper.toPatientDTOList(allPatients);
            return PatientMapper.toSearchResponse(patientDTOs, "Tous les patients");
        }
        
        // Search by IPP (exact match only)
        Optional<Patient> patientByIpp = patientRepository.findByIpp(trimmedQuery);
        if (patientByIpp.isPresent()) {
            results.add(patientByIpp.get());
            // Return immediately for IPP exact match to prevent further searches
            List<PatientDTO> patientDTOs = PatientMapper.toPatientDTOList(results);
            return PatientMapper.toSearchResponse(patientDTOs, "Patient trouvé par IPP: " + trimmedQuery);
        }
        
        // Search by CIN
        Optional<Patient> patientByCin = patientRepository.findByCin(trimmedQuery);
        if (patientByCin.isPresent()) {
            results.add(patientByCin.get());
        }
        
        // Search by name (nom or prenom)
        List<Patient> patientsByNom = patientRepository.findByNomContainingIgnoreCase(trimmedQuery);
        List<Patient> patientsByPrenom = patientRepository.findByPrenomContainingIgnoreCase(trimmedQuery);
        
        // Add all results, avoiding duplicates
        patientsByNom.stream()
            .filter(patient -> !results.contains(patient))
            .forEach(results::add);
        
        patientsByPrenom.stream()
            .filter(patient -> !results.contains(patient))
            .forEach(results::add);
        
        List<PatientDTO> patientDTOs = PatientMapper.toPatientDTOList(results);
        
        if (patientDTOs.isEmpty()) {
            return PatientMapper.toEmptySearchResponse("Aucun patient trouvé pour la recherche: " + trimmedQuery);
        }
        
        return PatientMapper.toSearchResponse(patientDTOs, 
                "Recherche terminée: " + patientDTOs.size() + " patient(s) trouvé(s)");
    }
    
    // Filtered search for doctors, only showing patients with established relationship
    private PatientSearchResponse searchPatientsWithRelationship(String query, List<UUID> doctorIds) {
        List<Patient> results = new ArrayList<>();
        String trimmedQuery = query != null ? query.trim() : "";
        UUID doctorId = null;
        
        // First element is the doctorId
        if (!doctorIds.isEmpty()) {
            doctorId = doctorIds.get(0);
        }
        
        // Safety check - if doctorId is null, return empty results
        if (doctorId == null) {
            return PatientMapper.toEmptySearchResponse("Erreur: Identifiant de médecin non valide");
        }
        
        // If query is empty, return all allowed patients
        if (trimmedQuery.isEmpty()) {
            List<Patient> allPatients = patientRepository.findPatientsByDoctorId(doctorId);
            List<PatientDTO> patientDTOs = PatientMapper.toPatientDTOList(allPatients);
            return PatientMapper.toSearchResponse(patientDTOs, 
                    "Patients avec relation établie: " + patientDTOs.size() + " patient(s)");
        }
        
        // Search by IPP (exact match only) - but only include if has relationship with doctor
        Optional<Patient> patientByIpp = patientRepository.findByIppAndDoctorId(trimmedQuery, doctorId);
        if (patientByIpp.isPresent()) {
            results.add(patientByIpp.get());
            // Return immediately for IPP exact match
            List<PatientDTO> patientDTOs = PatientMapper.toPatientDTOList(results);
            return PatientMapper.toSearchResponse(patientDTOs, "Patient trouvé par IPP: " + trimmedQuery);
        }
        
        // Search by CIN - but only include if has relationship with doctor
        Optional<Patient> patientByCin = patientRepository.findByCinAndDoctorId(trimmedQuery, doctorId);
        if (patientByCin.isPresent()) {
            results.add(patientByCin.get());
        }
        
        // Search by name (nom or prenom) with doctor relationship constraint
        List<Patient> patientsByNom = patientRepository.findByNomContainingIgnoreCaseAndDoctorId(trimmedQuery, doctorId);
        List<Patient> patientsByPrenom = patientRepository.findByPrenomContainingIgnoreCaseAndDoctorId(trimmedQuery, doctorId);
        
        // Add patients from name search, avoiding duplicates
        patientsByNom.stream()
            .filter(patient -> !results.contains(patient))
            .forEach(results::add);
        
        patientsByPrenom.stream()
            .filter(patient -> !results.contains(patient))
            .forEach(results::add);
        
        List<PatientDTO> patientDTOs = PatientMapper.toPatientDTOList(results);
        
        if (patientDTOs.isEmpty()) {
            return PatientMapper.toEmptySearchResponse("Aucun patient associé trouvé pour la recherche: " + trimmedQuery);
        }
        
        return PatientMapper.toSearchResponse(patientDTOs, 
                "Recherche terminée: " + patientDTOs.size() + " patient(s) trouvé(s)");
    }
    
    @Transactional(readOnly = true)
    public PatientSearchResponse searchPatients(String query) {
        // Call the new method with null CurrentUser (for backward compatibility)
        return searchPatients(query, null);
    }
    
    @Transactional
    public PatientResponse updatePatient(UpdatePatientRequest request) {
        try {
            // Check if patient exists using IPP
            Optional<Patient> optionalPatient = patientRepository.findByIpp(request.getIpp());
            if (optionalPatient.isEmpty()) {
                return PatientMapper.toErrorResponse("Aucun patient trouvé avec cet IPP");
            }
            
            Patient existingPatient = optionalPatient.get();
            
            // Use the mapper to get a copy with all non-sensitive fields updated
            Patient updatedPatient = PatientMapper.updatePatientFromRequest(existingPatient, request);
            
            // Handle email update with validation
            if (request.getEmail() != null && !request.getEmail().equals(existingPatient.getEmail())) {
                // Check if another patient has this email
                Optional<Patient> patientWithEmail = patientRepository.findByEmail(request.getEmail());
                if (patientWithEmail.isPresent() && !patientWithEmail.get().getIdPatient().equals(existingPatient.getIdPatient())) {
                    return PatientMapper.toErrorResponse("Un patient avec cet email existe déjà");
                }
                updatedPatient.setEmail(request.getEmail());
            }
            
            // Handle CIN update with validation
            if (request.getCin() != null && !request.getCin().equals(existingPatient.getCin())) {
                // Check if another patient has this CIN
                Optional<Patient> patientWithCin = patientRepository.findByCin(request.getCin());
                if (patientWithCin.isPresent() && !patientWithCin.get().getIdPatient().equals(existingPatient.getIdPatient())) {
                    return PatientMapper.toErrorResponse("Un patient avec ce CIN existe déjà");
                }
                updatedPatient.setCin(request.getCin());
            }
            
            // Save the updated patient
            Patient savedPatient = patientRepository.save(updatedPatient);
            
            // Return success response
            return PatientMapper.toSuccessResponse(savedPatient, "Informations du patient mises à jour avec succès");
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // This catches database constraint violations like duplicate keys
            return PatientMapper.toErrorResponse("Contrainte de base de données violée: l'email ou le CIN est déjà utilisé");
        } catch (org.springframework.orm.jpa.JpaSystemException e) {
            // This catches JPA/Hibernate specific exceptions
            return PatientMapper.toErrorResponse("Erreur de persistence: " + e.getMessage());
        } catch (Exception e) {
            // Generic fallback
            return PatientMapper.toErrorResponse("Erreur lors de la mise à jour du patient: " + e.getMessage());
        }
    }
}