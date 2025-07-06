package com.hdoc.sgdm.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "utilisateur")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Utilisateur {
    
    @Id
    @Column(name = "id_utilisateur")
    private UUID id;
    
    @Column(nullable = false)
    private String nom;
    
    @Column(nullable = false)
    private String prenom;
    
    @Column(nullable = false, unique = true)
    private String identifiant;
    
    @Column(name = "mot_de_passe", nullable = false)
    private String motDePasse;
    
    @Column(nullable = false)
    private String role;
    
    @Column(nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String sexe;
    
    @Column(name = "date_naissance", nullable = false)
    private LocalDate dateNaissance;
    
    @Column(nullable = false)
    private String telephone;
    
    @Column(nullable = false)
    private String adresse;
    
    @Column(nullable = false)
    private String ville;
    
    @Column(nullable = false)
    private String pays;
    
    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;
    
    @Column(name = "est_desactive", nullable = false)
    private boolean estDesactive;
    
    @Column(name = "raison_desactivation")
    private String raisonDesactivation;
}