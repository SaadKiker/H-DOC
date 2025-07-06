package com.hdoc.sgdm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ordonnance")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ordonnance {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_ordonnance")
    private Long idOrdonnance;
    
    @Column(name = "id_patient", nullable = false)
    private UUID idPatient;
    
    @Column(name = "id_visite", nullable = false)
    private Long idVisite;
    
    @Column(name = "id_medecin", nullable = false)
    private UUID idMedecin;
    
    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;
    
    @Column(name = "url")
    private String url;
    
    @Column(name = "statut", length = 50)
    private String statut;
    
    @PrePersist
    protected void onCreate() {
        if (dateCreation == null) {
            dateCreation = LocalDateTime.now();
        }
        if (statut == null) {
            statut = "en_cours";
        }
    }
} 