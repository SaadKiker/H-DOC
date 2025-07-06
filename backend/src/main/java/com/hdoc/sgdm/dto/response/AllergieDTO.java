package com.hdoc.sgdm.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AllergieDTO {
    
    private Long idAllergie;
    private UUID idPatient;
    private String allergene;
    private String typeAllergie;
    private String gravite;
    private String reaction;
    private LocalDate dateDiagnostic;
    private String remarques;
    private LocalDateTime createdAt;
} 