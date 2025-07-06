package com.hdoc.sgdm.mapper;

import com.hdoc.sgdm.dto.common.UtilisateurDTO;
import com.hdoc.sgdm.dto.response.LoginResponse;
import com.hdoc.sgdm.entity.Utilisateur;

public class UtilisateurMapper {

    public static LoginResponse toLoginResponse(Utilisateur utilisateur, boolean success, String message) {
        return LoginResponse.builder()
                .success(success)
                .message(message)
                .utilisateur(utilisateur != null ? toUtilisateurDTO(utilisateur) : null)
                .build();
    }
    
    public static UtilisateurDTO toUtilisateurDTO(Utilisateur utilisateur) {
        return UtilisateurDTO.builder()
                .idUtilisateur(utilisateur.getId())
                .nom(utilisateur.getNom())
                .prenom(utilisateur.getPrenom())
                .identifiant(utilisateur.getIdentifiant())
                .role(utilisateur.getRole())
                .email(utilisateur.getEmail())
                .sexe(utilisateur.getSexe())
                .dateNaissance(utilisateur.getDateNaissance())
                .telephone(utilisateur.getTelephone())
                .adresse(utilisateur.getAdresse())
                .ville(utilisateur.getVille())
                .pays(utilisateur.getPays())
                .dateCreation(utilisateur.getDateCreation())
                .estDesactive(utilisateur.isEstDesactive())
                .raisonDesactivation(utilisateur.getRaisonDesactivation())
                .idMedecin("MEDECIN".equals(utilisateur.getRole()) ? utilisateur.getId() : null)
                .build();
    }
}