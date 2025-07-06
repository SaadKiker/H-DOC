package com.hdoc.sgdm.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
public class PrescriptionRequest {
    
    @JsonProperty("id_medicament")
    private Integer idMedicament;
    
    @JsonProperty("dosage")
    private Integer dosage;
    
    @JsonProperty("unite_dosage")
    private String uniteDosage;
    
    @JsonProperty("route")
    private String route;
    
    @JsonProperty("frequence")
    private String frequence;
    
    @JsonProperty("instructions")
    private String instructions;
    
    @JsonProperty("date_debut")
    private LocalDate dateDebut;
    
    @JsonProperty("duree")
    private Integer duree;
    
    @JsonProperty("duree_unite")
    private String dureeUnite;
} 