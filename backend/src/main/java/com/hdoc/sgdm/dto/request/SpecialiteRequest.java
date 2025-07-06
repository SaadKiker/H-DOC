package com.hdoc.sgdm.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpecialiteRequest {
    
    @NotBlank(message = "Le code de spécialité est obligatoire")
    private String codeSpecialite;
    
    @NotBlank(message = "Le nom est obligatoire")
    private String nom;
    
    private String description;
} 