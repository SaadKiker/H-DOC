package com.hdoc.sgdm.dto.response;

import com.hdoc.sgdm.dto.common.DocumentImporteDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentListResponse {
    private boolean success;
    private String message;
    private List<DocumentImporteDTO> documents;
}