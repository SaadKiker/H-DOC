package com.hdoc.sgdm.controller;

import com.hdoc.sgdm.dto.request.FactureRequest;
import com.hdoc.sgdm.dto.request.FactureUpdateRequest;
import com.hdoc.sgdm.dto.request.PrepareFactureRequest;
import com.hdoc.sgdm.dto.response.FactureResponse;
import com.hdoc.sgdm.dto.common.CurrentUser;
import com.hdoc.sgdm.service.FactureService;
import com.hdoc.sgdm.util.UserRequestUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.Map;

@RestController
@RequestMapping("/api/factures")
@RequiredArgsConstructor
public class FactureController {
    private static final Logger logger = LoggerFactory.getLogger(FactureController.class);
    
    private final FactureService factureService;
    private final UserRequestUtil userRequestUtil;
    
    /**
     * Create a new facture
     * 
     * @param request the facture request
     * @return the created facture
     */
    @PostMapping
    public ResponseEntity<FactureResponse> createFacture(@Valid @RequestBody FactureRequest request) {
        logger.info("Creating new facture for visite ID: {}", request.getIdVisite());
        FactureResponse response = factureService.createFacture(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * Generate a facture PDF and save it in a single operation
     * 
     * @param request the facture data
     * @return the created facture with PDF URL
     */
    @PostMapping("/generate-pdf")
    public ResponseEntity<FactureResponse> generateAndSaveFacture(@Valid @RequestBody FactureRequest request) {
        logger.info("Generating PDF and saving facture for visite ID: {}", request.getIdVisite());
        FactureResponse response = factureService.generateAndSaveFacture(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * Generate and store PDF for a facture
     * 
     * @param idFacture the facture ID
     * @return the updated facture with the PDF URL
     */
    @PostMapping("/{idFacture}/generate-pdf")
    public ResponseEntity<FactureResponse> generatePDF(@PathVariable Integer idFacture) {
        logger.info("Generating PDF for facture ID: {}", idFacture);
        FactureResponse response = factureService.generatePDF(idFacture);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get all factures for a patient
     * 
     * @param idPatient the patient ID
     * @return list of factures
     */
    @GetMapping("/patient/{idPatient}")
    public ResponseEntity<List<FactureResponse>> getFacturesByPatient(@PathVariable UUID idPatient) {
        logger.info("Fetching factures for patient ID: {}", idPatient);
        List<FactureResponse> factures = factureService.getFacturesByPatient(idPatient);
        return ResponseEntity.ok(factures);
    }
    
    /**
     * Get factures by visit ID
     * 
     * @param idVisite the visit ID
     * @return list of factures for the visit
     */
    @GetMapping("/visite/{idVisite}")
    public ResponseEntity<List<FactureResponse>> getFacturesByVisite(@PathVariable Integer idVisite) {
        logger.info("Fetching factures for visite ID: {}", idVisite);
        List<FactureResponse> factures = factureService.getFacturesByVisite(idVisite);
        return ResponseEntity.ok(factures);
    }
    
    /**
     * Check if a facture exists for a visit
     * 
     * @param idVisite the visit ID
     * @return whether a facture exists for the visit
     */
    @GetMapping("/visite/{idVisite}/exists")
    public ResponseEntity<Map<String, Boolean>> checkFactureExists(@PathVariable Integer idVisite) {
        logger.info("Checking if facture exists for visite ID: {}", idVisite);
        boolean exists = factureService.checkFactureExists(idVisite);
        return ResponseEntity.ok(Map.of("exists", exists));
    }
    
    /**
     * Get all factures created today
     * 
     * @return list of factures created today
     */
    @GetMapping("/today")
    public ResponseEntity<List<FactureResponse>> getFacturesToday() {
        logger.info("Fetching all factures created today");
        List<FactureResponse> factures = factureService.getFacturesToday();
        return ResponseEntity.ok(factures);
    }
    
    /**
     * Get all pending factures with status "non payé"
     * 
     * @return list of pending factures
     */
    @GetMapping("/pending")
    public ResponseEntity<List<FactureResponse>> getPendingFactures() {
        logger.info("Fetching all pending factures");
        List<FactureResponse> factures = factureService.getPendingFactures();
        return ResponseEntity.ok(factures);
    }
    
    /**
     * Prepare a new facture for billing as requested by a doctor
     * This endpoint creates a facture with status "non payé" and without payment details
     * 
     * @param request the prepare facture request
     * @return the created facture
     */
    @PostMapping("/prepare")
    public ResponseEntity<FactureResponse> prepareFacture(
            @Valid @RequestBody PrepareFactureRequest request) {
        
        logger.info("Preparing facture for visite ID: {}", request.getIdVisite());
        FactureResponse response = factureService.prepareFacture(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * Update an existing facture
     * 
     * @param idFacture the facture ID to update
     * @param request the update request
     * @return the updated facture
     */
    @PutMapping("/{idFacture}")
    public ResponseEntity<FactureResponse> updateFacture(
            @PathVariable Integer idFacture,
            @Valid @RequestBody FactureUpdateRequest request) {
        
        logger.info("Updating facture with ID: {}", idFacture);
        FactureResponse response = factureService.updateFacture(idFacture, request);
        return ResponseEntity.ok(response);
    }
} 