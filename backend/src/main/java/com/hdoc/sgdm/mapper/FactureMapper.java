package com.hdoc.sgdm.mapper;

import com.hdoc.sgdm.dto.request.FactureRequest;
import com.hdoc.sgdm.dto.response.FactureResponse;
import com.hdoc.sgdm.entity.Facture;
import com.hdoc.sgdm.entity.Patient;
import com.hdoc.sgdm.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class FactureMapper {
    
    private final PatientRepository patientRepository;
    
    /**
     * Converts a FactureRequest to a Facture entity
     * 
     * @param request the FactureRequest
     * @param idPatient the patient ID from the visit
     * @return a Facture entity
     */
    public Facture toEntity(FactureRequest request, java.util.UUID idPatient) {
        Facture facture = new Facture();
        facture.setIdVisite(request.getIdVisite());
        facture.setIdPatient(idPatient);
        
        // Calculate total amount from consultations
        BigDecimal total = request.getConsultations().stream()
                .map(FactureRequest.ConsultationDetail::getPrix)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        facture.setMontant(total);
        facture.setModePaiement(request.getModePaiement());
        facture.setStatus(request.getStatus());
        facture.setDateFacturation(LocalDateTime.now());
        
        return facture;
    }
    
    /**
     * Converts a Facture entity to a FactureResponse DTO
     * 
     * @param facture the Facture entity
     * @return a FactureResponse DTO
     */
    public FactureResponse toDto(Facture facture) {
        FactureResponse response = new FactureResponse();
        response.setIdFacture(facture.getIdFacture());
        response.setIdPatient(facture.getIdPatient());
        response.setIdVisite(facture.getIdVisite());
        response.setMontant(facture.getMontant());
        response.setModePaiement(facture.getModePaiement());
        response.setStatus(facture.getStatus());
        response.setDateFacturation(facture.getDateFacturation());
        response.setUrl(facture.getUrl());
        
        // Add patient information if available
        Optional<Patient> patientOpt = patientRepository.findByIdPatient(facture.getIdPatient());
        patientOpt.ifPresent(patient -> {
            response.setNomPatient(patient.getNom());
            response.setPrenomPatient(patient.getPrenom());
        });
        
        return response;
    }
} 