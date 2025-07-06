package com.hdoc.sgdm.service;

import java.util.UUID;

import com.hdoc.sgdm.dto.request.AllergieRequest;
import com.hdoc.sgdm.dto.response.AllergieListResponse;
import com.hdoc.sgdm.dto.response.AllergieResponse;

public interface AllergieService {
    
    /**
     * Get all allergies for a patient
     * 
     * @param idPatient Patient ID
     * @return List of allergies
     */
    AllergieListResponse getAllergiesByPatient(UUID idPatient);
    
    /**
     * Create a new allergie
     * 
     * @param request Allergie data
     * @return Created allergie
     */
    AllergieResponse createAllergie(AllergieRequest request);
    
    /**
     * Update an existing allergie
     * 
     * @param idAllergie Allergie ID
     * @param request Updated allergie data
     * @return Updated allergie
     */
    AllergieResponse updateAllergie(Long idAllergie, AllergieRequest request);
    
    /**
     * Delete an allergie
     * 
     * @param idAllergie Allergie ID
     * @return Response with success status
     */
    AllergieResponse deleteAllergie(Long idAllergie);
} 