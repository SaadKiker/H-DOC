package com.hdoc.sgdm.controller;

import com.hdoc.sgdm.dto.common.VisiteDTO;
import com.hdoc.sgdm.dto.request.EditVisiteRequest;
import com.hdoc.sgdm.dto.request.EndVisiteRequest;
import com.hdoc.sgdm.dto.request.StartVisiteRequest;
import com.hdoc.sgdm.dto.request.UpdateNoteRequest;
import com.hdoc.sgdm.dto.response.RendezVousResponse;
import com.hdoc.sgdm.dto.response.VisiteListResponse;
import com.hdoc.sgdm.dto.response.VisiteResponse;
import com.hdoc.sgdm.service.RendezVousService;
import com.hdoc.sgdm.service.VisiteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class VisiteController {
    
    private final VisiteService visiteService;
    private final RendezVousService rendezVousService;
    
    @PostMapping("/patients/{ipp}/visites/new")
    public ResponseEntity<VisiteResponse> startVisite(
            @PathVariable String ipp,
            @Valid @RequestBody StartVisiteRequest request) {
        
        VisiteDTO visiteDTO = visiteService.startVisite(ipp, request);
        
        String message = "Visite démarrée avec succès";
        RendezVousResponse rdvResponse = null;
        
        if (visiteDTO.getIdRdv() != null) {
            message += " et liée au rendez-vous #" + visiteDTO.getIdRdv();
            // Get the appointment details if it exists
            try {
                rdvResponse = rendezVousService.getAppointmentById(visiteDTO.getIdRdv());
            } catch (Exception e) {
                // Ignore error if appointment not found or other issue
            }
        }
        
        VisiteResponse response = VisiteResponse.builder()
                .status("success")
                .message(message)
                .visite(visiteDTO)
                .rendezVous(rdvResponse) // Include the appointment in the response
                .build();
        
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    @GetMapping("/patients/{ipp}/visites")
    public ResponseEntity<VisiteListResponse> getVisitesByPatient(@PathVariable String ipp) {
        List<VisiteDTO> visites = visiteService.getVisitesByPatient(ipp);
        
        VisiteListResponse response = VisiteListResponse.builder()
                .status("success")
                .message("Liste des visites récupérée avec succès")
                .visites(visites)
                .count(visites.size())
                .build();
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/patients/{ipp}/visites/active")
    public ResponseEntity<VisiteListResponse> getActiveVisitesByPatient(@PathVariable String ipp) {
        List<VisiteDTO> visites = visiteService.getActiveVisitesByPatient(ipp);
        
        VisiteListResponse response = VisiteListResponse.builder()
                .status("success")
                .message("Liste des visites actives récupérée avec succès")
                .visites(visites)
                .count(visites.size())
                .build();
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get all active visits across all patients with a count.
     * This endpoint must be defined before the /visites/{id} endpoint to avoid path conflicts.
     * 
     * @return List of all active visits with count information
     */
    @GetMapping("/visites/active")
    public ResponseEntity<VisiteListResponse> getAllActiveVisites() {
        List<VisiteDTO> activeVisites = visiteService.getAllActiveVisites();
        int count = activeVisites.size();
        
        VisiteListResponse response = VisiteListResponse.builder()
                .status("success")
                .message("Liste de toutes les visites actives récupérée avec succès")
                .visites(activeVisites)
                .count(count)
                .build();
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get all completed visits for the current day with a count.
     * This endpoint must be defined before the /visites/{id} endpoint to avoid path conflicts.
     * 
     * @param dateStr Optional date parameter in format YYYY-MM-DD. If not provided, defaults to today.
     * @return List of all visits completed on the specified day with count information
     */
    @GetMapping("/visites/completed/today")
    public ResponseEntity<VisiteListResponse> getTodayCompletedVisites(
            @RequestParam(required = false) String dateStr) {
        
        List<VisiteDTO> completedVisites = visiteService.getCompletedVisitesForDay(dateStr);
        int count = completedVisites.size();
        
        String message = dateStr == null ? 
                "Liste des visites terminées aujourd'hui récupérée avec succès" :
                "Liste des visites terminées pour la date " + dateStr + " récupérée avec succès";
        
        VisiteListResponse response = VisiteListResponse.builder()
                .status("success")
                .message(message)
                .visites(completedVisites)
                .count(count)
                .build();
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/visites/{id}")
    public ResponseEntity<VisiteResponse> getVisiteById(@PathVariable Long id) {
        VisiteDTO visiteDTO = visiteService.getVisiteById(id);
        
        VisiteResponse response = VisiteResponse.builder()
                .status("success")
                .message("Visite récupérée avec succès")
                .visite(visiteDTO)
                .build();
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/visites/{id}/end")
    public ResponseEntity<VisiteResponse> endVisite(
            @PathVariable Long id,
            @RequestBody(required = false) EndVisiteRequest request) {
        
        try {
            VisiteDTO visiteDTO = visiteService.endVisite(id);
            
            VisiteResponse response = VisiteResponse.builder()
                    .status("success")
                    .message("Visite terminée avec succès")
                    .visite(visiteDTO)
                    .build();
            
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            VisiteResponse response = VisiteResponse.builder()
                    .status("error")
                    .message(e.getMessage())
                    .build();
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PutMapping("/visites/{id}")
    public ResponseEntity<VisiteResponse> editVisite(
            @PathVariable Long id,
            @Valid @RequestBody EditVisiteRequest request) {
        
        try {
            VisiteDTO visiteDTO = visiteService.editVisite(id, request);
            
            VisiteResponse response = VisiteResponse.builder()
                    .status("success")
                    .message("Visite modifiée avec succès")
                    .visite(visiteDTO)
                    .build();
            
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            VisiteResponse response = VisiteResponse.builder()
                    .status("error")
                    .message(e.getMessage())
                    .build();
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @DeleteMapping("/visites/{id}")
    public ResponseEntity<VisiteResponse> deleteVisite(@PathVariable Long id) {
        try {
            visiteService.deleteVisite(id);
            
            VisiteResponse response = VisiteResponse.builder()
                    .status("success")
                    .message("Visite supprimée avec succès")
                    .build();
            
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            VisiteResponse response = VisiteResponse.builder()
                    .status("error")
                    .message(e.getMessage())
                    .build();
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Updates just the note field of a visit
     * 
     * @param id ID of the visit to update
     * @param request Request containing the new note
     * @return Response with the updated visit
     */
    @PutMapping("/visites/{id}/note")
    public ResponseEntity<VisiteResponse> updateVisiteNote(
            @PathVariable Long id,
            @Valid @RequestBody UpdateNoteRequest request) {
        
        try {
            VisiteDTO visiteDTO = visiteService.updateVisiteNote(id, request);
            
            VisiteResponse response = VisiteResponse.builder()
                    .status("success")
                    .message("Note de visite mise à jour avec succès")
                    .visite(visiteDTO)
                    .build();
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            VisiteResponse response = VisiteResponse.builder()
                    .status("error")
                    .message(e.getMessage())
                    .build();
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Clears the note field of a visit
     * 
     * @param id ID of the visit to update
     * @return Response with the updated visit
     */
    @DeleteMapping("/visites/{id}/note")
    public ResponseEntity<VisiteResponse> clearVisiteNote(@PathVariable Long id) {
        try {
            VisiteDTO visiteDTO = visiteService.clearVisiteNote(id);
            
            VisiteResponse response = VisiteResponse.builder()
                    .status("success")
                    .message("Note de visite supprimée avec succès")
                    .visite(visiteDTO)
                    .build();
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            VisiteResponse response = VisiteResponse.builder()
                    .status("error")
                    .message(e.getMessage())
                    .build();
            
            return ResponseEntity.badRequest().body(response);
        }
    }
}