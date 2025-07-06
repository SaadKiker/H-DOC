package com.hdoc.sgdm.controller;

import com.hdoc.sgdm.dto.request.EmptyOrdonnanceRequest;
import com.hdoc.sgdm.dto.request.OrdonnanceRequest;
import com.hdoc.sgdm.dto.response.OrdonnanceDTO;
import com.hdoc.sgdm.service.OrdonnanceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ordonnances")
public class OrdonnanceController {
    private static final Logger logger = LoggerFactory.getLogger(OrdonnanceController.class);
    
    private final OrdonnanceService ordonnanceService;
    
    @Autowired
    public OrdonnanceController(OrdonnanceService ordonnanceService) {
        this.ordonnanceService = ordonnanceService;
    }
    
    /**
     * Create a new ordonnance with prescriptions
     * 
     * @param request Ordonnance creation data
     * @return The created ordonnance
     */
    @PostMapping
    public ResponseEntity<OrdonnanceDTO> createOrdonnance(@RequestBody OrdonnanceRequest request) {
        logger.info("Creating new ordonnance for patient: {}", request.getIdPatient());
        
        OrdonnanceDTO ordonnance = ordonnanceService.createOrdonnance(request);
        
        logger.info("Ordonnance created successfully with ID: {}", ordonnance.getIdOrdonnance());
        
        return ResponseEntity.status(HttpStatus.CREATED).body(ordonnance);
    }
    
    /**
     * Create a new empty ordonnance without prescriptions
     * 
     * @param request Empty ordonnance creation data
     * @return The created empty ordonnance
     */
    @PostMapping("/empty")
    public ResponseEntity<OrdonnanceDTO> createEmptyOrdonnance(@RequestBody EmptyOrdonnanceRequest request) {
        logger.info("Creating new empty ordonnance for patient: {}", request.getIdPatient());
        
        OrdonnanceDTO ordonnance = ordonnanceService.createEmptyOrdonnance(request);
        
        logger.info("Empty ordonnance created successfully with ID: {}", ordonnance.getIdOrdonnance());
        
        return ResponseEntity.status(HttpStatus.CREATED).body(ordonnance);
    }
    
    /**
     * Generate PDF for an existing ordonnance
     * 
     * @param idOrdonnance Ordonnance ID
     * @return The updated ordonnance with PDF URL
     */
    @PostMapping("/{idOrdonnance}/generate-pdf")
    public ResponseEntity<OrdonnanceDTO> generateOrdonnancePDF(@PathVariable Long idOrdonnance) {
        logger.info("Generating PDF for ordonnance ID: {}", idOrdonnance);
        
        OrdonnanceDTO ordonnance = ordonnanceService.generateOrdonnancePDF(idOrdonnance);
        
        logger.info("PDF generated successfully for ordonnance ID: {}", idOrdonnance);
        
        return ResponseEntity.ok(ordonnance);
    }
    
    /**
     * Get all ordonnances for a patient
     * 
     * @param idPatient Patient's ID
     * @return List of ordonnances
     */
    @GetMapping("/patient/{idPatient}")
    public ResponseEntity<List<OrdonnanceDTO>> getOrdonnancesForPatient(@PathVariable UUID idPatient) {
        logger.info("Fetching ordonnances for patient: {}", idPatient);
        
        List<OrdonnanceDTO> ordonnances = ordonnanceService.getOrdonnancesForPatient(idPatient);
        
        logger.info("Found {} ordonnance(s) for patient: {}", ordonnances.size(), idPatient);
        
        return ResponseEntity.ok(ordonnances);
    }
    
    /**
     * Get all ordonnances for a visite
     * 
     * @param idVisite Visite ID
     * @return List of ordonnances
     */
    @GetMapping("/visite/{idVisite}")
    public ResponseEntity<List<OrdonnanceDTO>> getOrdonnancesForVisite(@PathVariable Long idVisite) {
        logger.info("Fetching ordonnances for visite: {}", idVisite);
        
        List<OrdonnanceDTO> ordonnances = ordonnanceService.getOrdonnancesForVisite(idVisite);
        
        logger.info("Found {} ordonnance(s) for visite: {}", ordonnances.size(), idVisite);
        
        return ResponseEntity.ok(ordonnances);
    }
    
    /**
     * Get an ordonnance by ID
     * 
     * @param idOrdonnance Ordonnance ID
     * @return The ordonnance
     */
    @GetMapping("/{idOrdonnance}")
    public ResponseEntity<OrdonnanceDTO> getOrdonnanceById(@PathVariable Long idOrdonnance) {
        logger.info("Fetching ordonnance with ID: {}", idOrdonnance);
        
        OrdonnanceDTO ordonnance = ordonnanceService.getOrdonnanceById(idOrdonnance);
        
        logger.info("Found ordonnance with ID: {}", idOrdonnance);
        
        return ResponseEntity.ok(ordonnance);
    }
    
    /**
     * Delete an ordonnance and its associated prescriptions
     * 
     * @param idOrdonnance Ordonnance ID
     * @return No content response
     */
    @DeleteMapping("/{idOrdonnance}")
    public ResponseEntity<Void> deleteOrdonnance(@PathVariable Long idOrdonnance) {
        logger.info("Deleting ordonnance with ID: {}", idOrdonnance);
        
        ordonnanceService.deleteOrdonnance(idOrdonnance);
        
        logger.info("Ordonnance deleted successfully with ID: {}", idOrdonnance);
        
        return ResponseEntity.noContent().build();
    }
} 