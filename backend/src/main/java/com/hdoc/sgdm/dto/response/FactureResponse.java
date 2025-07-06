package com.hdoc.sgdm.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FactureResponse {
    private Integer idFacture;
    private UUID idPatient;
    private Integer idVisite;
    private BigDecimal montant;
    private String modePaiement;
    private String status;
    private LocalDateTime dateFacturation;
    private String url;
    
    // Add pdfUrl field for backward compatibility with frontend
    @JsonProperty("pdfUrl")
    public String getPdfUrl() {
        return url;
    }
    
    // Patient summary information (added for convenience)
    private String nomPatient;
    private String prenomPatient;
} 