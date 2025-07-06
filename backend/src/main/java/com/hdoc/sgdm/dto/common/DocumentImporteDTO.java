package com.hdoc.sgdm.dto.common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentImporteDTO {
    private Long idDocument;
    private UUID idPatient;
    private String nomPatient;
    private String prenomPatient;
    private String ippPatient;
    private String nom;
    private String description;
    private String typeDocument;
    private LocalDateTime dateAjout;
    private String url;
    // Removed visit related fields
}