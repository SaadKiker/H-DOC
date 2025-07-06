package com.hdoc.sgdm.dto.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedecinDTO {
    private UUID idMedecin;
    private Integer idSpecialite;
    private String nomSpecialite;
    private String nom;
    private String prenom;
    private String status;
}