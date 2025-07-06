package com.hdoc.sgdm.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMedecinStatusRequest {
    
    @NotBlank(message = "Le statut est obligatoire")
    @Pattern(regexp = "AVAILABLE|UNAVAILABLE|ON_LEAVE|SICK", message = "Le statut doit être l'un des suivants: AVAILABLE, UNAVAILABLE, ON_LEAVE, SICK")
    private String status;
}