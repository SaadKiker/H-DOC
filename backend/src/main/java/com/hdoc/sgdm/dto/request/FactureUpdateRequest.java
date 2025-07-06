package com.hdoc.sgdm.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FactureUpdateRequest {
    @NotNull(message = "Montant est obligatoire")
    private BigDecimal montant;
    
    @NotNull(message = "Mode de paiement est obligatoire")
    @Size(max = 50, message = "Mode de paiement ne peut pas dépasser 50 caractères")
    private String modePaiement;
    
    @NotNull(message = "Status est obligatoire")
    @Size(max = 20, message = "Status ne peut pas dépasser 20 caractères")
    private String status;
    
    // Optional fields
    private LocalDateTime dateFacturation;
    private String url;
} 