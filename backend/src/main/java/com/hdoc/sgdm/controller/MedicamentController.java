package com.hdoc.sgdm.controller;

import com.hdoc.sgdm.dto.response.MedicamentDTO;
import com.hdoc.sgdm.entity.Medicament;
import com.hdoc.sgdm.repository.MedicamentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/medicaments")
public class MedicamentController {
    private static final Logger logger = LoggerFactory.getLogger(MedicamentController.class);
    
    private final MedicamentRepository medicamentRepository;
    
    @Autowired
    public MedicamentController(MedicamentRepository medicamentRepository) {
        this.medicamentRepository = medicamentRepository;
    }
    
    /**
     * Get all medicaments
     * 
     * @return List of all medicaments
     */
    @GetMapping
    public ResponseEntity<List<MedicamentDTO>> getAllMedicaments() {
        logger.info("Fetching all medicaments");
        
        List<MedicamentDTO> medicaments = medicamentRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(medicaments);
    }
    
    /**
     * Search for medicaments by name
     * 
     * @param query Search query
     * @return List of matching medicaments
     */
    @GetMapping("/search")
    public ResponseEntity<List<MedicamentDTO>> searchMedicaments(@RequestParam String query) {
        logger.info("Searching for medicaments with query: {}", query);
        
        List<MedicamentDTO> medicaments = medicamentRepository.findByNomContainingIgnoreCase(query).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(medicaments);
    }
    
    /**
     * Convert Medicament entity to DTO
     */
    private MedicamentDTO mapToDTO(Medicament medicament) {
        return MedicamentDTO.builder()
                .idMedicament(medicament.getIdMedicament())
                .nom(medicament.getNom())
                .description(medicament.getDescription())
                .build();
    }
} 