package com.hdoc.sgdm.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

@Entity
@Table(name = "patient")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Patient {
    
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id_patient")
    private UUID idPatient;
    
    @Column(name = "ipp", unique = true, nullable = false, length = 10)
    private String ipp;
    
    @Column(nullable = false, length = 50)
    private String nom;
    
    @Column(nullable = false, length = 50)
    private String prenom;
    
    @Column(name = "date_naissance", nullable = false)
    private LocalDate dateNaissance;
    
    @Column(name = "lieu_naissance", nullable = false, length = 100)
    private String lieuNaissance;
    
    @Column(nullable = false, length = 10)
    private String sexe;
    
    @Column(nullable = false, length = 255)
    private String adresse;
    
    @Column(nullable = false, length = 50)
    private String ville;
    
    @Column(nullable = false, length = 20)
    private String telephone;
    
    @Column(nullable = false, length = 50)
    private String nationalite;
    
    @Column(name = "etat_civil", nullable = false, length = 20)
    private String etatCivil;
    
    @Column(nullable = false, unique = true, length = 100)
    private String email;
    
    @Column(nullable = false, length = 20)
    private String cin;
    
    @Column(name = "contact_urgence_prenom", length = 50)
    private String contactUrgencePrenom;
    
    @Column(name = "contact_urgence_relation", length = 50)
    private String contactUrgenceRelation;
    
    @Column(name = "contact_urgence_adresse", length = 255)
    private String contactUrgenceAdresse;
    
    @Column(name = "contact_urgence_telephone", length = 20)
    private String contactUrgenceTelephone;
    
    @Column(name = "type_admission", nullable = false, length = 20)
    private String typeAdmission;
    
    @Column(name = "date_admission", nullable = false)
    private LocalDate dateAdmission;
    
    @Column(name = "date_creation", nullable = false, updatable = false)
    private LocalDateTime dateCreation;
}
