package com.hdoc.sgdm.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DeactivateUtilisateurRequest {
    
    @NotBlank(message = "La raison de désactivation est obligatoire")
    private String raisonDesactivation;
} 