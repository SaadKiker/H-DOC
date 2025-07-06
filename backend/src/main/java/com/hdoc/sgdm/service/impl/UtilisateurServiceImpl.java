package com.hdoc.sgdm.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hdoc.sgdm.dto.common.UtilisateurDTO;
import com.hdoc.sgdm.dto.request.ActivateUtilisateurRequest;
import com.hdoc.sgdm.dto.request.CreateUtilisateurRequest;
import com.hdoc.sgdm.dto.request.DeactivateUtilisateurRequest;
import com.hdoc.sgdm.dto.request.UpdateUtilisateurRequest;
import com.hdoc.sgdm.dto.response.UtilisateurListResponse;
import com.hdoc.sgdm.dto.response.UtilisateurResponse;
import com.hdoc.sgdm.entity.Utilisateur;
import com.hdoc.sgdm.mapper.UtilisateurMapper;
import com.hdoc.sgdm.repository.UtilisateurRepository;
import com.hdoc.sgdm.service.UtilisateurService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UtilisateurServiceImpl implements UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    
    @Override
    @Transactional
    public UtilisateurResponse createUtilisateur(CreateUtilisateurRequest request) {
        // Check if a user with the same identifier already exists
        Optional<Utilisateur> existingUser = utilisateurRepository.findByIdentifiant(request.getIdentifiant());
        if (existingUser.isPresent()) {
            return UtilisateurResponse.builder()
                    .success(false)
                    .message("Un utilisateur avec cet identifiant existe déjà")
                    .build();
        }
        
        // Create new user
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setId(UUID.randomUUID());
        utilisateur.setNom(request.getNom());
        utilisateur.setPrenom(request.getPrenom());
        utilisateur.setIdentifiant(request.getIdentifiant());
        utilisateur.setMotDePasse(request.getMotDePasse());
        utilisateur.setRole(request.getRole());
        utilisateur.setEmail(request.getEmail());
        utilisateur.setSexe(request.getSexe());
        utilisateur.setDateNaissance(request.getDateNaissance());
        utilisateur.setTelephone(request.getTelephone());
        utilisateur.setAdresse(request.getAdresse());
        utilisateur.setVille(request.getVille());
        utilisateur.setPays(request.getPays());
        utilisateur.setDateCreation(LocalDateTime.now());
        utilisateur.setEstDesactive(false);
        utilisateur.setRaisonDesactivation(null);
        
        // Save the user
        Utilisateur savedUser = utilisateurRepository.save(utilisateur);
        
        return UtilisateurResponse.builder()
                .success(true)
                .message("Utilisateur créé avec succès")
                .utilisateur(UtilisateurMapper.toUtilisateurDTO(savedUser))
                .build();
    }

    @Override
    @Transactional
    public UtilisateurResponse updateUtilisateur(UUID id, UpdateUtilisateurRequest request) {
        // Check if the user exists
        Optional<Utilisateur> userOptional = utilisateurRepository.findById(id);
        if (userOptional.isEmpty()) {
            return UtilisateurResponse.builder()
                    .success(false)
                    .message("Utilisateur non trouvé")
                    .build();
        }
        
        Utilisateur utilisateur = userOptional.get();
        
        // Check if new identifiant is already taken by another user
        if (request.getIdentifiant() != null && !request.getIdentifiant().equals(utilisateur.getIdentifiant())) {
            Optional<Utilisateur> existingUser = utilisateurRepository.findByIdentifiant(request.getIdentifiant());
            if (existingUser.isPresent() && !existingUser.get().getId().equals(id)) {
                return UtilisateurResponse.builder()
                        .success(false)
                        .message("Un utilisateur avec cet identifiant existe déjà")
                        .build();
            }
            
            utilisateur.setIdentifiant(request.getIdentifiant());
        }
        
        // Update fields if provided
        if (request.getNom() != null) {
            utilisateur.setNom(request.getNom());
        }
        if (request.getPrenom() != null) {
            utilisateur.setPrenom(request.getPrenom());
        }
        if (request.getMotDePasse() != null) {
            utilisateur.setMotDePasse(request.getMotDePasse());
        }
        if (request.getRole() != null) {
            utilisateur.setRole(request.getRole());
        }
        if (request.getEmail() != null) {
            utilisateur.setEmail(request.getEmail());
        }
        if (request.getSexe() != null) {
            utilisateur.setSexe(request.getSexe());
        }
        if (request.getDateNaissance() != null) {
            utilisateur.setDateNaissance(request.getDateNaissance());
        }
        if (request.getTelephone() != null) {
            utilisateur.setTelephone(request.getTelephone());
        }
        if (request.getAdresse() != null) {
            utilisateur.setAdresse(request.getAdresse());
        }
        if (request.getVille() != null) {
            utilisateur.setVille(request.getVille());
        }
        if (request.getPays() != null) {
            utilisateur.setPays(request.getPays());
        }
        
        // Save the updated user
        Utilisateur updatedUser = utilisateurRepository.save(utilisateur);
        
        return UtilisateurResponse.builder()
                .success(true)
                .message("Utilisateur mis à jour avec succès")
                .utilisateur(UtilisateurMapper.toUtilisateurDTO(updatedUser))
                .build();
    }

    @Override
    @Transactional
    public UtilisateurResponse deactivateUtilisateur(UUID id, DeactivateUtilisateurRequest request) {
        // Check if the user exists
        Optional<Utilisateur> userOptional = utilisateurRepository.findById(id);
        if (userOptional.isEmpty()) {
            return UtilisateurResponse.builder()
                    .success(false)
                    .message("Utilisateur non trouvé")
                    .build();
        }
        
        Utilisateur utilisateur = userOptional.get();
        
        // Check if the user is already deactivated
        if (utilisateur.isEstDesactive()) {
            return UtilisateurResponse.builder()
                    .success(false)
                    .message("Utilisateur déjà désactivé")
                    .build();
        }
        
        // Deactivate the user
        utilisateur.setEstDesactive(true);
        utilisateur.setRaisonDesactivation(request.getRaisonDesactivation());
        
        // Save the deactivated user
        Utilisateur deactivatedUser = utilisateurRepository.save(utilisateur);
        
        return UtilisateurResponse.builder()
                .success(true)
                .message("Utilisateur désactivé avec succès")
                .utilisateur(UtilisateurMapper.toUtilisateurDTO(deactivatedUser))
                .build();
    }
    
    @Override
    @Transactional
    public UtilisateurResponse activateUtilisateur(UUID id, ActivateUtilisateurRequest request) {
        // Check if the user exists
        Optional<Utilisateur> userOptional = utilisateurRepository.findById(id);
        if (userOptional.isEmpty()) {
            return UtilisateurResponse.builder()
                    .success(false)
                    .message("Utilisateur non trouvé")
                    .build();
        }
        
        Utilisateur utilisateur = userOptional.get();
        
        // Check if the user is already active
        if (!utilisateur.isEstDesactive()) {
            return UtilisateurResponse.builder()
                    .success(false)
                    .message("Utilisateur déjà actif")
                    .build();
        }
        
        // Activate the user
        utilisateur.setEstDesactive(false);
        utilisateur.setRaisonDesactivation(null); // Clear the deactivation reason
        
        // Save the activated user
        Utilisateur activatedUser = utilisateurRepository.save(utilisateur);
        
        return UtilisateurResponse.builder()
                .success(true)
                .message("Utilisateur activé avec succès")
                .utilisateur(UtilisateurMapper.toUtilisateurDTO(activatedUser))
                .build();
    }

    @Override
    public UtilisateurResponse getUtilisateur(UUID id) {
        // Find the user by ID
        Optional<Utilisateur> userOptional = utilisateurRepository.findById(id);
        if (userOptional.isEmpty()) {
            return UtilisateurResponse.builder()
                    .success(false)
                    .message("Utilisateur non trouvé")
                    .build();
        }
        
        return UtilisateurResponse.builder()
                .success(true)
                .message("Utilisateur trouvé")
                .utilisateur(UtilisateurMapper.toUtilisateurDTO(userOptional.get()))
                .build();
    }

    @Override
    public UtilisateurListResponse getAllUtilisateurs() {
        // Get all users
        List<Utilisateur> utilisateurs = utilisateurRepository.findAll();
        
        // Convert to DTOs
        List<UtilisateurDTO> utilisateurDTOs = utilisateurs.stream()
                .map(UtilisateurMapper::toUtilisateurDTO)
                .collect(Collectors.toList());
        
        return UtilisateurListResponse.builder()
                .utilisateurs(utilisateurDTOs)
                .count(utilisateurDTOs.size())
                .build();
    }
    
    @Override
    public UtilisateurListResponse getAllActiveUtilisateurs() {
        // Get only active users (est_desactive = false)
        List<Utilisateur> activeUtilisateurs = utilisateurRepository.findByEstDesactiveFalse();
        
        // Convert to DTOs
        List<UtilisateurDTO> utilisateurDTOs = activeUtilisateurs.stream()
                .map(UtilisateurMapper::toUtilisateurDTO)
                .collect(Collectors.toList());
        
        return UtilisateurListResponse.builder()
                .utilisateurs(utilisateurDTOs)
                .count(utilisateurDTOs.size())
                .build();
    }
} 