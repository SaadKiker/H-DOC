package com.hdoc.sgdm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormulaireRequest {
    private UUID idPatient;
    private Integer idModele;
    private String status;
    private UUID idMedecin;
    private Integer idVisite;
    private List<ReponseRequest> reponses;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReponseRequest {
        private Integer idChamp;
        private String valeur;
        private Integer idSection;
    }
} 