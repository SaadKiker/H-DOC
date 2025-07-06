package com.hdoc.sgdm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModeleFormulaireRequest {
    private String nom;
    private String description;
    private Integer idSpecialite;
    private BigDecimal prix;
} 