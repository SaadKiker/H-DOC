package com.hdoc.sgdm.controller;

import com.hdoc.sgdm.dto.common.SpecialiteDTO;
import com.hdoc.sgdm.dto.request.SpecialiteRequest;
import com.hdoc.sgdm.dto.response.SpecialiteListResponse;
import com.hdoc.sgdm.service.SpecialiteService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/specialites")
public class SpecialiteController {

    private final SpecialiteService specialiteService;

    @Autowired
    public SpecialiteController(SpecialiteService specialiteService) {
        this.specialiteService = specialiteService;
    }

    @GetMapping
    public ResponseEntity<SpecialiteListResponse> getAllSpecialites(
            @RequestParam(name = "filterable", required = false, defaultValue = "false") boolean filterable) {
        
        if (filterable) {
            return ResponseEntity.ok(specialiteService.getFilterableSpecialites());
        } else {
            return ResponseEntity.ok(specialiteService.getAllSpecialites());
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SpecialiteDTO> getSpecialiteById(@PathVariable Integer id) {
        SpecialiteDTO specialite = specialiteService.getSpecialiteById(id);
        return ResponseEntity.ok(specialite);
    }
    
    @PostMapping
    public ResponseEntity<SpecialiteDTO> createSpecialite(@Valid @RequestBody SpecialiteRequest request) {
        SpecialiteDTO createdSpecialite = specialiteService.createSpecialite(request);
        return new ResponseEntity<>(createdSpecialite, HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<SpecialiteDTO> updateSpecialite(
            @PathVariable Integer id,
            @Valid @RequestBody SpecialiteRequest request) {
        SpecialiteDTO updatedSpecialite = specialiteService.updateSpecialite(id, request);
        return ResponseEntity.ok(updatedSpecialite);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteSpecialite(@PathVariable Integer id) {
        specialiteService.deleteSpecialite(id);
        
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Spécialité supprimée avec succès");
        
        return ResponseEntity.ok(response);
    }
}