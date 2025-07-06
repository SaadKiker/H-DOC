package com.hdoc.sgdm.dto.request;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateUtilisateurRequest {
    
    private String nom;
    private String prenom;
    private String identifiant;
    private String motDePasse;
    private String role;
    
    @Email(message = "Format d'email invalide")
    private String email;
    
    @Pattern(regexp = "^(M|F)$", message = "Le sexe doit être M ou F")
    private String sexe;
    
    private LocalDate dateNaissance;
    private String telephone;
    private String adresse;
    private String ville;
    private String pays;
} 