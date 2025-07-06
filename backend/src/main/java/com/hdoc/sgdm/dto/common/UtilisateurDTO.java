package com.hdoc.sgdm.dto.common;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UtilisateurDTO {
    
    private UUID idUtilisateur;
    private String nom;
    private String prenom;
    private String identifiant;
    private String role;
    private String email;
    private String sexe;
    private LocalDate dateNaissance;
    private String telephone;
    private String adresse;
    private String ville;
    private String pays;
    private LocalDateTime dateCreation;
    private boolean estDesactive;
    private String raisonDesactivation;
    private UUID idMedecin;
}