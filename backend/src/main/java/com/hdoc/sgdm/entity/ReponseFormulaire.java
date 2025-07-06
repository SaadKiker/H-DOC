package com.hdoc.sgdm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "reponses_formulaires")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReponseFormulaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_reponse")
    private Integer idReponse;

    @Column(name = "id_formulaire", nullable = false)
    private Integer idFormulaire;

    @Column(name = "id_champ", nullable = false)
    private Integer idChamp;

    @Column(name = "valeur")
    private String valeur;

    @Column(name = "id_section", nullable = false)
    private Integer idSection;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_formulaire", insertable = false, updatable = false)
    private FormulairePatient formulairePatient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_champ", insertable = false, updatable = false)
    private ChampFormulaire champFormulaire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_section", insertable = false, updatable = false)
    private SectionFormulaire section;
} 