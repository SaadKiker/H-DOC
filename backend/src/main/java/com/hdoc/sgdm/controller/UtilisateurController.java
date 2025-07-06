package com.hdoc.sgdm.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hdoc.sgdm.dto.request.ActivateUtilisateurRequest;
import com.hdoc.sgdm.dto.request.CreateUtilisateurRequest;
import com.hdoc.sgdm.dto.request.DeactivateUtilisateurRequest;
import com.hdoc.sgdm.dto.request.UpdateUtilisateurRequest;
import com.hdoc.sgdm.dto.response.UtilisateurListResponse;
import com.hdoc.sgdm.dto.response.UtilisateurResponse;
import com.hdoc.sgdm.service.UtilisateurService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/utilisateurs")
@RequiredArgsConstructor
public class UtilisateurController {

    private final UtilisateurService utilisateurService;
    
    @PostMapping
    public ResponseEntity<UtilisateurResponse> createUtilisateur(@Valid @RequestBody CreateUtilisateurRequest request) {
        UtilisateurResponse response = utilisateurService.createUtilisateur(request);
        
        if (response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<UtilisateurResponse> updateUtilisateur(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUtilisateurRequest request) {
        UtilisateurResponse response = utilisateurService.updateUtilisateur(id, request);
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }
    
    @PutMapping("/{id}/deactivate")
    public ResponseEntity<UtilisateurResponse> deactivateUtilisateur(
            @PathVariable UUID id,
            @Valid @RequestBody DeactivateUtilisateurRequest request) {
        UtilisateurResponse response = utilisateurService.deactivateUtilisateur(id, request);
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }
    
    @PutMapping("/{id}/activate")
    public ResponseEntity<UtilisateurResponse> activateUtilisateur(
            @PathVariable UUID id,
            @Valid @RequestBody ActivateUtilisateurRequest request) {
        UtilisateurResponse response = utilisateurService.activateUtilisateur(id, request);
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<UtilisateurResponse> getUtilisateur(@PathVariable UUID id) {
        UtilisateurResponse response = utilisateurService.getUtilisateur(id);
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }
    
    @GetMapping
    public ResponseEntity<UtilisateurListResponse> getAllUtilisateurs() {
        UtilisateurListResponse response = utilisateurService.getAllUtilisateurs();
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/actifs")
    public ResponseEntity<UtilisateurListResponse> getAllActiveUtilisateurs() {
        UtilisateurListResponse response = utilisateurService.getAllActiveUtilisateurs();
        return ResponseEntity.ok(response);
    }
} 