package com.hdoc.sgdm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChampFormulaireDTO {
    private Integer idChamp;
    private Integer idSection;
    private String nom;
    private Boolean estObligatoire;
    private String typeChamp;
    private String placeholder;
    private Integer ordreAffichage;
    private String valeursPossibles;
    private String unite;
} 