package com.hdoc.sgdm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "champs_formulaires")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChampFormulaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_champ")
    private Integer idChamp;

    @Column(name = "id_section", nullable = false)
    private Integer idSection;

    @Column(name = "nom", nullable = false)
    private String nom;

    @Column(name = "est_obligatoire", nullable = false)
    private Boolean estObligatoire;

    @Column(name = "type_champ", nullable = false)
    private String typeChamp;

    @Column(name = "placeholder")
    private String placeholder;

    @Column(name = "ordre_affichage", nullable = false)
    private Integer ordreAffichage;

    @Column(name = "valeurs_possibles")
    private String valeursPossibles;

    @Column(name = "unite")
    private String unite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_section", insertable = false, updatable = false)
    private SectionFormulaire section;
} 