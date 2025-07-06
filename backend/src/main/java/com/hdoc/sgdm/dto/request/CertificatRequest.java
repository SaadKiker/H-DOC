package com.hdoc.sgdm.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificatRequest {
    
    @NotNull(message = "L'identifiant du patient est obligatoire")
    private UUID idPatient;
    
    @NotNull(message = "L'identifiant du médecin est obligatoire")
    private UUID idMedecin;
    
    private String motif;
    
    private Integer nombreJoursRepos;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateDebut;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateFin;
    
    private String pdfUrl;
} 