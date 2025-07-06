package com.hdoc.sgdm.service;

import com.hdoc.sgdm.dto.common.DocumentImporteDTO;
import com.hdoc.sgdm.dto.request.UpdateDocumentRequest;
import com.hdoc.sgdm.dto.request.UploadDocumentRequest;
import com.hdoc.sgdm.entity.DocumentImporte;
import com.hdoc.sgdm.entity.Patient;
import com.hdoc.sgdm.exception.ResourceNotFoundException;
import com.hdoc.sgdm.mapper.DocumentImporteMapper;
import com.hdoc.sgdm.repository.DocumentImporteRepository;
import com.hdoc.sgdm.repository.PatientRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class DocumentService {
    private static final Logger logger = LoggerFactory.getLogger(DocumentService.class);

    private final DocumentImporteRepository documentRepository;
    private final PatientRepository patientRepository;
    private final SupabaseStorageService storageService;
    private final DocumentImporteMapper documentMapper;
    
    @Autowired
    public DocumentService(
            DocumentImporteRepository documentRepository,
            PatientRepository patientRepository,
            SupabaseStorageService storageService,
            DocumentImporteMapper documentMapper) {
        this.documentRepository = documentRepository;
        this.patientRepository = patientRepository;
        this.storageService = storageService;
        this.documentMapper = documentMapper;
    }
    
    public DocumentImporteDTO uploadDocument(String ipp, MultipartFile file, UploadDocumentRequest request) throws IOException {
        // Find patient by IPP
        Patient patient = patientRepository.findByIpp(ipp)
                .orElseThrow(() -> new ResourceNotFoundException("Patient with IPP " + ipp + " not found"));
        
        // Sanitize and prepare title from original filename or request data
        String originalFilename = file.getOriginalFilename();
        String title = request.getTitle() != null && !request.getTitle().isEmpty() 
                ? request.getTitle() 
                : (originalFilename != null ? originalFilename.replaceAll("\\.[^.]+$", "") : "Document");
        
        logger.info("Uploading document for patient IPP {}: {}, type: {}", ipp, title, request.getTypeDocument());
        
        // Upload file to Supabase with proper organization
        String fileUrl = storageService.uploadPatientDocument(file, ipp, request.getTypeDocument(), title);
        logger.info("Document uploaded successfully to: {}", fileUrl);
        
        // Create document entity
        DocumentImporte document = new DocumentImporte();
        document.setPatient(patient);
        document.setNom(title);
        document.setDescription(request.getDescription());
        document.setTypeDocument(request.getTypeDocument());
        document.setDateAjout(LocalDateTime.now());
        document.setUrl(fileUrl);
        
        // Save document to database
        DocumentImporte savedDocument = documentRepository.save(document);
        logger.info("Document record saved with ID: {}", savedDocument.getIdDocument());
        
        // Return DTO
        return documentMapper.toDTO(savedDocument);
    }
    
    /**
     * Updates an existing document's metadata
     *
     * @param id The document ID to update
     * @param request The updated metadata
     * @return The updated document DTO
     */
    public DocumentImporteDTO updateDocument(Long id, UpdateDocumentRequest request) {
        // Find document
        DocumentImporte document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document with ID " + id + " not found"));
        
        logger.info("Updating document with ID {}", id);
        
        // Update metadata if provided in request
        if (request.getTitle() != null && !request.getTitle().isEmpty()) {
            document.setNom(request.getTitle());
        }
        
        if (request.getDescription() != null) {
            document.setDescription(request.getDescription());
        }
        
        if (request.getTypeDocument() != null && !request.getTypeDocument().isEmpty()) {
            document.setTypeDocument(request.getTypeDocument());
        }
        
        // Save updated document
        DocumentImporte updatedDocument = documentRepository.save(document);
        logger.info("Document with ID {} updated successfully", id);
        
        // Return updated DTO
        return documentMapper.toDTO(updatedDocument);
    }
    
    /**
     * Updates an existing document's file (replaces it with a new one)
     * 
     * @param id The document ID to update
     * @param file The new file to replace the existing one
     * @return The updated document DTO
     */
    public DocumentImporteDTO updateDocumentFile(Long id, MultipartFile file) throws IOException {
        // Find document
        DocumentImporte document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document with ID " + id + " not found"));
        
        // Get patient IPP for folder structure
        String patientIpp = document.getPatient().getIpp();
        String documentType = document.getTypeDocument();
        String title = document.getNom();
        
        logger.info("Replacing file for document ID {} (Patient IPP: {})", id, patientIpp);
        
        // Delete the old file if possible
        try {
            boolean deleted = storageService.deleteFile(document.getUrl());
            if (!deleted) {
                logger.warn("Could not delete previous file: {}", document.getUrl());
            }
        } catch (Exception e) {
            logger.warn("Error deleting previous file: {}", e.getMessage());
        }
        
        // Upload the new file
        String newFileUrl = storageService.uploadPatientDocument(file, patientIpp, documentType, title);
        logger.info("New file uploaded successfully to: {}", newFileUrl);
        
        // Update document with new file URL
        document.setUrl(newFileUrl);
        
        // Save updated document
        DocumentImporte updatedDocument = documentRepository.save(document);
        logger.info("Document file with ID {} updated successfully", id);
        
        // Return updated DTO
        return documentMapper.toDTO(updatedDocument);
    }
    
    public List<DocumentImporteDTO> getDocumentsByPatientIpp(String ipp) {
        // Check if patient exists
        if (!patientRepository.existsByIpp(ipp)) {
            throw new ResourceNotFoundException("Patient with IPP " + ipp + " not found");
        }
        
        // Get documents for patient
        List<DocumentImporte> documents = documentRepository.findByPatientIpp(ipp);
        
        // Map to DTOs
        return documentMapper.toDTOList(documents);
    }
    
    public DocumentImporteDTO getDocumentById(Long id) {
        DocumentImporte document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document with ID " + id + " not found"));
        
        return documentMapper.toDTO(document);
    }
    
    public void deleteDocument(Long id) throws IOException {
        // Find document
        DocumentImporte document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document with ID " + id + " not found"));
        
        // Delete from Supabase storage
        boolean deleted = storageService.deleteFile(document.getUrl());
        
        if (!deleted) {
            logger.warn("Could not delete document file from storage: {}", document.getUrl());
        }
        
        // Delete from database
        documentRepository.delete(document);
        logger.info("Document with ID {} deleted", id);
    }
}