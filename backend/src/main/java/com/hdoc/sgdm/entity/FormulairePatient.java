package com.hdoc.sgdm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "formulaires_patients")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormulairePatient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_formulaire")
    private Integer idFormulaire;

    @Column(name = "id_patient", nullable = false)
    private UUID idPatient;

    @Column(name = "id_modele", nullable = false)
    private Integer idModele;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "id_medecin", nullable = false)
    private UUID idMedecin;

    @Column(name = "id_visite", nullable = false)
    private Integer idVisite;

    @Column(name = "date_remplissage", nullable = false)
    private LocalDateTime dateRemplissage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_patient", insertable = false, updatable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_modele", insertable = false, updatable = false)
    private ModeleFormulaire modeleFormulaire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_medecin", insertable = false, updatable = false)
    private Medecin medecin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_visite", insertable = false, updatable = false)
    private Visite visite;

    @OneToMany(mappedBy = "formulairePatient", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReponseFormulaire> reponses;
} 