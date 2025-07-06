package com.hdoc.sgdm.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UploadDocumentRequest {
    private String title; // Optional title for the document
    
    @NotBlank(message = "La description est obligatoire")
    private String description;
    
    @NotBlank(message = "Le type de document est obligatoire")
    private String typeDocument;
    
    // Documents are only associated with patients, not with visits
}