package com.hdoc.sgdm.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionDTO {
    
    @JsonProperty("id_prescription")
    private Integer idPrescription;
    
    @JsonProperty("medicament")
    private MedicamentDTO medicament;
    
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