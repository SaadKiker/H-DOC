package com.hdoc.sgdm.service;

import com.hdoc.sgdm.dto.common.MedecinDTO;
import com.hdoc.sgdm.dto.common.VisiteDTO;
import com.hdoc.sgdm.dto.response.MedecinListResponse;
import com.hdoc.sgdm.dto.response.VisiteResponse;
import com.hdoc.sgdm.entity.Medecin;
import com.hdoc.sgdm.entity.Visite;
import com.hdoc.sgdm.exception.ResourceNotFoundException;
import com.hdoc.sgdm.mapper.MedecinMapper;
import com.hdoc.sgdm.mapper.PatientMapper;
import com.hdoc.sgdm.mapper.VisiteMapper;
import com.hdoc.sgdm.repository.MedecinRepository;
import com.hdoc.sgdm.repository.SpecialiteRepository;
import com.hdoc.sgdm.repository.VisiteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class MedecinService {

    private final MedecinRepository medecinRepository;
    private final SpecialiteRepository specialiteRepository;
    private final MedecinMapper medecinMapper;
    private final VisiteMapper visiteMapper;
    private final VisiteRepository visiteRepository;

    @Autowired
    public MedecinService(MedecinRepository medecinRepository, SpecialiteRepository specialiteRepository,
                          MedecinMapper medecinMapper, VisiteMapper visiteMapper, VisiteRepository visiteRepository) {
        this.medecinRepository = medecinRepository;
        this.specialiteRepository = specialiteRepository;
        this.medecinMapper = medecinMapper;
        this.visiteMapper = visiteMapper;
        this.visiteRepository = visiteRepository;
    }

    public MedecinListResponse getAllMedecins() {
        List<Medecin> medecins = medecinRepository.findAllActive();
        List<MedecinDTO> medecinDTOs = medecinMapper.toDTOList(medecins);
        
        return MedecinListResponse.builder()
                .status("success")
                .message("Médecins récupérés avec succès")
                .medecins(medecinDTOs)
                .count(medecinDTOs.size())
                .build();
    }

    public VisiteResponse getMedecinActiveVisite(UUID medecinId) {
        // First verify if the medecin exists
        if (!medecinRepository.existsById(medecinId)) {
            return VisiteMapper.toErrorResponse("Médecin non trouvé avec l'id: " + medecinId);
        }
        
        // Find the active visit for this doctor (with status "IN_PROGRESS")
        Optional<Visite> optionalVisite = visiteRepository.findByIdMedecinAndStatut(medecinId, "IN_PROGRESS");
        if (optionalVisite.isEmpty()) {
            return VisiteMapper.toErrorResponse("Aucune visite active trouvée pour ce médecin");
        }
        
        // Map the visit entity to DTO
        VisiteDTO visiteDTO = visiteMapper.toDTO(optionalVisite.get());
        
        // Return successful response
        return VisiteResponse.builder()
                .status("success")
                .message("Visite active récupérée avec succès")
                .visite(visiteDTO)
                .build();
    }

    public MedecinListResponse getMedecinsBySpecialite(Integer specialiteId) {
        // Verify specialiteId is valid
        if (!specialiteRepository.existsById(specialiteId)) {
            throw new ResourceNotFoundException("Specialité non trouvée avec l'id: " + specialiteId);
        }
        
        List<Medecin> medecins = medecinRepository.findBySpecialite(specialiteId);
        List<MedecinDTO> medecinDTOs = medecinMapper.toDTOList(medecins);
        
        return MedecinListResponse.builder()
                .status("success")
                .message("Médecins récupérés avec succès pour la spécialité " + specialiteId)
                .medecins(medecinDTOs)
                .count(medecinDTOs.size())
                .build();
    }
    
    public long countActiveVisitsByMedecin(UUID medecinId) {
        return medecinRepository.countActiveVisits(medecinId);
    }
    
    public MedecinListResponse getMedecinsByStatus(String status) {
        List<Medecin> medecins = medecinRepository.findByStatus(status);
        List<MedecinDTO> medecinDTOs = medecinMapper.toDTOList(medecins);
        
        return MedecinListResponse.builder()
                .status("success")
                .message("Médecins récupérés avec succès avec le statut: " + status)
                .medecins(medecinDTOs)
                .count(medecinDTOs.size())
                .build();
    }
    
    public boolean updateMedecinStatus(UUID medecinId, String newStatus) {
        Optional<Medecin> optionalMedecin = medecinRepository.findById(medecinId);
        if (optionalMedecin.isEmpty()) {
            throw new ResourceNotFoundException("Médecin non trouvé avec l'id: " + medecinId);
        }
        
        Medecin medecin = optionalMedecin.get();
        medecin.setStatus(newStatus);
        medecinRepository.save(medecin);
        
        return true;
    }
}