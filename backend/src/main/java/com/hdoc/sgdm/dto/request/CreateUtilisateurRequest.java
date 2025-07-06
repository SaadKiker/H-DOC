package com.hdoc.sgdm.dto.request;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateUtilisateurRequest {
    
    @NotBlank(message = "Le nom est obligatoire")
    private String nom;
    
    @NotBlank(message = "Le prénom est obligatoire")
    private String prenom;
    
    @NotBlank(message = "L'identifiant est obligatoire")
    private String identifiant;
    
    @NotBlank(message = "Le mot de passe est obligatoire")
    private String motDePasse;
    
    @NotBlank(message = "Le rôle est obligatoire")
    private String role;
    
    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;
    
    @NotBlank(message = "Le sexe est obligatoire")
    @Pattern(regexp = "^(M|F)$", message = "Le sexe doit être M ou F")
    private String sexe;
    
    @NotNull(message = "La date de naissance est obligatoire")
    private LocalDate dateNaissance;
    
    @NotBlank(message = "Le numéro de téléphone est obligatoire")
    private String telephone;
    
    @NotBlank(message = "L'adresse est obligatoire")
    private String adresse;
    
    @NotBlank(message = "La ville est obligatoire")
    private String ville;
    
    @NotBlank(message = "Le pays est obligatoire")
    private String pays;
} 