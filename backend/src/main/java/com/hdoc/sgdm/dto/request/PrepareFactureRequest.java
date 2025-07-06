package com.hdoc.sgdm.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrepareFactureRequest {
    @NotNull(message = "ID du patient est obligatoire")
    private UUID idPatient;
    
    @NotNull(message = "ID de visite est obligatoire")
    private Integer idVisite;
} 