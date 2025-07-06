package com.hdoc.sgdm.dto.response;

import com.hdoc.sgdm.dto.common.MedecinDTO;
import com.hdoc.sgdm.dto.common.PatientDTO;
import com.hdoc.sgdm.entity.RendezVous;
import com.hdoc.sgdm.entity.RendezVous.StatutRendezVous;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class RendezVousResponse {
    private Long id;
    private UUID idPatient;
    private String nomPatient;
    private String prenomPatient;
    private UUID idMedecin;
    private String nomMedecin;
    private String specialiteMedecin;
    private LocalDateTime dateHeure;
    private Integer durationMinutes;
    private String note;
    private StatutRendezVous status;
    private String service;
    private String typeVisit;
    
    // Complete objects
    private PatientDTO patient;
    private MedecinDTO medecin;
} 