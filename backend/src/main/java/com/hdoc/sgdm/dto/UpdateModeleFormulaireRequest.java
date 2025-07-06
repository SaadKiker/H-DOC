package com.hdoc.sgdm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateModeleFormulaireRequest {
    private Integer idModele; // Required for update
    private String nom;
    private String description;
    private Integer idSpecialite;
    private BigDecimal prix;
    private List<SectionRequest> sections;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SectionRequest {
        private Integer idSection; // Null for new sections
        private String nom;
        private String description;
        private Integer ordreAffichage;
        private Integer idParentSection; // Optional: null for top-level sections, id for subsections
        private List<ChampRequest> champs;
        private List<SectionRequest> sousSections;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChampRequest {
        private Integer idChamp; // Null for new fields
        private String nom;
        private Boolean estObligatoire;
        private String typeChamp;
        private String placeholder;
        private Integer ordreAffichage;
        private String valeursPossibles;
        private String unite;
    }
} 