package com.hdoc.sgdm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "sections_formulaires")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SectionFormulaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_section")
    private Integer idSection;

    @Column(name = "id_modele", nullable = false)
    private Integer idModele;

    @Column(name = "nom", nullable = false)
    private String nom;

    @Column(name = "description")
    private String description;

    @Column(name = "ordre_affichage", nullable = false)
    private Integer ordreAffichage;

    @Column(name = "id_parent_section")
    private Integer idParentSection;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_modele", insertable = false, updatable = false)
    private ModeleFormulaire modeleFormulaire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_parent_section", insertable = false, updatable = false)
    private SectionFormulaire sectionParent;

    @OneToMany(mappedBy = "sectionParent", cascade = CascadeType.ALL)
    private List<SectionFormulaire> sousSection;

    @OneToMany(mappedBy = "section", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChampFormulaire> champs;
} 