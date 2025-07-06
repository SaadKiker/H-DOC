package com.hdoc.sgdm.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoginRequest {
    
    @NotBlank(message = "Identifiant ne peut pas être vide")
    private String identifiant;
    
    @NotBlank(message = "Mot de passe ne peut pas être vide")
    private String motDePasse;
}