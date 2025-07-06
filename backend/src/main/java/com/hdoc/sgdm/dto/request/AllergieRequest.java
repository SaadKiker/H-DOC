package com.hdoc.sgdm.dto.request;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AllergieRequest {
    
    @JsonProperty("patientId")
    private String patientId;
    
    private UUID idPatient;
    
    @NotBlank(message = "L'allergène est obligatoire")
    @Size(max = 255, message = "L'allergène ne peut pas dépasser 255 caractères")
    private String allergene;
    
    @Size(max = 100, message = "Le type d'allergie ne peut pas dépasser 100 caractères")
    private String typeAllergie;
    
    @NotBlank(message = "La gravité est obligatoire")
    @Size(max = 50, message = "La gravité ne peut pas dépasser 50 caractères")
    private String gravite;
    
    @JsonProperty("reactions")
    private List<String> reactions;
    
    private String reaction;
    
    private LocalDate dateDiagnostic;
    
    private String remarques;
    
    /**
     * Convert frontend data structure to backend before validation
     */
    public UUID getIdPatient() {
        if (idPatient == null && patientId != null && !patientId.isEmpty()) {
            try {
                idPatient = UUID.fromString(patientId);
            } catch (IllegalArgumentException e) {
                // Handle invalid UUID format if needed
            }
        }
        return idPatient;
    }
    
    public void setIdPatient(UUID idPatient) {
        this.idPatient = idPatient;
    }
    
    /**
     * Combine reactions array into a single string
     */
    public String getReaction() {
        if (reaction == null && reactions != null && !reactions.isEmpty()) {
            reaction = String.join(", ", reactions);
        }
        return reaction;
    }
    
    public void setReaction(String reaction) {
        this.reaction = reaction;
    }
} 