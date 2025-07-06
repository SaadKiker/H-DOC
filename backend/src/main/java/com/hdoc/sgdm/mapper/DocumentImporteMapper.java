package com.hdoc.sgdm.mapper;

import com.hdoc.sgdm.dto.common.DocumentImporteDTO;
import com.hdoc.sgdm.entity.DocumentImporte;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class DocumentImporteMapper {

    public DocumentImporteDTO toDTO(DocumentImporte document) {
        if (document == null) {
            return null;
        }
        
        DocumentImporteDTO dto = new DocumentImporteDTO();
        dto.setIdDocument(document.getIdDocument());
        dto.setIdPatient(document.getPatient().getIdPatient());
        dto.setNomPatient(document.getPatient().getNom());
        dto.setPrenomPatient(document.getPatient().getPrenom());
        dto.setIppPatient(document.getPatient().getIpp());
        dto.setNom(document.getNom());
        dto.setDescription(document.getDescription());
        dto.setTypeDocument(document.getTypeDocument());
        dto.setDateAjout(document.getDateAjout());
        dto.setUrl(document.getUrl());
        // No longer mapping visit information
        
        return dto;
    }
    
    public List<DocumentImporteDTO> toDTOList(List<DocumentImporte> documents) {
        return documents.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}