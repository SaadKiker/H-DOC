package com.hdoc.sgdm.controller;

import com.hdoc.sgdm.dto.common.MedecinDTO;
import com.hdoc.sgdm.dto.common.VisiteDTO;
import com.hdoc.sgdm.dto.request.UpdateMedecinStatusRequest;
import com.hdoc.sgdm.dto.response.MedecinListResponse;
import com.hdoc.sgdm.dto.response.VisiteListResponse;
import com.hdoc.sgdm.dto.response.VisiteResponse;
import com.hdoc.sgdm.entity.Medecin;
import com.hdoc.sgdm.exception.ResourceNotFoundException;
import com.hdoc.sgdm.mapper.MedecinMapper;
import com.hdoc.sgdm.repository.MedecinRepository;
import com.hdoc.sgdm.service.MedecinService;
import com.hdoc.sgdm.service.VisiteService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/medecins")
public class MedecinController {

    private final MedecinService medecinService;
    private final VisiteService visiteService;
    private final MedecinRepository medecinRepository;
    private final MedecinMapper medecinMapper;

    @Autowired
    public MedecinController(MedecinService medecinService, VisiteService visiteService, 
                            MedecinRepository medecinRepository, MedecinMapper medecinMapper) {
        this.medecinService = medecinService;
        this.visiteService = visiteService;
        this.medecinRepository = medecinRepository;
        this.medecinMapper = medecinMapper;
    }

    /**
     * Get a single doctor by ID
     * 
     * @param id The doctor's UUID
     * @return The doctor's information or an error
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getMedecinById(@PathVariable("id") UUID id) {
        try {
            Optional<Medecin> medecinOpt = medecinRepository.findById(id);
            
            if (medecinOpt.isEmpty()) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", "Médecin non trouvé avec l'id: " + id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
            
            MedecinDTO medecinDTO = medecinMapper.toDTO(medecinOpt.get());
            return ResponseEntity.ok(medecinDTO);
        } catch (Exception e) {
            // Log the exception
            e.printStackTrace();
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Une erreur est survenue lors de la récupération du médecin: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping
    public ResponseEntity<MedecinListResponse> getAllMedecins(
            @RequestParam(name = "specialite", required = false) Integer specialiteId,
            @RequestParam(name = "status", required = false) String status) {

        if (status != null) {
            return ResponseEntity.ok(medecinService.getMedecinsByStatus(status));
        } else if (specialiteId != null) {
            return ResponseEntity.ok(medecinService.getMedecinsBySpecialite(specialiteId));
        } else {
            return ResponseEntity.ok(medecinService.getAllMedecins());
        }
    }
    
    @GetMapping("/{id}/active-visits")
    public ResponseEntity<Long> getActiveVisitsCount(@PathVariable("id") UUID medecinId) {
        long count = medecinService.countActiveVisitsByMedecin(medecinId);
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/{id}/visites/active")
    public ResponseEntity<VisiteResponse> getMedecinActiveVisite(@PathVariable("id") UUID medecinId) {
        VisiteResponse response = medecinService.getMedecinActiveVisite(medecinId);
        if ("success".equals(response.getStatus())) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Get completed visits for a specific doctor on a specific day (defaults to today).
     * This endpoint is needed for the doctor dashboard to show completed visits.
     * 
     * @param medecinId The doctor's ID
     * @param dateStr Optional date parameter in format YYYY-MM-DD. If not provided, defaults to today.
     * @return List of completed visits for the specified doctor on the specified day
     */
    @GetMapping("/{id}/visites/completed/today")
    public ResponseEntity<VisiteListResponse> getMedecinCompletedVisitesForDay(
            @PathVariable("id") UUID medecinId,
            @RequestParam(required = false) String dateStr) {
        
        List<VisiteDTO> completedVisites = visiteService.getCompletedVisitesForDoctorAndDay(medecinId, dateStr);
        int count = completedVisites.size();
        
        String message = dateStr == null ? 
                "Liste des visites terminées aujourd'hui pour ce médecin récupérée avec succès" :
                "Liste des visites terminées pour ce médecin à la date " + dateStr + " récupérée avec succès";
        
        VisiteListResponse response = VisiteListResponse.builder()
                .status("success")
                .message(message)
                .visites(completedVisites)
                .count(count)
                .build();
        
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateMedecinStatus(
            @PathVariable("id") UUID medecinId,
            @Valid @RequestBody UpdateMedecinStatusRequest request) {
            
        boolean updated = medecinService.updateMedecinStatus(medecinId, request.getStatus());
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Statut du médecin mis à jour avec succès");
        response.put("updated", updated);
        
        return ResponseEntity.ok(response);
    }
}