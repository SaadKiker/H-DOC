package com.hdoc.sgdm.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FactureRequest {
    @NotNull(message = "ID de visite est obligatoire")
    private Integer idVisite;
    
    @NotNull(message = "Mode de paiement est obligatoire")
    @Size(max = 50, message = "Mode de paiement ne peut pas dépasser 50 caractères")
    private String modePaiement;
    
    @NotNull(message = "Status est obligatoire")
    @Size(max = 20, message = "Status ne peut pas dépasser 20 caractères")
    private String status;
    
    @NotNull(message = "Consultations sont obligatoires")
    @NotEmpty(message = "Au moins une consultation doit être spécifiée")
    private List<ConsultationDetail> consultations;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConsultationDetail {
        @NotNull(message = "Description de la consultation est obligatoire")
        private String description;
        
        @NotNull(message = "Prix de la consultation est obligatoire")
        private BigDecimal prix;
    }
} 