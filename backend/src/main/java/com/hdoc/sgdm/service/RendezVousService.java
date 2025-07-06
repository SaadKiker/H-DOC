package com.hdoc.sgdm.service;

import com.hdoc.sgdm.dto.common.MedecinDTO;
import com.hdoc.sgdm.dto.common.PatientDTO;
import com.hdoc.sgdm.dto.request.RendezVousRequest;
import com.hdoc.sgdm.dto.response.RendezVousResponse;
import com.hdoc.sgdm.entity.Medecin;
import com.hdoc.sgdm.entity.Patient;
import com.hdoc.sgdm.entity.RendezVous;
import com.hdoc.sgdm.exception.ConflictException;
import com.hdoc.sgdm.exception.ResourceNotFoundException;
import com.hdoc.sgdm.mapper.MedecinMapper;
import com.hdoc.sgdm.mapper.PatientMapper;
import com.hdoc.sgdm.repository.MedecinRepository;
import com.hdoc.sgdm.repository.PatientRepository;
import com.hdoc.sgdm.repository.RendezVousRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RendezVousService {

    private final RendezVousRepository rendezVousRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final MedecinMapper medecinMapper;



    @Transactional(readOnly = true)
    public List<RendezVousResponse> getAppointmentsForCalendar(LocalDateTime startDate, LocalDateTime endDate, UUID idMedecin, boolean includeAllStatuses) {
        List<RendezVous> appointments;
        
        if (includeAllStatuses) {
            // Get all appointments regardless of status
            if (idMedecin != null) {
                // Filter by doctor if specified
                appointments = rendezVousRepository.findByIdMedecinAndDateHeureBetweenOrderByDateHeure(
                        idMedecin, startDate, endDate);
            } else {
                // Get all appointments in the date range
                appointments = rendezVousRepository.findByDateHeureBetweenOrderByDateHeure(
                        startDate, endDate);
            }
        } else {
            // Only get appointments with PLANIFIE status (original behavior)
            if (idMedecin != null) {
                // Filter by doctor if specified
                appointments = rendezVousRepository.findByIdMedecinAndDateHeureBetweenAndStatusOrderByDateHeure(
                        idMedecin, startDate, endDate, RendezVous.StatutRendezVous.PLANIFIE);
            } else {
                // Get all appointments in the date range
                appointments = rendezVousRepository.findByDateHeureBetweenAndStatusOrderByDateHeure(
                        startDate, endDate, RendezVous.StatutRendezVous.PLANIFIE);
            }
        }
        
        if (appointments.isEmpty()) {
            return Collections.emptyList();
        }
        
        // Extract all patient and doctor IDs
        Set<UUID> patientIds = appointments.stream()
                .map(RendezVous::getIdPatient)
                .collect(Collectors.toSet());
        
        Set<UUID> doctorIds = appointments.stream()
                .map(RendezVous::getIdMedecin)
                .collect(Collectors.toSet());
        
        // Batch fetch all patients and doctors
        Map<UUID, Patient> patientMap = patientRepository.findAllById(patientIds).stream()
                .collect(Collectors.toMap(Patient::getIdPatient, p -> p));
        
        Map<UUID, Medecin> doctorMap = medecinRepository.findAllById(doctorIds).stream()
                .collect(Collectors.toMap(Medecin::getIdMedecin, m -> m));
        
        // Map appointments to responses with complete objects
        return appointments.stream()
                .map(appointment -> mapToResponseWithObjects(appointment, patientMap, doctorMap))
                .collect(Collectors.toList());
    }

    @Transactional
    public RendezVousResponse createAppointment(RendezVousRequest request) {
        // Check if doctor exists
        Medecin medecin = medecinRepository.findById(request.getIdMedecin())
                .orElseThrow(() -> new ResourceNotFoundException("Médecin non trouvé"));
        
        // Check if patient exists
        Patient patient = patientRepository.findById(request.getIdPatient())
                .orElseThrow(() -> new ResourceNotFoundException("Patient non trouvé"));
        
        // Calculate end time to check for overlaps
        LocalDateTime endDateTime = request.getDateHeure().plusMinutes(request.getDurationMinutes());
        
        // Check for overlapping appointments
        if (rendezVousRepository.hasOverlappingAppointment(
                request.getIdMedecin(), request.getDateHeure(), endDateTime)) {
            throw new ConflictException("Le médecin a déjà un rendez-vous programmé à cette heure");
        }
        
        // Create new appointment
        RendezVous rendezVous = new RendezVous();
        rendezVous.setIdPatient(request.getIdPatient());
        rendezVous.setIdMedecin(request.getIdMedecin());
        rendezVous.setDateHeure(request.getDateHeure());
        rendezVous.setDurationMinutes(request.getDurationMinutes());
        rendezVous.setNote(request.getNote());
        rendezVous.setService(request.getService());
        rendezVous.setTypeVisit(request.getTypeVisit());
        rendezVous.setStatus(RendezVous.StatutRendezVous.PLANIFIE);
        
        rendezVous = rendezVousRepository.save(rendezVous);
        
        // Create response with full objects
        Map<UUID, Patient> patientMap = Collections.singletonMap(patient.getIdPatient(), patient);
        Map<UUID, Medecin> doctorMap = Collections.singletonMap(medecin.getIdMedecin(), medecin);
        
        return mapToResponseWithObjects(rendezVous, patientMap, doctorMap);
    }

    @Transactional
    public RendezVousResponse updateAppointment(Long id, RendezVousRequest request) {
        RendezVous rendezVous = rendezVousRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rendez-vous non trouvé"));
        
        // Check if doctor and patient exist
        Medecin medecin = medecinRepository.findById(request.getIdMedecin())
                .orElseThrow(() -> new ResourceNotFoundException("Médecin non trouvé"));
        
        Patient patient = patientRepository.findById(request.getIdPatient())
                .orElseThrow(() -> new ResourceNotFoundException("Patient non trouvé"));
        
        // Calculate end time for new appointment
        LocalDateTime endDateTime = request.getDateHeure().plusMinutes(request.getDurationMinutes());
        
        // Check for overlapping appointments (only if doctor or time changed)
        if ((rendezVous.getIdMedecin() != request.getIdMedecin() || 
             !rendezVous.getDateHeure().equals(request.getDateHeure()) ||
             !rendezVous.getDurationMinutes().equals(request.getDurationMinutes())) &&
            rendezVousRepository.hasOverlappingAppointment(
                request.getIdMedecin(), request.getDateHeure(), endDateTime)) {
            throw new ConflictException("Le médecin a déjà un rendez-vous programmé à cette heure");
        }
        
        rendezVous.setIdPatient(request.getIdPatient());
        rendezVous.setIdMedecin(request.getIdMedecin());
        rendezVous.setDateHeure(request.getDateHeure());
        rendezVous.setDurationMinutes(request.getDurationMinutes());
        rendezVous.setNote(request.getNote());
        rendezVous.setService(request.getService());
        rendezVous.setTypeVisit(request.getTypeVisit());
        
        rendezVous = rendezVousRepository.save(rendezVous);
        
        // Create response with full objects
        Map<UUID, Patient> patientMap = Collections.singletonMap(patient.getIdPatient(), patient);
        Map<UUID, Medecin> doctorMap = Collections.singletonMap(medecin.getIdMedecin(), medecin);
        
        return mapToResponseWithObjects(rendezVous, patientMap, doctorMap);
    }

    @Transactional
    public void cancelAppointment(Long id) {
        RendezVous rendezVous = rendezVousRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rendez-vous non trouvé"));
        
        rendezVous.setStatus(RendezVous.StatutRendezVous.ANNULE);
        rendezVousRepository.save(rendezVous);
    }

    /**
     * Permanently deletes an appointment from the database.
     * This method completely removes the record from the database.
     * 
     * @param id The appointment ID to delete
     * @throws ResourceNotFoundException if the appointment doesn't exist
     * @throws ConflictException if the appointment cannot be deleted due to relationships
     */
    @Transactional
    public void permanentlyDeleteAppointment(Long id) {
        // Check if the appointment exists
        RendezVous rendezVous = rendezVousRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rendez-vous non trouvé avec ID: " + id));
        
        try {
            // Perform permanent deletion
            rendezVousRepository.deleteById(id);
        } catch (Exception e) {
            // Handle database constraint violation and other potential errors
            // Check if there's a reference to this appointment from a Visite or other entity
            if (e.getMessage() != null && 
                (e.getMessage().contains("constraint") || 
                 e.getMessage().contains("foreign key") ||
                 e.getMessage().contains("reference"))) {
                throw new ConflictException("Impossible de supprimer le rendez-vous car il est référencé par une visite ou un autre enregistrement. Utilisez la suppression standard pour le marquer comme annulé.");
            }
            // Re-throw other unexpected exceptions
            throw e;
        }
    }

    /**
     * Checks if an appointment can be permanently deleted.
     * An appointment can be deleted only if it doesn't have any associated visits
     * or other references in the database.
     * 
     * @param id The appointment ID to check
     * @return true if the appointment can be permanently deleted, false otherwise
     * @throws ResourceNotFoundException if the appointment doesn't exist
     */
    @Transactional(readOnly = true)
    public boolean canPermanentlyDeleteAppointment(Long id) {
        // Check if the appointment exists
        RendezVous rendezVous = rendezVousRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rendez-vous non trouvé avec ID: " + id));
                
        // Check if there are any visits associated with this appointment
        // This query would depend on your data model, adjust as needed
        return !rendezVousRepository.hasReferencesToAppointment(id);
    }

    @Transactional(readOnly = true)
    public List<UUID> getAvailableDoctorsForTimeSlot(LocalDateTime startDateTime, LocalDateTime endDateTime) {
        // Get all doctors
        List<Medecin> allDoctors = medecinRepository.findByStatus("AVAILABLE");
        
        // Filter out doctors with overlapping appointments
        return allDoctors.stream()
                .filter(medecin -> !rendezVousRepository.hasOverlappingAppointment(
                        medecin.getIdMedecin(), startDateTime, endDateTime))
                .map(Medecin::getIdMedecin)
                .collect(Collectors.toList());
    }
    
    /**
     * Get all upcoming appointments scheduled for today that haven't started yet.
     * This method returns appointments that:
     * 1. Are scheduled for the current day (dateHeure is today)
     * 2. Have not started yet (dateHeure is after the current time) OR are LATE (status is LATE)
     * 3. Have status 'PLANIFIE' or 'LATE'
     * 
     * @param idMedecin Optional doctor ID to filter appointments for a specific doctor
     * @return List of upcoming appointments for today
     */
    @Transactional(readOnly = true)
    public List<RendezVousResponse> getUpcomingAppointmentsForToday(UUID idMedecin) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime today = now.toLocalDate().atStartOfDay();
        LocalDateTime tomorrow = today.plusDays(1);
        
        // Debug log
        System.out.println("DEBUG - Looking for appointments with:");
        System.out.println("DEBUG - Current time: " + now);
        System.out.println("DEBUG - Today date: " + today);
        System.out.println("DEBUG - Tomorrow date: " + tomorrow);
        if (idMedecin != null) {
            System.out.println("DEBUG - Filtering by doctor ID: " + idMedecin);
        }
        
        List<RendezVous> upcomingAppointments;
        List<RendezVous> lateAppointments;
        
        // Get appointments based on whether doctor ID is provided
        if (idMedecin != null) {
            // For planned appointments (future time)
            upcomingAppointments = rendezVousRepository.findUpcomingAppointmentsForTodayByDoctor(
                    today, tomorrow, now, idMedecin);
            System.out.println("DEBUG - After query - Upcoming appointments for doctor count: " + upcomingAppointments.size());
            
            // For late appointments (past time but still on today's date)
            lateAppointments = rendezVousRepository.findLateAppointmentsByDoctor(
                    today, tomorrow, now, RendezVous.StatutRendezVous.LATE, idMedecin);
            System.out.println("DEBUG - After query - Late appointments for doctor count: " + lateAppointments.size());
        } else {
            // For all doctors - planned appointments (future time)
            upcomingAppointments = rendezVousRepository.findUpcomingAppointmentsForToday(today, tomorrow, now);
            System.out.println("DEBUG - After query - Upcoming appointments count: " + upcomingAppointments.size());
            
            // For all doctors - late appointments (past time but still on today's date)
            lateAppointments = rendezVousRepository.findByDateHeureBetweenAndStatusOrderByDateHeure(
                    today, tomorrow, RendezVous.StatutRendezVous.LATE);
            System.out.println("DEBUG - After query - Late appointments count: " + lateAppointments.size());
        }
        
        // Combine both lists
        List<RendezVous> allUpcomingAppointments = new ArrayList<>();
        allUpcomingAppointments.addAll(upcomingAppointments);
        allUpcomingAppointments.addAll(lateAppointments);     // Late appointments next
        
        if (allUpcomingAppointments.isEmpty()) {
            // If query returns empty, log individual conditions separately for debugging
            System.out.println("DEBUG - No upcoming appointments found for today");
            if (idMedecin != null) {
                System.out.println("DEBUG - (Filtered by doctor ID: " + idMedecin + ")");
            }
            return Collections.emptyList();
        }
        
        // Extract all patient and doctor IDs
        Set<UUID> patientIds = allUpcomingAppointments.stream()
                .map(RendezVous::getIdPatient)
                .collect(Collectors.toSet());
        
        Set<UUID> doctorIds = allUpcomingAppointments.stream()
                .map(RendezVous::getIdMedecin)
                .collect(Collectors.toSet());
        
        // Batch fetch all patients and doctors
        Map<UUID, Patient> patientMap = patientRepository.findAllById(patientIds).stream()
                .collect(Collectors.toMap(Patient::getIdPatient, p -> p));
        
        Map<UUID, Medecin> doctorMap = medecinRepository.findAllById(doctorIds).stream()
                .collect(Collectors.toMap(Medecin::getIdMedecin, m -> m));
        
        // Map appointments to responses with complete objects
        return allUpcomingAppointments.stream()
                .map(appointment -> mapToResponseWithObjects(appointment, patientMap, doctorMap))
                .collect(Collectors.toList());
    }
    
    /**
     * Get all upcoming appointments scheduled for today that haven't started yet.
     * This is a convenience method that calls getUpcomingAppointmentsForToday(UUID idMedecin)
     * with a null doctor ID to get appointments for all doctors.
     * 
     * @return List of upcoming appointments for today for all doctors
     */
    @Transactional(readOnly = true)
    public List<RendezVousResponse> getUpcomingAppointmentsForToday() {
        return getUpcomingAppointmentsForToday(null);
    }
    
    /**
     * Get a single appointment by ID
     * @param id The appointment ID
     * @return The appointment response
     */
    @Transactional(readOnly = true)
    public RendezVousResponse getAppointmentById(Long id) {
        RendezVous rendezVous = rendezVousRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rendez-vous non trouvé avec ID: " + id));
        
        // Get patient and doctor information
        Optional<Patient> patient = patientRepository.findById(rendezVous.getIdPatient());
        Optional<Medecin> medecin = medecinRepository.findById(rendezVous.getIdMedecin());
        
        Map<UUID, Patient> patientMap = patient.isPresent() ? 
                Collections.singletonMap(patient.get().getIdPatient(), patient.get()) : Collections.emptyMap();
                
        Map<UUID, Medecin> doctorMap = medecin.isPresent() ?
                Collections.singletonMap(medecin.get().getIdMedecin(), medecin.get()) : Collections.emptyMap();
        
        return mapToResponseWithObjects(rendezVous, patientMap, doctorMap);
    }
    
    private RendezVousResponse mapToResponseWithObjects(
            RendezVous rendezVous,
            Map<UUID, Patient> patientMap,
            Map<UUID, Medecin> doctorMap) {
        
        RendezVousResponse response = new RendezVousResponse();
        response.setId(rendezVous.getId());
        response.setIdPatient(rendezVous.getIdPatient());
        response.setIdMedecin(rendezVous.getIdMedecin());
        response.setDateHeure(rendezVous.getDateHeure());
        response.setDurationMinutes(rendezVous.getDurationMinutes());
        response.setNote(rendezVous.getNote());
        response.setStatus(rendezVous.getStatus());
        response.setService(rendezVous.getService());
        response.setTypeVisit(rendezVous.getTypeVisit());
        
        // Add basic patient fields for backward compatibility
        Patient patient = patientMap.get(rendezVous.getIdPatient());
        if (patient != null) {
            response.setNomPatient(patient.getNom());
            response.setPrenomPatient(patient.getPrenom());
            
            // Add complete patient object
            PatientDTO patientDTO = PatientMapper.toPatientDTO(patient);
            response.setPatient(patientDTO);
        }
        
        // Add basic doctor fields for backward compatibility
        Medecin medecin = doctorMap.get(rendezVous.getIdMedecin());
        if (medecin != null) {
            if (medecin.getUtilisateur() != null) {
                response.setNomMedecin(medecin.getUtilisateur().getNom() + " " + medecin.getUtilisateur().getPrenom());
            }
            
            // Add speciality if available
            if (medecin.getIdSpecialite() != null) {
                response.setSpecialiteMedecin("Specialité #" + medecin.getIdSpecialite());
            }
            
            // Add complete doctor object
            MedecinDTO medecinDTO = medecinMapper.toDTO(medecin);
            response.setMedecin(medecinDTO);
        }
        
        return response;
    }
} 