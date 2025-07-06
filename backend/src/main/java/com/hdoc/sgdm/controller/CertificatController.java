package com.hdoc.sgdm.controller;

import com.hdoc.sgdm.dto.request.CertificatRequest;
import com.hdoc.sgdm.dto.response.CertificatDTO;
import com.hdoc.sgdm.service.CertificatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/certificats")
public class CertificatController {
    private static final Logger logger = LoggerFactory.getLogger(CertificatController.class);
    
    private final CertificatService certificatService;
    
    @Autowired
    public CertificatController(CertificatService certificatService) {
        this.certificatService = certificatService;
    }
    
    /**
     * Create a new medical certificate
     * 
     * @param request Certificate creation data
     * @return The created certificate
     */
    @PostMapping
    public ResponseEntity<CertificatDTO> createCertificat(@RequestBody CertificatRequest request) {
        logger.info("Creating new certificat for patient: {}", request.getIdPatient());
        
        CertificatDTO certificat = certificatService.createCertificat(request);
        
        logger.info("Certificat created successfully with ID: {}", certificat.getIdCertificat());
        
        return ResponseEntity.status(HttpStatus.CREATED).body(certificat);
    }
    
    /**
     * Get all certificates for a patient
     * 
     * @param idPatient Patient's ID
     * @return List of certificates
     */
    @GetMapping("/patient/{idPatient}")
    public ResponseEntity<List<CertificatDTO>> getCertificatsForPatient(@PathVariable UUID idPatient) {
        logger.info("Fetching certificats for patient: {}", idPatient);
        
        List<CertificatDTO> certificats = certificatService.getCertificatsForPatient(idPatient);
        
        logger.info("Found {} certificat(s) for patient: {}", certificats.size(), idPatient);
        
        return ResponseEntity.ok(certificats);
    }
} 