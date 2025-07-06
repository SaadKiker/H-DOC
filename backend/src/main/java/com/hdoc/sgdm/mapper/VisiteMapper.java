package com.hdoc.sgdm.mapper;

import com.hdoc.sgdm.dto.common.VisiteDTO;
import com.hdoc.sgdm.dto.response.PatientResponse;
import com.hdoc.sgdm.dto.response.VisiteResponse;
import com.hdoc.sgdm.entity.Medecin;
import com.hdoc.sgdm.entity.Visite;
import com.hdoc.sgdm.repository.MedecinRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class VisiteMapper {
    
    private final MedecinRepository medecinRepository;
    private final MedecinMapper medecinMapper;
    
    @Autowired
    public VisiteMapper(MedecinRepository medecinRepository, MedecinMapper medecinMapper) {
        this.medecinRepository = medecinRepository;
        this.medecinMapper = medecinMapper;
    }
    
    public VisiteDTO toDTO(Visite visite) {
        if (visite == null) {
            return null;
        }
        
        try {
            VisiteDTO.VisiteDTOBuilder builder = VisiteDTO.builder()
                    .idVisite(visite.getIdVisite())
                    .typeVisite(visite.getTypeVisite())
                    .dateDebut(visite.getDateDebut())
                    .dateFin(visite.getDateFin())
                    .statut(visite.getStatut())
                    .motif(visite.getMotif())
                    .idMedecin(visite.getIdMedecin())
                    .service(visite.getService())
                    .idRdv(visite.getIdRdv())
                    .note(visite.getNote())
                    .fromAppointment(visite.getIdRdv() != null)
                    .patient(visite.getPatient() != null ? PatientMapper.toPatientDTO(visite.getPatient()) : null);
                    
            // Add doctor information if available
            if (visite.getIdMedecin() != null) {
                Optional<Medecin> medecin = medecinRepository.findByIdWithUtilisateur(visite.getIdMedecin());
                if (medecin.isPresent()) {
                    builder.medecin(medecinMapper.toDTO(medecin.get()));
                }
            }
            
            return builder.build();
        } catch (Exception e) {
            // Fallback with minimal data to prevent complete failure
            return VisiteDTO.builder()
                    .idVisite(visite.getIdVisite())
                    .typeVisite(visite.getTypeVisite())
                    .dateDebut(visite.getDateDebut())
                    .dateFin(visite.getDateFin())
                    .statut(visite.getStatut())
                    .build();
        }
    }
    
    public List<VisiteDTO> toDTOList(List<Visite> visites) {
        if (visites == null) {
            return List.of();
        }
        
        return visites.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public static VisiteResponse toErrorResponse(String message) {
        return VisiteResponse.builder()
                .status("false")
                .message(message)
                .build();
    }
}