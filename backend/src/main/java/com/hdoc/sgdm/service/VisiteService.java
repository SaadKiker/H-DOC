package com.hdoc.sgdm.service;

import com.hdoc.sgdm.dto.common.VisiteDTO;
import com.hdoc.sgdm.dto.request.EditVisiteRequest;
import com.hdoc.sgdm.dto.request.StartVisiteRequest;
import com.hdoc.sgdm.dto.request.UpdateNoteRequest;
import com.hdoc.sgdm.entity.Medecin;
import com.hdoc.sgdm.entity.Patient;
import com.hdoc.sgdm.entity.RendezVous;
import com.hdoc.sgdm.entity.Visite;
import com.hdoc.sgdm.exception.ResourceNotFoundException;
import com.hdoc.sgdm.mapper.VisiteMapper;
import com.hdoc.sgdm.repository.MedecinRepository;
import com.hdoc.sgdm.repository.PatientRepository;
import com.hdoc.sgdm.repository.RendezVousRepository;
import com.hdoc.sgdm.repository.VisiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VisiteService {
    
    private final VisiteRepository visiteRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final RendezVousRepository rendezVousRepository;
    private final VisiteMapper visiteMapper;
    
    @Transactional
    public VisiteDTO startVisite(String ipp, StartVisiteRequest request) {
        Patient patient = patientRepository.findByIpp(ipp)
                .orElseThrow(() -> new ResourceNotFoundException("Patient non trouvé avec IPP: " + ipp));
        
        // Check if patient already has an active visit
        List<Visite> activeVisites = visiteRepository.findByPatientAndStatutOrderByDateDebutDesc(patient, "IN_PROGRESS");
        if (!activeVisites.isEmpty()) {
            throw new IllegalStateException("Le patient a déjà une visite active en cours. Impossible d'en démarrer une nouvelle.");
        }
        
        Visite visite = Visite.builder()
                .patient(patient)
                .typeVisite(request.getTypeVisite())
                .dateDebut(LocalDateTime.now())
                .statut("IN_PROGRESS")
                .motif(request.getMotif())
                .service(request.getService())
                .idRdv(request.getIdRdv())
                .note(request.getNote())
                .build();
                
        // Set doctor ID if provided and update doctor status
        if (request.getIdMedecin() != null && !request.getIdMedecin().isEmpty()) {
            UUID doctorId = UUID.fromString(request.getIdMedecin());
            visite.setIdMedecin(doctorId);
            
            // Update doctor status to UNAVAILABLE
            updateDoctorStatus(doctorId, "UNAVAILABLE");
        }
        
        // If created from appointment, update appointment status
        if (request.getIdRdv() != null) {
            RendezVous rendezVous = rendezVousRepository.findById(request.getIdRdv())
                .orElseThrow(() -> new ResourceNotFoundException("Rendez-vous non trouvé avec ID: " + request.getIdRdv()));
            
            // Check if the appointment status allows starting a visit
            if (rendezVous.getStatus() != RendezVous.StatutRendezVous.PLANIFIE && 
                rendezVous.getStatus() != RendezVous.StatutRendezVous.LATE) {
                throw new IllegalStateException("Impossible de démarrer une visite depuis un rendez-vous au statut " + rendezVous.getStatus());
            }
            
            // Set status to COMMENCE (started)
            rendezVous.setStatus(RendezVous.StatutRendezVous.COMMENCE);
            rendezVousRepository.save(rendezVous);
        }
        
        visite = visiteRepository.save(visite);
        return visiteMapper.toDTO(visite);
    }
    
    /**
     * Helper method to update a doctor's status
     */
    private void updateDoctorStatus(UUID doctorId, String status) {
        Optional<Medecin> medecinOpt = medecinRepository.findById(doctorId);
        if (medecinOpt.isPresent()) {
            Medecin medecin = medecinOpt.get();
            medecin.setStatus(status);
            medecinRepository.save(medecin);
        }
    }
    
    public VisiteDTO getVisiteById(Long idVisite) {
        Visite visite = visiteRepository.findById(idVisite)
                .orElseThrow(() -> new ResourceNotFoundException("Visite non trouvée avec ID: " + idVisite));
        
        return visiteMapper.toDTO(visite);
    }
    
    public List<VisiteDTO> getVisitesByPatient(String ipp) {
        Patient patient = patientRepository.findByIpp(ipp)
                .orElseThrow(() -> new ResourceNotFoundException("Patient non trouvé avec IPP: " + ipp));
        
        List<Visite> visites = visiteRepository.findByPatientOrderByDateDebutDesc(patient);
        return visiteMapper.toDTOList(visites);
    }
    
    public List<VisiteDTO> getActiveVisitesByPatient(String ipp) {
        Patient patient = patientRepository.findByIpp(ipp)
                .orElseThrow(() -> new ResourceNotFoundException("Patient non trouvé avec IPP: " + ipp));
        
        List<Visite> visites = visiteRepository.findByPatientAndStatutOrderByDateDebutDesc(patient, "IN_PROGRESS");
        return visiteMapper.toDTOList(visites);
    }
    
    @Transactional
    public VisiteDTO endVisite(Long idVisite) {
        Visite visite = visiteRepository.findById(idVisite)
                .orElseThrow(() -> new ResourceNotFoundException("Visite non trouvée avec ID: " + idVisite));
        
        // Check if visit is already completed
        if ("COMPLETED".equals(visite.getStatut())) {
            throw new IllegalStateException("La visite est déjà terminée");
        }
        
        // Update visit status and end date
        visite.setStatut("COMPLETED");
        visite.setDateFin(LocalDateTime.now());
        
        // Free up the doctor if there was one assigned
        if (visite.getIdMedecin() != null) {
            updateDoctorStatus(visite.getIdMedecin(), "AVAILABLE");
        }
        
        // Save and return updated visit
        visite = visiteRepository.save(visite);
        return visiteMapper.toDTO(visite);
    }
    
    @Transactional
    public VisiteDTO editVisite(Long idVisite, EditVisiteRequest request) {
        Visite visite = visiteRepository.findById(idVisite)
                .orElseThrow(() -> new ResourceNotFoundException("Visite non trouvée avec ID: " + idVisite));
        
        // Only allow editing visits that are in progress
        if ("COMPLETED".equals(visite.getStatut())) {
            throw new IllegalStateException("Impossible de modifier une visite terminée");
        }
        
        // Save previous doctor ID to handle doctor status updates
        UUID previousDoctorId = visite.getIdMedecin();
        
        // Update only non-null fields
        if (request.getTypeVisite() != null && !request.getTypeVisite().isEmpty()) {
            visite.setTypeVisite(request.getTypeVisite());
        }
        
        if (request.getMotif() != null && !request.getMotif().isEmpty()) {
            visite.setMotif(request.getMotif());
        }
        
        if (request.getService() != null) {
            visite.setService(request.getService());
        }
        
        // Add support for updating the note field
        if (request.getNote() != null) {
            visite.setNote(request.getNote());
        }
        
        // Handle doctor assignment/reassignment
        if (request.getIdMedecin() != null && !request.getIdMedecin().isEmpty()) {
            UUID newDoctorId = UUID.fromString(request.getIdMedecin());
            
            // If doctor is being changed
            if (!newDoctorId.equals(previousDoctorId)) {
                // Free up the previous doctor if there was one
                if (previousDoctorId != null) {
                    updateDoctorStatus(previousDoctorId, "AVAILABLE");
                }
                
                // Set new doctor as unavailable
                updateDoctorStatus(newDoctorId, "UNAVAILABLE");
            }
            
            visite.setIdMedecin(newDoctorId);
        }
        
        // Save and return updated visit
        visite = visiteRepository.save(visite);
        return visiteMapper.toDTO(visite);
    }
    
    @Transactional
    public void deleteVisite(Long idVisite) {
        Visite visite = visiteRepository.findById(idVisite)
                .orElseThrow(() -> new ResourceNotFoundException("Visite non trouvée avec ID: " + idVisite));
        
        // Free up the doctor if there was one assigned and the visit is still in progress
        if (visite.getIdMedecin() != null && "IN_PROGRESS".equals(visite.getStatut())) {
            updateDoctorStatus(visite.getIdMedecin(), "AVAILABLE");
        }
        
        // Delete the visit (no status check - all visits can be deleted)
        visiteRepository.delete(visite);
    }
    
    // Get all active visits across all patients
    public List<VisiteDTO> getAllActiveVisites() {
        List<Visite> activeVisites = visiteRepository.findByStatutOrderByDateDebutDesc("IN_PROGRESS");
        return visiteMapper.toDTOList(activeVisites);
    }
    
    /**
     * @deprecated Use getCompletedVisitesForDay(String dateStr) instead
     */
    @Deprecated
    public List<VisiteDTO> getTodayCompletedVisites() {
        return getCompletedVisitesForDay(null);
    }
    
    // Get all completed visits for a specific day (YYYY-MM-DD format)
    public List<VisiteDTO> getCompletedVisitesForDay(String dateStr) {
        LocalDateTime dateTime;
        
        if (dateStr == null || dateStr.isEmpty()) {
            // Use today's date if no date is provided
            dateTime = LocalDateTime.now();
        } else {
            try {
                // Parse the date string (expected format: YYYY-MM-DD)
                LocalDate date = LocalDate.parse(dateStr);
                // Convert to LocalDateTime with time set to midnight
                dateTime = date.atStartOfDay();
            } catch (Exception e) {
                // If date parsing fails, default to today
                dateTime = LocalDateTime.now();
            }
        }
        
        // Find completed visits for the specified date
        List<Visite> completedVisites = visiteRepository.findCompletedVisitsByDate("COMPLETED", dateTime);
        
        return visiteMapper.toDTOList(completedVisites);
    }
    
    // Get all completed visits for a specific doctor on a specific day
    public List<VisiteDTO> getCompletedVisitesForDoctorAndDay(UUID idMedecin, String dateStr) {
        LocalDateTime dateTime;
        
        if (dateStr == null || dateStr.isEmpty()) {
            // Use today's date if no date is provided
            dateTime = LocalDateTime.now();
        } else {
            try {
                // Parse the date string (expected format: YYYY-MM-DD)
                LocalDate date = LocalDate.parse(dateStr);
                // Convert to LocalDateTime with time set to midnight
                dateTime = date.atStartOfDay();
            } catch (Exception e) {
                // If date parsing fails, default to today
                dateTime = LocalDateTime.now();
            }
        }
        
        // First check if the doctor exists
        if (!medecinRepository.existsById(idMedecin)) {
            throw new ResourceNotFoundException("Médecin non trouvé avec ID: " + idMedecin);
        }
        
        // Find completed visits for the specified doctor and date
        List<Visite> completedVisites = visiteRepository.findCompletedVisitsByDateAndDoctor("COMPLETED", dateTime, idMedecin);
        
        return visiteMapper.toDTOList(completedVisites);
    }
    
    // Get all completed visits between two dates
    public List<VisiteDTO> getCompletedVisitesBetweenDates(LocalDateTime startDate, LocalDateTime endDate) {
        List<Visite> completedVisites = visiteRepository.findByStatutAndDateFinBetweenOrderByDateFinDesc(
                "COMPLETED", startDate, endDate);
        
        return visiteMapper.toDTOList(completedVisites);
    }
    
    /**
     * Get all upcoming visits scheduled for today that haven't started yet.
     * This method returns visits that:
     * 1. Are scheduled for the current day (dateDebut is today)
     * 2. Have not started yet (dateDebut is after the current time)
     * 3. Have status 'PLANIFIE' (planned/scheduled)
     * 
     * Similar to getCompletedVisitesForDay, but for upcoming visits instead of completed ones.
     * 
     * @return List of upcoming visits for today (not started yet)
     */
    public List<VisiteDTO> getUpcomingVisitesForToday() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime today = now.toLocalDate().atStartOfDay();
        
        List<Visite> upcomingVisites = visiteRepository.findUpcomingVisitesForToday(today, now);
        return visiteMapper.toDTOList(upcomingVisites);
    }
    
    /**
     * Updates just the note field of a visit
     * 
     * @param idVisite ID of the visit to update
     * @param request Request containing the new note
     * @return Updated visit DTO
     */
    @Transactional
    public VisiteDTO updateVisiteNote(Long idVisite, UpdateNoteRequest request) {
        Visite visite = visiteRepository.findById(idVisite)
                .orElseThrow(() -> new ResourceNotFoundException("Visite non trouvée avec ID: " + idVisite));
        
        // Update the note field
        visite.setNote(request.getNote());
        
        // Save and return updated visit
        visite = visiteRepository.save(visite);
        return visiteMapper.toDTO(visite);
    }
    
    /**
     * Clears the note field of a visit (sets it to null)
     * 
     * @param idVisite ID of the visit to update
     * @return Updated visit DTO
     */
    @Transactional
    public VisiteDTO clearVisiteNote(Long idVisite) {
        Visite visite = visiteRepository.findById(idVisite)
                .orElseThrow(() -> new ResourceNotFoundException("Visite non trouvée avec ID: " + idVisite));
        
        // Clear the note field
        visite.setNote(null);
        
        // Save and return updated visit
        visite = visiteRepository.save(visite);
        return visiteMapper.toDTO(visite);
    }
}