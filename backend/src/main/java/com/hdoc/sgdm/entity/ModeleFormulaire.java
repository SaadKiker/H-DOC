package com.hdoc.sgdm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.math.BigDecimal;

@Entity
@Table(name = "modeles_formulaires")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModeleFormulaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_modele")
    private Integer idModele;

    @Column(name = "nom", nullable = false)
    private String nom;

    @Column(name = "description")
    private String description;

    @Column(name = "id_specialite", nullable = false)
    private Integer idSpecialite;

    @Column(name = "prix", nullable = false, columnDefinition = "DECIMAL(10,2) DEFAULT 0.00")
    private BigDecimal prix;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_specialite", insertable = false, updatable = false)
    private Specialite specialite;

    @OneToMany(mappedBy = "modeleFormulaire", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SectionFormulaire> sections;
} 