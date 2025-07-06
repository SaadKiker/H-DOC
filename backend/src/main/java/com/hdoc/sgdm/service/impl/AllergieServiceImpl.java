package com.hdoc.sgdm.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hdoc.sgdm.dto.request.AllergieRequest;
import com.hdoc.sgdm.dto.response.AllergieDTO;
import com.hdoc.sgdm.dto.response.AllergieListResponse;
import com.hdoc.sgdm.dto.response.AllergieResponse;
import com.hdoc.sgdm.entity.Allergie;
import com.hdoc.sgdm.entity.Patient;
import com.hdoc.sgdm.repository.AllergieRepository;
import com.hdoc.sgdm.repository.PatientRepository;
import com.hdoc.sgdm.service.AllergieService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AllergieServiceImpl implements AllergieService {

    private final AllergieRepository allergieRepository;
    private final PatientRepository patientRepository;
    private static final Logger log = LoggerFactory.getLogger(AllergieServiceImpl.class);
    
    @Autowired
    public AllergieServiceImpl(AllergieRepository allergieRepository, PatientRepository patientRepository) {
        this.allergieRepository = allergieRepository;
        this.patientRepository = patientRepository;
    }
    
    /**
     * Convert entity to DTO
     */
    private AllergieDTO convertToDTO(Allergie allergie) {
        try {
            if (allergie == null) {
                log.warn("Attempting to convert null allergie to DTO");
                return null;
            }
            
            if (allergie.getPatient() == null) {
                log.warn("Allergie has null patient: {}", allergie.getIdAllergie());
                return null;
            }
            
            return AllergieDTO.builder()
                    .idAllergie(allergie.getIdAllergie())
                    .idPatient(allergie.getPatient().getIdPatient())
                    .allergene(allergie.getAllergene())
                    .typeAllergie(allergie.getTypeAllergie())
                    .gravite(allergie.getGravite())
                    .reaction(allergie.getReaction())
                    .dateDiagnostic(allergie.getDateDiagnostic())
                    .remarques(allergie.getRemarques())
                    .createdAt(allergie.getCreatedAt())
                    .build();
        } catch (Exception e) {
            log.error("Error converting allergie to DTO: {}", allergie, e);
            return null;
        }
    }
    
    @Override
    public AllergieListResponse getAllergiesByPatient(UUID idPatient) {
        try {
            // Verify patient exists
            if (idPatient == null) {
                log.warn("Null patient ID passed to getAllergiesByPatient");
                return AllergieListResponse.builder()
                        .success(false)
                        .message("ID patient invalide")
                        .allergies(null)
                        .build();
            }
            
            // Verify patient exists in database
            boolean patientExists = patientRepository.existsById(idPatient);
            if (!patientExists) {
                log.warn("Patient not found with ID: {}", idPatient);
                return AllergieListResponse.builder()
                        .success(false)
                        .message("Patient non trouvé")
                        .allergies(null)
                        .build();
            }
            
            log.info("Fetching allergies for patient {}", idPatient);
            List<Allergie> allergies = allergieRepository.findByPatientIdPatient(idPatient);
            log.info("Found {} allergies for patient {}", allergies.size(), idPatient);
            
            List<AllergieDTO> allergieDTOs = allergies.stream()
                    .map(this::convertToDTO)
                    .filter(dto -> dto != null) // Filter out any null DTOs
                    .collect(Collectors.toList());
            
            return AllergieListResponse.builder()
                    .success(true)
                    .message("Allergies récupérées avec succès")
                    .allergies(allergieDTOs)
                    .build();
        } catch (Exception e) {
            log.error("Error retrieving allergies for patient {}", idPatient, e);
            return AllergieListResponse.builder()
                    .success(false)
                    .message("Erreur lors de la récupération des allergies: " + e.getMessage())
                    .allergies(null)
                    .build();
        }
    }
    
    @Override
    @Transactional
    public AllergieResponse createAllergie(AllergieRequest request) {
        try {
            // Log request for debugging
            UUID patientId = request.getIdPatient();
            if (patientId == null) {
                return AllergieResponse.builder()
                        .success(false)
                        .message("ID patient invalide ou manquant")
                        .build();
            }
            
            // Find patient
            Optional<Patient> patientOpt = patientRepository.findById(patientId);
            if (patientOpt.isEmpty()) {
                return AllergieResponse.builder()
                        .success(false)
                        .message("Patient non trouvé")
                        .build();
            }
            
            // Safely get reaction string
            String reaction = null;
            if (request.getReactions() != null && !request.getReactions().isEmpty()) {
                reaction = String.join(", ", request.getReactions());
            } else {
                reaction = request.getReaction(); // This might be null
            }
            
            // Create new allergie
            Allergie allergie = Allergie.builder()
                    .patient(patientOpt.get())
                    .allergene(request.getAllergene())
                    .typeAllergie(request.getTypeAllergie())
                    .gravite(request.getGravite())
                    .reaction(reaction)
                    .dateDiagnostic(request.getDateDiagnostic())
                    .remarques(request.getRemarques())
                    .createdAt(LocalDateTime.now())
                    .build();
            
            // Save to database
            allergie = allergieRepository.save(allergie);
            
            return AllergieResponse.builder()
                    .success(true)
                    .message("Allergie créée avec succès")
                    .allergie(convertToDTO(allergie))
                    .build();
            
        } catch (Exception e) {
            return AllergieResponse.builder()
                    .success(false)
                    .message("Erreur lors de la création de l'allergie: " + e.getMessage())
                    .build();
        }
    }
    
    @Override
    @Transactional
    public AllergieResponse updateAllergie(Long idAllergie, AllergieRequest request) {
        try {
            // Find allergie
            Optional<Allergie> allergieOpt = allergieRepository.findById(idAllergie);
            if (allergieOpt.isEmpty()) {
                return AllergieResponse.builder()
                        .success(false)
                        .message("Allergie non trouvée")
                        .build();
            }
            
            // Find patient if changed
            Patient patient = allergieOpt.get().getPatient();
            if (!patient.getIdPatient().equals(request.getIdPatient())) {
                Optional<Patient> newPatientOpt = patientRepository.findById(request.getIdPatient());
                if (newPatientOpt.isEmpty()) {
                    return AllergieResponse.builder()
                            .success(false)
                            .message("Patient non trouvé")
                            .build();
                }
                patient = newPatientOpt.get();
            }
            
            // Update allergie
            Allergie allergie = allergieOpt.get();
            allergie.setPatient(patient);
            allergie.setAllergene(request.getAllergene());
            allergie.setTypeAllergie(request.getTypeAllergie());
            allergie.setGravite(request.getGravite());
            allergie.setReaction(request.getReaction());
            allergie.setDateDiagnostic(request.getDateDiagnostic());
            allergie.setRemarques(request.getRemarques());
            
            // Save to database
            allergie = allergieRepository.save(allergie);
            
            return AllergieResponse.builder()
                    .success(true)
                    .message("Allergie mise à jour avec succès")
                    .allergie(convertToDTO(allergie))
                    .build();
            
        } catch (Exception e) {
            return AllergieResponse.builder()
                    .success(false)
                    .message("Erreur lors de la mise à jour de l'allergie: " + e.getMessage())
                    .build();
        }
    }
    
    @Override
    @Transactional
    public AllergieResponse deleteAllergie(Long idAllergie) {
        try {
            // Find allergie
            Optional<Allergie> allergieOpt = allergieRepository.findById(idAllergie);
            if (allergieOpt.isEmpty()) {
                return AllergieResponse.builder()
                        .success(false)
                        .message("Allergie non trouvée")
                        .build();
            }
            
            // Delete allergie
            allergieRepository.deleteById(idAllergie);
            
            return AllergieResponse.builder()
                    .success(true)
                    .message("Allergie supprimée avec succès")
                    .build();
            
        } catch (Exception e) {
            return AllergieResponse.builder()
                    .success(false)
                    .message("Erreur lors de la suppression de l'allergie: " + e.getMessage())
                    .build();
        }
    }
} 