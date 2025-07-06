package com.hdoc.sgdm.mapper;

import com.hdoc.sgdm.dto.common.SpecialiteDTO;
import com.hdoc.sgdm.entity.Specialite;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class SpecialiteMapper {

    public SpecialiteDTO toDTO(Specialite specialite) {
        if (specialite == null) {
            return null;
        }

        return SpecialiteDTO.builder()
                .idSpecialite(specialite.getIdSpecialite())
                .codeSpecialite(specialite.getCodeSpecialite())
                .nom(specialite.getNom())
                .description(specialite.getDescription())
                .build();
    }

    public List<SpecialiteDTO> toDTOList(List<Specialite> specialites) {
        if (specialites == null) {
            return List.of();
        }

        return specialites.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}