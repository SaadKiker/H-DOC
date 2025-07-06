package com.hdoc.sgdm.service;

import com.hdoc.sgdm.dto.common.SpecialiteDTO;
import com.hdoc.sgdm.dto.request.SpecialiteRequest;
import com.hdoc.sgdm.dto.response.SpecialiteListResponse;
import com.hdoc.sgdm.entity.Specialite;
import com.hdoc.sgdm.exception.ResourceNotFoundException;
import com.hdoc.sgdm.mapper.SpecialiteMapper;
import com.hdoc.sgdm.repository.SpecialiteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SpecialiteService {

    private final SpecialiteRepository specialiteRepository;
    private final SpecialiteMapper specialiteMapper;

    @Autowired
    public SpecialiteService(SpecialiteRepository specialiteRepository, SpecialiteMapper specialiteMapper) {
        this.specialiteRepository = specialiteRepository;
        this.specialiteMapper = specialiteMapper;
    }

    public SpecialiteListResponse getAllSpecialites() {
        List<Specialite> specialites = specialiteRepository.findAll();
        List<SpecialiteDTO> specialiteDTOs = specialiteMapper.toDTOList(specialites);
        
        return SpecialiteListResponse.builder()
                .status("success")
                .message("Spécialités récupérées avec succès")
                .specialites(specialiteDTOs)
                .count(specialiteDTOs.size())
                .build();
    }
    
    public SpecialiteListResponse getFilterableSpecialites() {
        List<Specialite> allSpecialites = specialiteRepository.findAll();
        
        // Filter out GEN specialty
        List<Specialite> filteredSpecialites = allSpecialites.stream()
                .filter(spec -> !"GEN".equals(spec.getCodeSpecialite()))
                .collect(Collectors.toList());
                
        List<SpecialiteDTO> specialiteDTOs = specialiteMapper.toDTOList(filteredSpecialites);
        
        return SpecialiteListResponse.builder()
                .status("success")
                .message("Spécialités filtrables récupérées avec succès")
                .specialites(specialiteDTOs)
                .count(specialiteDTOs.size())
                .build();
    }
    
    public SpecialiteDTO createSpecialite(SpecialiteRequest request) {
        Specialite specialite = Specialite.builder()
                .codeSpecialite(request.getCodeSpecialite())
                .nom(request.getNom())
                .description(request.getDescription())
                .build();
                
        Specialite savedSpecialite = specialiteRepository.save(specialite);
        return specialiteMapper.toDTO(savedSpecialite);
    }
    
    public SpecialiteDTO updateSpecialite(Integer id, SpecialiteRequest request) {
        Specialite specialite = specialiteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Spécialité non trouvée avec l'ID: " + id));
                
        specialite.setCodeSpecialite(request.getCodeSpecialite());
        specialite.setNom(request.getNom());
        specialite.setDescription(request.getDescription());
        
        Specialite updatedSpecialite = specialiteRepository.save(specialite);
        return specialiteMapper.toDTO(updatedSpecialite);
    }
    
    public void deleteSpecialite(Integer id) {
        Specialite specialite = specialiteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Spécialité non trouvée avec l'ID: " + id));
                
        specialiteRepository.delete(specialite);
    }
    
    public SpecialiteDTO getSpecialiteById(Integer id) {
        Specialite specialite = specialiteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Spécialité non trouvée avec l'ID: " + id));
                
        return specialiteMapper.toDTO(specialite);
    }
}