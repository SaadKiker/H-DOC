package com.hdoc.sgdm.service;

import com.hdoc.sgdm.dto.request.PrescriptionRequest;
import com.hdoc.sgdm.dto.response.MedicamentDTO;
import com.hdoc.sgdm.dto.response.PrescriptionDTO;
import com.hdoc.sgdm.entity.Medicament;
import com.hdoc.sgdm.entity.Ordonnance;
import com.hdoc.sgdm.entity.Prescription;
import com.hdoc.sgdm.exception.ResourceNotFoundException;
import com.hdoc.sgdm.repository.MedicamentRepository;
import com.hdoc.sgdm.repository.OrdonnanceRepository;
import com.hdoc.sgdm.repository.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PrescriptionService {
    private static final Logger logger = LoggerFactory.getLogger(PrescriptionService.class);
    
    private final PrescriptionRepository prescriptionRepository;
    private final OrdonnanceRepository ordonnanceRepository;
    private final MedicamentRepository medicamentRepository;
    
    /**
     * Add a new prescription to an existing ordonnance
     * 
     * @param idOrdonnance Ordonnance ID
     * @param request Prescription request data
     * @return The created prescription
     */
    @Transactional
    public PrescriptionDTO addPrescriptionToOrdonnance(Long idOrdonnance, PrescriptionRequest request) {
        // Verify ordonnance exists
        Ordonnance ordonnance = ordonnanceRepository.findById(idOrdonnance)
                .orElseThrow(() -> new ResourceNotFoundException("Ordonnance not found with ID: " + idOrdonnance));
        
        // Verify medicament exists
        Medicament medicament = medicamentRepository.findById(request.getIdMedicament())
                .orElseThrow(() -> new ResourceNotFoundException("Medicament not found with ID: " + request.getIdMedicament()));
        
        // Create and save the prescription
        Prescription prescription = Prescription.builder()
                .ordonnance(ordonnance)
                .medicament(medicament)
                .dosage(request.getDosage())
                .uniteDosage(request.getUniteDosage())
                .route(request.getRoute())
                .frequence(request.getFrequence())
                .instructions(request.getInstructions())
                .dateDebut(request.getDateDebut())
                .duree(request.getDuree())
                .dureeUnite(request.getDureeUnite())
                .build();
        
        Prescription savedPrescription = prescriptionRepository.save(prescription);
        
        // Map to DTO and return
        return mapToPrescriptionDTO(savedPrescription);
    }
    
    /**
     * Get all prescriptions for an ordonnance
     * 
     * @param idOrdonnance Ordonnance ID
     * @return List of prescriptions
     */
    public List<PrescriptionDTO> getPrescriptionsForOrdonnance(Long idOrdonnance) {
        // Verify ordonnance exists
        Ordonnance ordonnance = ordonnanceRepository.findById(idOrdonnance)
                .orElseThrow(() -> new ResourceNotFoundException("Ordonnance not found with ID: " + idOrdonnance));
        
        // Get prescriptions
        List<Prescription> prescriptions = prescriptionRepository.findAllByOrdonnance(ordonnance);
        
        // Map to DTOs and return
        return prescriptions.stream()
                .map(this::mapToPrescriptionDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Update an existing prescription
     * 
     * @param idPrescription Prescription ID
     * @param request Updated prescription data
     * @return The updated prescription
     */
    @Transactional
    public PrescriptionDTO updatePrescription(Integer idPrescription, PrescriptionRequest request) {
        // Find the prescription
        Prescription prescription = prescriptionRepository.findById(idPrescription)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with ID: " + idPrescription));
        
        // Verify medicament exists if it's being changed
        Medicament medicament;
        if (request.getIdMedicament() != null) {
            medicament = medicamentRepository.findById(request.getIdMedicament())
                    .orElseThrow(() -> new ResourceNotFoundException("Medicament not found with ID: " + request.getIdMedicament()));
            prescription.setMedicament(medicament);
        }
        
        // Update fields
        if (request.getDosage() != null) {
            prescription.setDosage(request.getDosage());
        }
        if (request.getUniteDosage() != null) {
            prescription.setUniteDosage(request.getUniteDosage());
        }
        if (request.getRoute() != null) {
            prescription.setRoute(request.getRoute());
        }
        if (request.getFrequence() != null) {
            prescription.setFrequence(request.getFrequence());
        }
        if (request.getInstructions() != null) {
            prescription.setInstructions(request.getInstructions());
        }
        if (request.getDateDebut() != null) {
            prescription.setDateDebut(request.getDateDebut());
        }
        if (request.getDuree() != null) {
            prescription.setDuree(request.getDuree());
        }
        if (request.getDureeUnite() != null) {
            prescription.setDureeUnite(request.getDureeUnite());
        }
        
        // Save the updated prescription
        Prescription updatedPrescription = prescriptionRepository.save(prescription);
        
        // Map to DTO and return
        return mapToPrescriptionDTO(updatedPrescription);
    }
    
    /**
     * Delete a prescription
     * 
     * @param idPrescription Prescription ID
     */
    @Transactional
    public void deletePrescription(Integer idPrescription) {
        // Verify prescription exists
        if (!prescriptionRepository.existsById(idPrescription)) {
            throw new ResourceNotFoundException("Prescription not found with ID: " + idPrescription);
        }
        
        // Delete the prescription
        prescriptionRepository.deleteById(idPrescription);
    }
    
    /**
     * Convert Prescription entity to DTO
     */
    private PrescriptionDTO mapToPrescriptionDTO(Prescription prescription) {
        MedicamentDTO medicamentDTO = MedicamentDTO.builder()
                .idMedicament(prescription.getMedicament().getIdMedicament())
                .nom(prescription.getMedicament().getNom())
                .description(prescription.getMedicament().getDescription())
                .build();
        
        return PrescriptionDTO.builder()
                .idPrescription(prescription.getIdPrescription())
                .medicament(medicamentDTO)
                .dosage(prescription.getDosage())
                .uniteDosage(prescription.getUniteDosage())
                .route(prescription.getRoute())
                .frequence(prescription.getFrequence())
                .instructions(prescription.getInstructions())
                .dateDebut(prescription.getDateDebut())
                .duree(prescription.getDuree())
                .dureeUnite(prescription.getDureeUnite())
                .build();
    }
} 