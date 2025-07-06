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
public class PatientDTO {
    
private UUID idPatient;
    private String ipp;
    private String nom;
    private String prenom;
    private LocalDate dateNaissance;
    private String lieuNaissance;
    private String sexe;
    private String adresse;
    private String ville;
    private String telephone;
    private String nationalite;
    private String etatCivil;
    private String email;
    private String cin;
    private String contactUrgencePrenom;
    private String contactUrgenceRelation;
    private String contactUrgenceAdresse;
    private String contactUrgenceTelephone;
    private String typeAdmission;
    private LocalDate dateAdmission;
    private LocalDateTime dateCreation;
}