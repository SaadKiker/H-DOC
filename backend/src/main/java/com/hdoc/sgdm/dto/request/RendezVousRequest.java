package com.hdoc.sgdm.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class RendezVousRequest {
    @NotNull(message = "ID patient is required")
    private UUID idPatient;
    
    @NotNull(message = "ID doctor is required")
    private UUID idMedecin;
    
    @NotNull(message = "Date and time are required")
    @Future(message = "The appointment date must be in the future")
    private LocalDateTime dateHeure;
    
    @NotNull(message = "Duration is required")
    @Positive(message = "Duration must be positive")
    private Integer durationMinutes;
    
    private String note;
    
    private String service;
    
    private String typeVisit;
} 