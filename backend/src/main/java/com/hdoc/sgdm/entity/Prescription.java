package com.hdoc.sgdm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "prescription")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Prescription {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_prescription")
    private Integer idPrescription;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_medicament", nullable = false)
    private Medicament medicament;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ordonnance", nullable = false)
    private Ordonnance ordonnance;
    
    @Column(name = "dosage")
    private Integer dosage;
    
    @Column(name = "unite_dosage", length = 50)
    private String uniteDosage;
    
    @Column(name = "route", length = 100)
    private String route;
    
    @Column(name = "frequence", length = 100)
    private String frequence;
    
    @Column(name = "instructions")
    private String instructions;
    
    @Column(name = "date_debut")
    private LocalDate dateDebut;
    
    @Column(name = "duree")
    private Integer duree;
    
    @Column(name = "duree_unite", length = 50)
    private String dureeUnite;
} 