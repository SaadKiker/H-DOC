package com.hdoc.sgdm.dto.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisiteDTO {
    private Long idVisite;
    private String typeVisite;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private String statut;
    private String motif;
    private UUID idMedecin; // Can be null
    private String service;
    private Long idRdv; // ID of the appointment that originated this visit
    private boolean fromAppointment; // Flag indicating if visit created from appointment
    private PatientDTO patient;
    private MedecinDTO medecin; // Added to include doctor details
    private String note; // Added note field
}