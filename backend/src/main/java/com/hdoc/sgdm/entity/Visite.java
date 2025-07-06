package com.hdoc.sgdm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "visite")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Visite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_visite")
    private Long idVisite;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_patient", nullable = false)
    private Patient patient;

    @Column(name = "type_visit", nullable = false, length = 50)
    private String typeVisite;

    @Column(name = "date_debut", nullable = false)
    private LocalDateTime dateDebut;

    @Column(name = "date_fin")
    private LocalDateTime dateFin;

    @Column(name = "statut", nullable = false, length = 20)
    private String statut;

    @Column(name = "motif", nullable = false)
    private String motif;

    @Column(name = "id_medecin")
    private UUID idMedecin; // Can be null

    @Column(name = "service", length = 100)
    private String service;
    
    @Column(name = "id_rdv")
    private Long idRdv; // ID of the appointment that originated this visit
    
    @Column(name = "note", columnDefinition = "TEXT")
    private String note; // The new note field
}