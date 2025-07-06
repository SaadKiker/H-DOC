package com.hdoc.sgdm.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDocumentRequest {
    private String title;
    
    private String description;
    
    private String typeDocument;
} 