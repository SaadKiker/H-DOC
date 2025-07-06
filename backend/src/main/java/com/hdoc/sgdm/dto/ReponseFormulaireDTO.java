package com.hdoc.sgdm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReponseFormulaireDTO {
    private Integer idReponse;
    private Integer idFormulaire;
    private Integer idChamp;
    private String nomChamp;
    private String typeChamp;
    private String valeur;
    private Integer idSection;
    private String nomSection;
    private String unite;
} 