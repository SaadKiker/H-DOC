package com.hdoc.sgdm.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificatDTO {
    
    private Long idCertificat;
    
    private UUID idPatient;
    
    private UUID idMedecin;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime dateRedaction;
    
    private String motif;
    
    private Integer nombreJoursRepos;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateDebut;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateFin;
    
    private String pdfUrl;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    // Additional information for display
    private String nomPatient;
    private String prenomPatient;
    private String nomMedecin;
    private String prenomMedecin;
} 