package com.hdoc.sgdm.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrdonnanceDTO {
    
    @JsonProperty("id_ordonnance")
    private Long idOrdonnance;
    
    @JsonProperty("id_patient")
    private UUID idPatient;
    
    @JsonProperty("id_visite")
    private Long idVisite;
    
    @JsonProperty("id_medecin")
    private UUID idMedecin;
    
    @JsonProperty("date_creation")
    private LocalDateTime dateCreation;
    
    @JsonProperty("url")
    private String url;
    
    @JsonProperty("statut")
    private String statut;
    
    @JsonProperty("nom_patient")
    private String nomPatient;
    
    @JsonProperty("prenom_patient")
    private String prenomPatient;
    
    @JsonProperty("nom_medecin")
    private String nomMedecin;
    
    @JsonProperty("prenom_medecin")
    private String prenomMedecin;
    
    @JsonProperty("prescriptions")
    private List<PrescriptionDTO> prescriptions;
} 