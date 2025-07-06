package com.hdoc.sgdm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "certificat")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Certificat {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_certificat")
    private Long idCertificat;
    
    @Column(name = "id_patient", nullable = false)
    private UUID idPatient;
    
    @Column(name = "id_medecin", nullable = false)
    private UUID idMedecin;
    
    @Column(name = "date_redaction", nullable = false)
    private LocalDateTime dateRedaction;
    
    @Column(name = "motif")
    private String motif;
    
    @Column(name = "nombre_jours_repos")
    private Integer nombreJoursRepos;
    
    @Column(name = "date_debut")
    private LocalDate dateDebut;
    
    @Column(name = "date_fin")
    private LocalDate dateFin;
    
    @Column(name = "pdf_url")
    private String pdfUrl;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (dateRedaction == null) {
            dateRedaction = LocalDateTime.now();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
} 