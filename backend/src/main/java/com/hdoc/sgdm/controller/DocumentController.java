package com.hdoc.sgdm.controller;

import com.hdoc.sgdm.dto.common.DocumentImporteDTO;
import com.hdoc.sgdm.dto.request.UpdateDocumentRequest;
import com.hdoc.sgdm.dto.request.UploadDocumentRequest;
import com.hdoc.sgdm.dto.response.DocumentListResponse;
import com.hdoc.sgdm.dto.response.DocumentResponse;
import com.hdoc.sgdm.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DocumentController {
    
    private final DocumentService documentService;
    
    // Development testing endpoint
    @GetMapping("/documents/test")
    public ResponseEntity<Object> testDocumentSystem() {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Document system is working correctly in development mode",
            "note", "File uploads will be recorded in the database but actual files will not be stored until Supabase integration is complete"
        ));
    }
    
    @PostMapping(value = "/patients/{ipp}/documents/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentResponse> uploadDocument(
            @PathVariable String ipp,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam("description") String description,
            @RequestParam("typeDocument") String typeDocument) {
        
        try {
            // Create request object from form parameters
            UploadDocumentRequest request = new UploadDocumentRequest();
            request.setTitle(title);
            request.setDescription(description);
            request.setTypeDocument(typeDocument);
            
            DocumentImporteDTO document = documentService.uploadDocument(ipp, file, request);
            
            DocumentResponse response = new DocumentResponse(
                    true,
                    "Document uploaded successfully",
                    document
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IOException e) {
            DocumentResponse response = new DocumentResponse(
                    false,
                    "Failed to upload document: " + e.getMessage(),
                    null
            );
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * Update document metadata (title, description, type)
     */
    @PutMapping("/documents/{id}")
    public ResponseEntity<DocumentResponse> updateDocument(
            @PathVariable Long id,
            @RequestBody UpdateDocumentRequest request) {
        
        try {
            DocumentImporteDTO updatedDocument = documentService.updateDocument(id, request);
            
            DocumentResponse response = new DocumentResponse(
                    true,
                    "Document metadata updated successfully",
                    updatedDocument
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            DocumentResponse response = new DocumentResponse(
                    false,
                    "Failed to update document: " + e.getMessage(),
                    null
            );
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * Update document file (replace with new file)
     */
    @PutMapping(value = "/documents/{id}/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentResponse> updateDocumentFile(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        
        try {
            DocumentImporteDTO updatedDocument = documentService.updateDocumentFile(id, file);
            
            DocumentResponse response = new DocumentResponse(
                    true,
                    "Document file updated successfully",
                    updatedDocument
            );
            
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            DocumentResponse response = new DocumentResponse(
                    false,
                    "Failed to update document file: " + e.getMessage(),
                    null
            );
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @GetMapping("/patients/{ipp}/documents")
    public ResponseEntity<DocumentListResponse> getDocumentsByPatient(@PathVariable String ipp) {
        List<DocumentImporteDTO> documents = documentService.getDocumentsByPatientIpp(ipp);
        
        DocumentListResponse response = new DocumentListResponse(
                true,
                "Documents retrieved successfully",
                documents
        );
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/documents/{id}")
    public ResponseEntity<DocumentResponse> getDocumentById(@PathVariable Long id) {
        DocumentImporteDTO document = documentService.getDocumentById(id);
        
        DocumentResponse response = new DocumentResponse(
                true,
                "Document retrieved successfully",
                document
        );
        
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/documents/{id}")
    public ResponseEntity<DocumentResponse> deleteDocument(@PathVariable Long id) {
        try {
            documentService.deleteDocument(id);
            
            DocumentResponse response = new DocumentResponse(
                    true,
                    "Document deleted successfully",
                    null
            );
            
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            DocumentResponse response = new DocumentResponse(
                    false,
                    "Failed to delete document: " + e.getMessage(),
                    null
            );
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}