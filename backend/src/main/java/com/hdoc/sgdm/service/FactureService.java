package com.hdoc.sgdm.service;

import com.hdoc.sgdm.dto.request.FactureRequest;
import com.hdoc.sgdm.dto.request.FactureUpdateRequest;
import com.hdoc.sgdm.dto.request.PrepareFactureRequest;
import com.hdoc.sgdm.dto.response.FactureResponse;
import com.hdoc.sgdm.entity.Facture;
import com.hdoc.sgdm.entity.Patient;
import com.hdoc.sgdm.entity.Visite;
import com.hdoc.sgdm.mapper.FactureMapper;
import com.hdoc.sgdm.repository.FactureRepository;
import com.hdoc.sgdm.repository.PatientRepository;
import com.hdoc.sgdm.repository.VisiteRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FactureService {
    private static final Logger logger = LoggerFactory.getLogger(FactureService.class);
    
    private final FactureRepository factureRepository;
    private final PatientRepository patientRepository;
    private final VisiteRepository visiteRepository;
    private final FactureMapper factureMapper;
    private final FacturePDFService facturePDFService;
    
    /**
     * Generate a facture PDF and save it in a single operation
     * This allows generating the PDF before persisting the facture in the database
     * 
     * @param request the facture request
     * @return the created facture with PDF URL
     */
    @Transactional
    public FactureResponse generateAndSaveFacture(FactureRequest request) {
        // Get the visit to retrieve patient ID and details
        Visite visite = visiteRepository.findById(request.getIdVisite().longValue())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Visite non trouvée"));
        
        UUID idPatient = visite.getPatient().getIdPatient();
        
        // Check for existing unpaid factures with the same patient and visit IDs
        List<Facture> existingFactures = factureRepository.findByIdPatientAndIdVisiteAndStatus(
                idPatient, request.getIdVisite(), "non payé");
        
        // Delete existing unpaid factures if any found
        if (!existingFactures.isEmpty()) {
            logger.info("Found {} existing unpaid facture(s) for patient ID: {} and visit ID: {}. Deleting them...",
                    existingFactures.size(), idPatient, request.getIdVisite());
            
            existingFactures.forEach(existingFacture -> {
                logger.info("Deleting unpaid facture with ID: {}", existingFacture.getIdFacture());
                factureRepository.delete(existingFacture);
            });
        }
        
        // Get patient details
        Patient patient = patientRepository.findByIdPatient(idPatient)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient non trouvé"));
        
        // Create facture entity and save it first to get the ID
        Facture facture = factureMapper.toEntity(request, idPatient);
        facture = factureRepository.save(facture);
        
        try {
            // Generate PDF after saving to database, so the ID is properly set
            String pdfUrl = facturePDFService.generateAndUploadPDF(facture, patient, visite);
            
            // Update facture with URL and save again
            facture.setUrl(pdfUrl);
            facture = factureRepository.save(facture);
            
            logger.info("Facture created with ID: {} and PDF URL: {}", facture.getIdFacture(), pdfUrl);
            
            return factureMapper.toDto(facture);
        } catch (IOException e) {
            logger.error("Error generating PDF or saving facture: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                    "Erreur lors de la génération du PDF ou de l'enregistrement de la facture: " + e.getMessage());
        }
    }
    
    /**
     * Create a new facture
     * 
     * @param request the facture request
     * @return the created facture
     */
    @Transactional
    public FactureResponse createFacture(FactureRequest request) {
        // Get the visit to retrieve patient ID
        Visite visite = visiteRepository.findById(request.getIdVisite().longValue())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Visite non trouvée"));
        
        UUID idPatient = visite.getPatient().getIdPatient();
        
        // Check for existing unpaid factures with the same patient and visit IDs
        List<Facture> existingFactures = factureRepository.findByIdPatientAndIdVisiteAndStatus(
                idPatient, request.getIdVisite(), "non payé");
        
        // Delete existing unpaid factures if any found
        if (!existingFactures.isEmpty()) {
            logger.info("Found {} existing unpaid facture(s) for patient ID: {} and visit ID: {}. Deleting them...",
                    existingFactures.size(), idPatient, request.getIdVisite());
            
            existingFactures.forEach(existingFacture -> {
                logger.info("Deleting unpaid facture with ID: {}", existingFacture.getIdFacture());
                factureRepository.delete(existingFacture);
            });
        }
        
        // Create and save the facture first to get the ID
        Facture facture = factureMapper.toEntity(request, idPatient);
        facture = factureRepository.save(facture);
        
        logger.info("Facture created with ID: {}", facture.getIdFacture());
        
        // Automatically generate PDF
        try {
            // Get patient details
            Patient patient = patientRepository.findByIdPatient(facture.getIdPatient())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient non trouvé"));
            
            // Generate PDF and get URL
            String pdfUrl = facturePDFService.generateAndUploadPDF(facture, patient, visite);
            
            // Update facture with URL and save again
            facture.setUrl(pdfUrl);
            facture = factureRepository.save(facture);
            
            logger.info("PDF automatically generated for facture ID: {}", facture.getIdFacture());
        } catch (IOException e) {
            logger.error("Error auto-generating PDF for facture ID: {}", facture.getIdFacture(), e);
            // We continue despite PDF generation error - it can be generated manually later
        }
        
        return factureMapper.toDto(facture);
    }
    
    /**
     * Generate a PDF for a facture
     * 
     * @param idFacture the facture ID
     * @return the updated facture with URL
     */
    @Transactional
    public FactureResponse generatePDF(Integer idFacture) {
        // Get the facture
        Facture facture = factureRepository.findById(idFacture)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Facture non trouvée"));
        
        // Get patient details
        Patient patient = patientRepository.findByIdPatient(facture.getIdPatient())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient non trouvé"));
        
        // Get visit details
        Visite visite = visiteRepository.findById(facture.getIdVisite().longValue())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Visite non trouvée"));
        
        try {
            // Generate PDF and get URL
            String pdfUrl = facturePDFService.generateAndUploadPDF(facture, patient, visite);
            
            // Update facture with URL
            facture.setUrl(pdfUrl);
            facture = factureRepository.save(facture);
            
            logger.info("PDF generated for facture ID: {}", idFacture);
            
            return factureMapper.toDto(facture);
        } catch (IOException e) {
            logger.error("Error generating PDF for facture ID: {}", idFacture, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                    "Erreur lors de la génération du PDF: " + e.getMessage());
        }
    }
    
    /**
     * Get all factures for a patient
     * 
     * @param idPatient the patient ID
     * @return list of factures
     */
    public List<FactureResponse> getFacturesByPatient(UUID idPatient) {
        // Check if patient exists
        if (patientRepository.findByIdPatient(idPatient).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient non trouvé");
        }
        
        List<Facture> factures = factureRepository.findByIdPatient(idPatient);
        return factures.stream()
                .map(factureMapper::toDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get factures by visit ID
     * 
     * @param idVisite the visit ID
     * @return list of factures for the visit
     */
    public List<FactureResponse> getFacturesByVisite(Integer idVisite) {
        List<Facture> factures = factureRepository.findByIdVisite(idVisite);
        
        if (factures.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "Aucune facture trouvée pour cette visite");
        }
        
        return factures.stream()
                .map(factureMapper::toDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Check if a facture exists for a visit
     * 
     * @param idVisite the visit ID
     * @return true if at least one facture exists for the visit, false otherwise
     */
    public boolean checkFactureExists(Integer idVisite) {
        List<Facture> factures = factureRepository.findByIdVisite(idVisite);
        return !factures.isEmpty();
    }
    
    /**
     * Get all factures created today
     * 
     * @return list of factures created today
     */
    public List<FactureResponse> getFacturesToday() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);
        
        logger.info("Fetching factures for today: {}", today);
        
        List<Facture> factures = factureRepository.findByDateFacturationBetween(startOfDay, endOfDay);
        return factures.stream()
                .map(factureMapper::toDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get all pending factures with status "non payé"
     * 
     * @return list of pending factures
     */
    public List<FactureResponse> getPendingFactures() {
        logger.info("Fetching all pending factures with status: non payé");
        
        List<Facture> factures = factureRepository.findByStatusOrderByDateFacturationDesc("non payé");
        return factures.stream()
                .map(factureMapper::toDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Prepare a facture for billing, as requested by a doctor
     * This creates a facture with status "non payé" and empty payment details
     * 
     * @param request the prepare facture request with visit and patient IDs
     * @return the created facture
     */
    @Transactional
    public FactureResponse prepareFacture(PrepareFactureRequest request) {
        // Verify that visit exists and belongs to the specified patient
        Visite visite = visiteRepository.findById(request.getIdVisite().longValue())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Visite non trouvée"));
        
        // Verify that the patient ID in the request matches the patient associated with the visit
        if (!visite.getPatient().getIdPatient().equals(request.getIdPatient())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "L'ID du patient ne correspond pas au patient associé à cette visite");
        }
        
        // Check for existing unpaid factures with the same patient and visit IDs
        List<Facture> existingFactures = factureRepository.findByIdPatientAndIdVisiteAndStatus(
                request.getIdPatient(), request.getIdVisite(), "non payé");
        
        // Delete existing unpaid factures if any found
        if (!existingFactures.isEmpty()) {
            logger.info("Found {} existing unpaid facture(s) for patient ID: {} and visit ID: {}. Deleting them...",
                    existingFactures.size(), request.getIdPatient(), request.getIdVisite());
            
            existingFactures.forEach(existingFacture -> {
                logger.info("Deleting unpaid facture with ID: {}", existingFacture.getIdFacture());
                factureRepository.delete(existingFacture);
            });
        }
        
        // Create a new facture with initial values
        Facture facture = new Facture();
        facture.setIdVisite(request.getIdVisite());
        facture.setIdPatient(request.getIdPatient());
        facture.setMontant(BigDecimal.ZERO); // Set initial amount to zero
        facture.setModePaiement(null); // No payment method yet
        facture.setStatus("non payé"); // Initial status
        facture.setDateFacturation(null); // No billing date yet
        facture.setUrl(null); // No PDF URL yet
        
        // Save the facture
        facture = factureRepository.save(facture);
        
        logger.info("Facture prepared for billing with ID: {}", facture.getIdFacture());
        
        return factureMapper.toDto(facture);
    }
    
    /**
     * Update an existing facture
     * 
     * @param idFacture the facture ID to update
     * @param request the update request
     * @return the updated facture
     */
    @Transactional
    public FactureResponse updateFacture(Integer idFacture, FactureUpdateRequest request) {
        logger.info("Updating facture with ID: {}", idFacture);
        
        // Get the facture
        Facture facture = factureRepository.findById(idFacture)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Facture non trouvée"));
        
        // Only allow updates for factures with status "non payé"
        if (!"non payé".equals(facture.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Seules les factures avec statut 'non payé' peuvent être modifiées");
        }
        
        // Update modifiable fields
        facture.setMontant(request.getMontant());
        facture.setModePaiement(request.getModePaiement());
        facture.setStatus(request.getStatus());
        
        // If status is changed to "payé", set the payment date
        if ("payé".equals(request.getStatus()) && !"payé".equals(facture.getStatus())) {
            facture.setDateFacturation(LocalDateTime.now());
        } else if (request.getDateFacturation() != null) {
            facture.setDateFacturation(request.getDateFacturation());
        }
        
        // Update URL if provided
        if (request.getUrl() != null) {
            facture.setUrl(request.getUrl());
        }
        
        // Save the updated facture
        facture = factureRepository.save(facture);
        
        // Generate PDF if requested or if the facture is marked as paid
        boolean shouldGeneratePdf = request.getUrl() == null && "payé".equals(request.getStatus());
        if (shouldGeneratePdf) {
            try {
                // Get patient details
                Patient patient = patientRepository.findByIdPatient(facture.getIdPatient())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient non trouvé"));
                
                // Get visit details
                Visite visite = visiteRepository.findById(facture.getIdVisite().longValue())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Visite non trouvée"));
                
                // Generate PDF and update the URL
                String pdfUrl = facturePDFService.generateAndUploadPDF(facture, patient, visite);
                facture.setUrl(pdfUrl);
                facture = factureRepository.save(facture);
                
                logger.info("PDF generated for updated facture ID: {}", idFacture);
            } catch (IOException e) {
                logger.error("Error generating PDF for updated facture ID: {}", idFacture, e);
                // Continue despite PDF generation error
            }
        }
        
        logger.info("Facture updated successfully with ID: {}", idFacture);
        
        return factureMapper.toDto(facture);
    }
} 