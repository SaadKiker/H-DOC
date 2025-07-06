package com.hdoc.sgdm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormulairePatientDTO {
    private Integer idFormulaire;
    private UUID idPatient;
    private String nomPatient;
    private Integer idModele;
    private String nomModele;
    private String status;
    private UUID idMedecin;
    private String nomMedecin;
    private Integer idVisite;
    private LocalDateTime dateRemplissage;
    private BigDecimal prix;
    private List<ReponseFormulaireDTO> reponses;
} 