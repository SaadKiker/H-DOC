package com.hdoc.sgdm.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicamentDTO {
    
    @JsonProperty("id_medicament")
    private Integer idMedicament;
    
    @JsonProperty("nom")
    private String nom;
    
    @JsonProperty("description")
    private String description;
} 