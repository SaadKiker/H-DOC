package com.hdoc.sgdm.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hdoc.sgdm.dto.request.LoginRequest;
import com.hdoc.sgdm.dto.response.LoginResponse;
import com.hdoc.sgdm.entity.Utilisateur;
import com.hdoc.sgdm.mapper.UtilisateurMapper;
import com.hdoc.sgdm.repository.UtilisateurRepository;

import java.util.Optional;

@Service
public class AuthService {
    
    private final UtilisateurRepository utilisateurRepository;
    
    @Autowired
    public AuthService(UtilisateurRepository utilisateurRepository) {
        this.utilisateurRepository = utilisateurRepository;
    }
    
    public LoginResponse login(LoginRequest loginRequest) {
        Optional<Utilisateur> utilisateurOptional = utilisateurRepository.findByIdentifiant(loginRequest.getIdentifiant());
        
        if (utilisateurOptional.isEmpty()) {
            return UtilisateurMapper.toLoginResponse(null, false, "Identifiant invalide");
        }
        
        Utilisateur utilisateur = utilisateurOptional.get();
        
        // Check if account is disabled
        if (utilisateur.isEstDesactive()) {
            return UtilisateurMapper.toLoginResponse(null, false, "Compte désactivé: " + utilisateur.getRaisonDesactivation());
        }
        
        if (!utilisateur.getMotDePasse().equals(loginRequest.getMotDePasse())) {
            return UtilisateurMapper.toLoginResponse(null, false, "Mot de passe incorrect");
        }
        
        return UtilisateurMapper.toLoginResponse(utilisateur, true, "Connexion réussie");
    }
}