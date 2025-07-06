package com.hdoc.sgdm.controller;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hdoc.sgdm.dto.request.AllergieRequest;
import com.hdoc.sgdm.dto.response.AllergieListResponse;
import com.hdoc.sgdm.dto.response.AllergieResponse;
import com.hdoc.sgdm.service.AllergieService;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api")
public class AllergieController {

    private final AllergieService allergieService;
    
    @Autowired
    public AllergieController(AllergieService allergieService) {
        this.allergieService = allergieService;
    }
    
    /**
     * Get all allergies for a specific patient
     * 
     * @param idPatient Patient ID
     * @return List of allergies
     */
    @GetMapping("/allergies/patient/{idPatient}")
    public ResponseEntity<AllergieListResponse> getAllergiesByPatient(@PathVariable("idPatient") UUID idPatient) {
        try {
            log.info("Fetching allergies for patient: {}", idPatient);
            AllergieListResponse response = allergieService.getAllergiesByPatient(idPatient);
            log.info("Successfully fetched allergies: {}", response);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching allergies for patient {}", idPatient, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                AllergieListResponse.builder()
                    .success(false)
                    .message("Erreur lors de la récupération des allergies: " + e.getMessage())
                    .allergies(null)
                    .build()
            );
        }
    }
    
    /**
     * Create a new allergy
     * 
     * @param request Allergy data
     * @return Created allergy
     */
    @PostMapping("/allergies")
    public ResponseEntity<AllergieResponse> createAllergie(@Valid @RequestBody AllergieRequest request) {
        try {
            log.info("Received allergy creation request: {}", request);
            
            // Check if we have a valid patient ID
            if (request.getIdPatient() == null) {
                log.warn("Invalid or missing patient ID");
                return ResponseEntity.badRequest().body(
                    AllergieResponse.builder()
                        .success(false)
                        .message("ID patient invalide ou manquant")
                        .build()
                );
            }
            
            AllergieResponse response = allergieService.createAllergie(request);
            
            if (response.isSuccess()) {
                return ResponseEntity.status(HttpStatus.CREATED).body(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            log.error("Error creating allergy: {}", request, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                AllergieResponse.builder()
                    .success(false)
                    .message("Erreur lors de la création de l'allergie: " + e.getMessage())
                    .build()
            );
        }
    }
    
    /**
     * Update an existing allergy
     * 
     * @param idAllergie Allergy ID
     * @param request Updated allergy data
     * @return Updated allergy
     */
    @PutMapping("/allergies/{idAllergie}")
    public ResponseEntity<AllergieResponse> updateAllergie(
            @PathVariable("idAllergie") Long idAllergie,
            @Valid @RequestBody AllergieRequest request) {
        
        try {
            // Check if we have a valid patient ID
            if (request.getIdPatient() == null) {
                return ResponseEntity.badRequest().body(
                    AllergieResponse.builder()
                        .success(false)
                        .message("ID patient invalide ou manquant")
                        .build()
                );
            }
            
            AllergieResponse response = allergieService.updateAllergie(idAllergie, request);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            log.error("Error updating allergy", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                AllergieResponse.builder()
                    .success(false)
                    .message("Erreur lors de la mise à jour de l'allergie: " + e.getMessage())
                    .build()
            );
        }
    }
    
    /**
     * Delete an allergy
     * 
     * @param idAllergie Allergy ID
     * @return Response with success status
     */
    @DeleteMapping("/allergies/{idAllergie}")
    public ResponseEntity<AllergieResponse> deleteAllergie(@PathVariable("idAllergie") Long idAllergie) {
        try {
            AllergieResponse response = allergieService.deleteAllergie(idAllergie);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error deleting allergy", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                AllergieResponse.builder()
                    .success(false)
                    .message("Erreur lors de la suppression de l'allergie: " + e.getMessage())
                    .build()
            );
        }
    }
    
    /**
     * Handle JSON parsing errors
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<AllergieResponse> handleJsonParseException(HttpMessageNotReadableException ex) {
        log.error("JSON parse error", ex);
        return ResponseEntity.badRequest().body(
            AllergieResponse.builder()
                .success(false)
                .message("Format de données invalide: " + ex.getMessage())
                .build()
        );
    }
} 