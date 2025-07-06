package com.hdoc.sgdm.service;

import java.util.UUID;

import com.hdoc.sgdm.dto.request.ActivateUtilisateurRequest;
import com.hdoc.sgdm.dto.request.CreateUtilisateurRequest;
import com.hdoc.sgdm.dto.request.DeactivateUtilisateurRequest;
import com.hdoc.sgdm.dto.request.UpdateUtilisateurRequest;
import com.hdoc.sgdm.dto.response.UtilisateurListResponse;
import com.hdoc.sgdm.dto.response.UtilisateurResponse;

public interface UtilisateurService {
    
    /**
     * Create a new user
     * 
     * @param request User creation request
     * @return Response with the created user
     */
    UtilisateurResponse createUtilisateur(CreateUtilisateurRequest request);
    
    /**
     * Update an existing user
     * 
     * @param id User ID to update
     * @param request User update request
     * @return Response with the updated user
     */
    UtilisateurResponse updateUtilisateur(UUID id, UpdateUtilisateurRequest request);
    
    /**
     * Deactivate a user
     * 
     * @param id User ID to deactivate
     * @param request Deactivation request with reason
     * @return Response with the deactivated user
     */
    UtilisateurResponse deactivateUtilisateur(UUID id, DeactivateUtilisateurRequest request);
    
    /**
     * Activate a previously deactivated user
     * 
     * @param id User ID to activate
     * @param request Activation request (empty)
     * @return Response with the activated user
     */
    UtilisateurResponse activateUtilisateur(UUID id, ActivateUtilisateurRequest request);
    
    /**
     * Get a user by ID
     * 
     * @param id User ID to retrieve
     * @return Response with the user details
     */
    UtilisateurResponse getUtilisateur(UUID id);
    
    /**
     * List all users
     * 
     * @return Response with list of users
     */
    UtilisateurListResponse getAllUtilisateurs();
    
    /**
     * List all active users (where est_desactive = false)
     * 
     * @return Response with list of active users
     */
    UtilisateurListResponse getAllActiveUtilisateurs();
} 