package com.hdoc.sgdm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "rendez_vous")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RendezVous {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_rdv")
    private Long id;
    
    @Column(name = "id_patient", nullable = false)
    private UUID idPatient;
    
    @Column(name = "id_medecin", nullable = false)
    private UUID idMedecin;
    
    @Column(name = "date_heure", nullable = false)
    private LocalDateTime dateHeure;
    
    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;
    
    @Column(name = "note")
    private String note;
    
    @Column(name = "service")
    private String service;
    
    @Column(name = "type_visit")
    private String typeVisit;
    
    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private StatutRendezVous status = StatutRendezVous.PLANIFIE;
    
    // Enum for appointment status
    public enum StatutRendezVous {
        PLANIFIE,  // default/scheduled
        LATE,      // patient is late for appointment but still on the same day
        COMMENCE,  // visit started from this appointment
        TERMINE,   // completed (patient came & was seen)
        ANNULE,    // cancelled
        ABSENCE    // patient no-show
    }
} 