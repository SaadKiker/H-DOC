package com.hdoc.sgdm.dto.request;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreatePatientRequest {
    
    @NotBlank(message = "Le nom ne peut pas être vide")
    private String nom;
    
    @NotBlank(message = "Le prénom ne peut pas être vide")
    private String prenom;
    
    @NotNull(message = "La date de naissance ne peut pas être vide")
    @Past(message = "La date de naissance doit être dans le passé")
    private LocalDate dateNaissance;
    
    @NotBlank(message = "Le lieu de naissance ne peut pas être vide")
    private String lieuNaissance;
    
    @NotBlank(message = "Le sexe ne peut pas être vide")
    @Pattern(regexp = "^(M|F)$", message = "Le sexe doit être 'M' ou 'F'")
    private String sexe;
    
    @NotBlank(message = "L'adresse ne peut pas être vide")
    private String adresse;
    
    @NotBlank(message = "La ville ne peut pas être vide")
    private String ville;
    
    @NotBlank(message = "Le téléphone ne peut pas être vide")
    @Pattern(regexp = "^[0-9]{10}$", message = "Le format du téléphone n'est pas valide")
    private String telephone;
    
    @NotBlank(message = "La nationalité ne peut pas être vide")
    private String nationalite;
    
    @NotBlank(message = "L'état civil ne peut pas être vide")
    private String etatCivil;
    
    @NotBlank(message = "L'email ne peut pas être vide")
    @Email(message = "Format d'email invalide")
    private String email;
    
    @NotBlank(message = "Le CIN ne peut pas être vide")
    private String cin;
    
    // Contact d'urgence (optionnel)
    private String contactUrgencePrenom;
    private String contactUrgenceRelation;
    private String contactUrgenceAdresse;
    private String contactUrgenceTelephone;
    
    @NotBlank(message = "Le type d'admission ne peut pas être vide")
    private String typeAdmission;
    
    @NotNull(message = "La date d'admission ne peut pas être vide")
    private LocalDate dateAdmission;
}