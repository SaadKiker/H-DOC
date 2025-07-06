package com.hdoc.sgdm.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
public class OrdonnanceRequest {
    
    @JsonProperty("id_patient")
    private UUID idPatient;
    
    @JsonProperty("id_visite")
    private Long idVisite;
    
    @JsonProperty("id_medecin")
    private UUID idMedecin;
    
    @JsonProperty("prescriptions")
    private List<PrescriptionRequest> prescriptions;
} 