package com.hdoc.sgdm.mapper;

import com.hdoc.sgdm.dto.common.MedecinDTO;
import com.hdoc.sgdm.entity.Medecin;
import com.hdoc.sgdm.entity.Specialite;
import com.hdoc.sgdm.repository.SpecialiteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class MedecinMapper {

    private final SpecialiteRepository specialiteRepository;

    @Autowired
    public MedecinMapper(SpecialiteRepository specialiteRepository) {
        this.specialiteRepository = specialiteRepository;
    }

    public MedecinDTO toDTO(Medecin medecin) {
        if (medecin == null) {
            return null;
        }

        String nomSpecialite = "";
        if (medecin.getIdSpecialite() != null) {
            Optional<Specialite> specialite = specialiteRepository.findById(medecin.getIdSpecialite());
            if (specialite.isPresent()) {
                nomSpecialite = specialite.get().getNom();
            }
        }

        return MedecinDTO.builder()
                .idMedecin(medecin.getIdMedecin())
                .idSpecialite(medecin.getIdSpecialite())
                .nomSpecialite(nomSpecialite)
                .nom(medecin.getUtilisateur() != null ? medecin.getUtilisateur().getNom() : "")
                .prenom(medecin.getUtilisateur() != null ? medecin.getUtilisateur().getPrenom() : "")
                .status(medecin.getStatus())
                .build();
    }

    public List<MedecinDTO> toDTOList(List<Medecin> medecins) {
        if (medecins == null) {
            return List.of();
        }

        return medecins.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}