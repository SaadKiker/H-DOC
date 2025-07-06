package com.hdoc.sgdm.dto.response;

import com.hdoc.sgdm.dto.common.DocumentImporteDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {
    private boolean success;
    private String message;
    private DocumentImporteDTO document;
}