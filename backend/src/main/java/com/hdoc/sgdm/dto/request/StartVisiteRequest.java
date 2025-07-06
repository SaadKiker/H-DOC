package com.hdoc.sgdm.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StartVisiteRequest {
    
    @NotBlank(message = "Le type de visite est obligatoire")
    private String typeVisite;
    
    @NotBlank(message = "Le motif est obligatoire")
    private String motif;
    
    private String idMedecin; // Will be null for now, until medecin implementation
    
    private String service;
    
    private Long idRdv; // Optional ID of the appointment that originated this visit
    
    private String note; // Optional note for the visit
}