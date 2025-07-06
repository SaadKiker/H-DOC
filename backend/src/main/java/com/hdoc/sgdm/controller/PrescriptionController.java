package com.hdoc.sgdm.controller;

import com.hdoc.sgdm.dto.request.PrescriptionRequest;
import com.hdoc.sgdm.dto.response.PrescriptionDTO;
import com.hdoc.sgdm.service.PrescriptionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {
    private static final Logger logger = LoggerFactory.getLogger(PrescriptionController.class);
    
    private final PrescriptionService prescriptionService;
    
    @Autowired
    public PrescriptionController(PrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }
    
    /**
     * Add a new prescription to an existing ordonnance
     * 
     * @param idOrdonnance Ordonnance ID
     * @param request Prescription data
     * @return The created prescription
     */
    @PostMapping("/ordonnance/{idOrdonnance}")
    public ResponseEntity<PrescriptionDTO> addPrescriptionToOrdonnance(
            @PathVariable Long idOrdonnance,
            @RequestBody PrescriptionRequest request) {
        logger.info("Adding new prescription to ordonnance ID: {}", idOrdonnance);
        
        PrescriptionDTO prescription = prescriptionService.addPrescriptionToOrdonnance(idOrdonnance, request);
        
        logger.info("Prescription added successfully to ordonnance ID: {}", idOrdonnance);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(prescription);
    }
    
    /**
     * Get all prescriptions for an ordonnance
     * 
     * @param idOrdonnance Ordonnance ID
     * @return List of prescriptions
     */
    @GetMapping("/ordonnance/{idOrdonnance}")
    public ResponseEntity<List<PrescriptionDTO>> getPrescriptionsForOrdonnance(@PathVariable Long idOrdonnance) {
        logger.info("Fetching prescriptions for ordonnance ID: {}", idOrdonnance);
        
        List<PrescriptionDTO> prescriptions = prescriptionService.getPrescriptionsForOrdonnance(idOrdonnance);
        
        logger.info("Found {} prescription(s) for ordonnance ID: {}", prescriptions.size(), idOrdonnance);
        
        return ResponseEntity.ok(prescriptions);
    }
    
    /**
     * Update an existing prescription
     * 
     * @param idPrescription Prescription ID
     * @param request Updated prescription data
     * @return The updated prescription
     */
    @PutMapping("/{idPrescription}")
    public ResponseEntity<PrescriptionDTO> updatePrescription(
            @PathVariable Integer idPrescription,
            @RequestBody PrescriptionRequest request) {
        logger.info("Updating prescription with ID: {}", idPrescription);
        
        PrescriptionDTO updatedPrescription = prescriptionService.updatePrescription(idPrescription, request);
        
        logger.info("Prescription updated successfully with ID: {}", idPrescription);
        
        return ResponseEntity.ok(updatedPrescription);
    }
    
    /**
     * Delete a prescription
     * 
     * @param idPrescription Prescription ID
     * @return No content response
     */
    @DeleteMapping("/{idPrescription}")
    public ResponseEntity<Void> deletePrescription(@PathVariable Integer idPrescription) {
        logger.info("Deleting prescription with ID: {}", idPrescription);
        
        prescriptionService.deletePrescription(idPrescription);
        
        logger.info("Prescription deleted successfully with ID: {}", idPrescription);
        
        return ResponseEntity.noContent().build();
    }
} 