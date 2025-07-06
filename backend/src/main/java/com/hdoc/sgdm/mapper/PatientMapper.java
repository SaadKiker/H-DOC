package com.hdoc.sgdm.mapper;

import com.hdoc.sgdm.dto.common.PatientDTO;
import com.hdoc.sgdm.dto.request.CreatePatientRequest;
import com.hdoc.sgdm.dto.request.UpdatePatientRequest;
import com.hdoc.sgdm.dto.response.PatientResponse;
import com.hdoc.sgdm.dto.response.PatientSearchResponse;
import com.hdoc.sgdm.entity.Patient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class PatientMapper {

    public static PatientDTO toPatientDTO(Patient patient) {
        if (patient == null) {
            return null;
        }
        
        try {
            return PatientDTO.builder()
                    .idPatient(patient.getIdPatient())
                    .ipp(patient.getIpp())
                    .nom(patient.getNom())
                    .prenom(patient.getPrenom())
                    .dateNaissance(patient.getDateNaissance())
                    .lieuNaissance(patient.getLieuNaissance())
                    .sexe(patient.getSexe())
                    .adresse(patient.getAdresse())
                    .ville(patient.getVille())
                    .telephone(patient.getTelephone())
                    .nationalite(patient.getNationalite())
                    .etatCivil(patient.getEtatCivil())
                    .email(patient.getEmail())
                    .cin(patient.getCin())
                    .contactUrgencePrenom(patient.getContactUrgencePrenom())
                    .contactUrgenceRelation(patient.getContactUrgenceRelation())
                    .contactUrgenceAdresse(patient.getContactUrgenceAdresse())
                    .contactUrgenceTelephone(patient.getContactUrgenceTelephone())
                    .typeAdmission(patient.getTypeAdmission())
                    .dateAdmission(patient.getDateAdmission())
                    .dateCreation(patient.getDateCreation())
                    .build();
        } catch (Exception e) {
            // Provide a minimal patient DTO with just the essential fields in case of errors
            return PatientDTO.builder()
                    .idPatient(patient.getIdPatient())
                    .ipp(patient.getIpp())
                    .nom(patient.getNom() != null ? patient.getNom() : "")
                    .prenom(patient.getPrenom() != null ? patient.getPrenom() : "")
                    .build();
        }
    }

    public static Patient toPatient(PatientDTO patientDTO) {
        if (patientDTO == null) {
            return null;
        }
        
        Patient patient = new Patient();
        patient.setIdPatient(patientDTO.getIdPatient());
        patient.setIpp(patientDTO.getIpp());
        patient.setNom(patientDTO.getNom());
        patient.setPrenom(patientDTO.getPrenom());
        patient.setDateNaissance(patientDTO.getDateNaissance());
        patient.setLieuNaissance(patientDTO.getLieuNaissance());
        patient.setSexe(patientDTO.getSexe());
        patient.setAdresse(patientDTO.getAdresse());
        patient.setVille(patientDTO.getVille());
        patient.setTelephone(patientDTO.getTelephone());
        patient.setNationalite(patientDTO.getNationalite());
        patient.setEtatCivil(patientDTO.getEtatCivil());
        patient.setEmail(patientDTO.getEmail());
        patient.setCin(patientDTO.getCin());
        patient.setContactUrgencePrenom(patientDTO.getContactUrgencePrenom());
        patient.setContactUrgenceRelation(patientDTO.getContactUrgenceRelation());
        patient.setContactUrgenceAdresse(patientDTO.getContactUrgenceAdresse());
        patient.setContactUrgenceTelephone(patientDTO.getContactUrgenceTelephone());
        patient.setTypeAdmission(patientDTO.getTypeAdmission());
        patient.setDateAdmission(patientDTO.getDateAdmission());
        patient.setDateCreation(patientDTO.getDateCreation());
        
        return patient;
    }

    public static List<PatientDTO> toPatientDTOList(List<Patient> patients) {
        return patients.stream()
                .map(PatientMapper::toPatientDTO)
                .collect(Collectors.toList());
    }

    public static PatientDTO toPatientDTO(CreatePatientRequest request) {
        if (request == null) {
            return null;
        }
        
        return PatientDTO.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .dateNaissance(request.getDateNaissance())
                .lieuNaissance(request.getLieuNaissance())
                .sexe(request.getSexe())
                .adresse(request.getAdresse())
                .ville(request.getVille())
                .telephone(request.getTelephone())
                .nationalite(request.getNationalite())
                .etatCivil(request.getEtatCivil())
                .email(request.getEmail())
                .cin(request.getCin())
                .contactUrgencePrenom(request.getContactUrgencePrenom())
                .contactUrgenceRelation(request.getContactUrgenceRelation())
                .contactUrgenceAdresse(request.getContactUrgenceAdresse())
                .contactUrgenceTelephone(request.getContactUrgenceTelephone())
                .typeAdmission(request.getTypeAdmission())
                .dateAdmission(request.getDateAdmission())
                .dateCreation(LocalDateTime.now())
                .build();
    }

    public static Patient fromCreateRequest(CreatePatientRequest request) {
        if (request == null) {
            return null;
        }
        
        Patient patient = new Patient();
        // ID is auto-generated, IPP will be set by the service
        patient.setNom(request.getNom());
        patient.setPrenom(request.getPrenom());
        patient.setDateNaissance(request.getDateNaissance());
        patient.setLieuNaissance(request.getLieuNaissance());
        patient.setSexe(request.getSexe());
        patient.setAdresse(request.getAdresse());
        patient.setVille(request.getVille());
        patient.setTelephone(request.getTelephone());
        patient.setNationalite(request.getNationalite());
        patient.setEtatCivil(request.getEtatCivil());
        patient.setEmail(request.getEmail());
        patient.setCin(request.getCin());
        patient.setContactUrgencePrenom(request.getContactUrgencePrenom());
        patient.setContactUrgenceRelation(request.getContactUrgenceRelation());
        patient.setContactUrgenceAdresse(request.getContactUrgenceAdresse());
        patient.setContactUrgenceTelephone(request.getContactUrgenceTelephone());
        patient.setTypeAdmission(request.getTypeAdmission());
        patient.setDateAdmission(request.getDateAdmission());
        patient.setDateCreation(LocalDateTime.now());
        
        return patient;
    }
    
    public static PatientResponse toSuccessResponse(Patient patient, String message) {
        return PatientResponse.builder()
                .success(true)
                .message(message)
                .patient(toPatientDTO(patient))
                .build();
    }
    
    public static PatientResponse toErrorResponse(String message) {
        return PatientResponse.builder()
                .success(false)
                .message(message)
                .build();
    }
    
    public static PatientSearchResponse toSearchResponse(List<PatientDTO> patients, String message) {
        return PatientSearchResponse.builder()
                .success(true)
                .message(message)
                .patients(patients)
                .count(patients.size())
                .build();
    }
    
    public static PatientSearchResponse toEmptySearchResponse(String message) {
        return PatientSearchResponse.builder()
                .success(true)
                .message(message)
                .patients(List.of())
                .count(0)
                .build();
    }
    
    public static Patient updatePatientFromRequest(Patient existingPatient, UpdatePatientRequest request) {
        if (request == null || existingPatient == null) {
            return existingPatient;
        }
        
        // Create a copy to avoid modifying the managed entity directly
        Patient updatedPatient = new Patient();
        
        // Copy all fields from existing patient first
        org.springframework.beans.BeanUtils.copyProperties(existingPatient, updatedPatient);
        
        // Then update non-sensitive fields from request (only if they're non-null)
        if (request.getNom() != null) updatedPatient.setNom(request.getNom());
        if (request.getPrenom() != null) updatedPatient.setPrenom(request.getPrenom());
        if (request.getDateNaissance() != null) updatedPatient.setDateNaissance(request.getDateNaissance());
        if (request.getLieuNaissance() != null) updatedPatient.setLieuNaissance(request.getLieuNaissance());
        if (request.getSexe() != null) updatedPatient.setSexe(request.getSexe());
        if (request.getAdresse() != null) updatedPatient.setAdresse(request.getAdresse());
        if (request.getVille() != null) updatedPatient.setVille(request.getVille());
        if (request.getTelephone() != null) updatedPatient.setTelephone(request.getTelephone());
        if (request.getNationalite() != null) updatedPatient.setNationalite(request.getNationalite());
        if (request.getEtatCivil() != null) updatedPatient.setEtatCivil(request.getEtatCivil());
        if (request.getContactUrgencePrenom() != null) updatedPatient.setContactUrgencePrenom(request.getContactUrgencePrenom());
        if (request.getContactUrgenceRelation() != null) updatedPatient.setContactUrgenceRelation(request.getContactUrgenceRelation());
        if (request.getContactUrgenceAdresse() != null) updatedPatient.setContactUrgenceAdresse(request.getContactUrgenceAdresse());
        if (request.getContactUrgenceTelephone() != null) updatedPatient.setContactUrgenceTelephone(request.getContactUrgenceTelephone());
        if (request.getTypeAdmission() != null) updatedPatient.setTypeAdmission(request.getTypeAdmission());
        if (request.getDateAdmission() != null) updatedPatient.setDateAdmission(request.getDateAdmission());
        
        // Email and CIN are handled separately in the service with validation
        
        return updatedPatient;
    }
}