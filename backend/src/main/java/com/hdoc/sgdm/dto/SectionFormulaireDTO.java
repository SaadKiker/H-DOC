package com.hdoc.sgdm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SectionFormulaireDTO {
    private Integer idSection;
    private Integer idModele;
    private String nom;
    private String description;
    private Integer ordreAffichage;
    private Integer idParentSection;
    private List<SectionFormulaireDTO> sousSections;
    private List<ChampFormulaireDTO> champs;
} 