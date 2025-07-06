package com.hdoc.sgdm.controller;

import com.hdoc.sgdm.dto.request.RendezVousRequest;
import com.hdoc.sgdm.dto.response.RendezVousListResponse;
import com.hdoc.sgdm.dto.response.RendezVousResponse;
import com.hdoc.sgdm.entity.RendezVous;
import com.hdoc.sgdm.repository.RendezVousRepository;
import com.hdoc.sgdm.service.RendezVousService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RendezVousController {

    private final RendezVousService rendezVousService;
    private final RendezVousRepository rendezVousRepository;

    /**
     * Get appointments for the calendar view within a specified date range.
     * By default, this only returns appointments with status 'PLANIFIE' (scheduled).
     * Use the includeAllStatuses parameter to retrieve all appointments regardless of status.
     * 
     * @param startDate The start of the date range
     * @param endDate The end of the date range
     * @param doctorId Optional doctor ID to filter appointments by a specific doctor
     * @param includeAllStatuses When true, returns all appointments regardless of status; when false (default), returns only PLANIFIE appointments
     * @return List of appointment responses for the calendar
     */
    @GetMapping("/appointments")
    public ResponseEntity<List<RendezVousResponse>> getAppointments(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) UUID doctorId,
            @RequestParam(required = false, defaultValue = "false") boolean includeAllStatuses) {
        
        return ResponseEntity.ok(rendezVousService.getAppointmentsForCalendar(startDate, endDate, doctorId, includeAllStatuses));
    }
    
    /**
     * Get all upcoming appointments for the current day that haven't started yet.
     * This endpoint returns appointments that:
     * 1. Are scheduled for the current day (dateHeure is today)
     * 2. Have not started yet (dateHeure is after the current time)
     * 3. Have status 'PLANIFIE' (scheduled)
     * 
     * This endpoint is needed for the "Upcoming Visits" table on the Agent Dashboard.
     * 
     * @param idMedecin Optional doctor ID to filter appointments for a specific doctor
     * @return RendezVousListResponse containing today's scheduled upcoming appointments with count information
     */
    @GetMapping("/visites/upcoming/today")
    public ResponseEntity<RendezVousListResponse> getTodayUpcomingAppointments(
            @RequestParam(required = false) UUID idMedecin) {
        
        List<RendezVousResponse> upcomingAppointments = rendezVousService.getUpcomingAppointmentsForToday(idMedecin);
        int count = upcomingAppointments.size();
        
        String message = "Liste des rendez-vous programmés pour aujourd'hui récupérée avec succès";
        if (idMedecin != null) {
            message += " (filtré par médecin)";
        }
        
        RendezVousListResponse response = RendezVousListResponse.builder()
                .status("success")
                .message(message)
                .appointments(upcomingAppointments)
                .count(count)
                .build();
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/appointments")
    public ResponseEntity<RendezVousResponse> createAppointment(@Valid @RequestBody RendezVousRequest request) {
        return new ResponseEntity<>(rendezVousService.createAppointment(request), HttpStatus.CREATED);
    }

    @PutMapping("/appointments/{id}")
    public ResponseEntity<RendezVousResponse> updateAppointment(
            @PathVariable Long id,
            @Valid @RequestBody RendezVousRequest request) {
        
        return ResponseEntity.ok(rendezVousService.updateAppointment(id, request));
    }

    @DeleteMapping("/appointments/{id}")
    public ResponseEntity<Void> cancelAppointment(@PathVariable Long id) {
        rendezVousService.cancelAppointment(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Permanently deletes an appointment from the database.
     * Unlike the regular delete which only changes status to ANNULE,
     * this operation completely removes the record from the database.
     * 
     * @param id The ID of the appointment to delete
     * @return 200 OK status on successful deletion
     */
    @DeleteMapping("/appointments/permanent-delete/{id}")
    public ResponseEntity<Void> permanentlyDeleteAppointment(@PathVariable Long id) {
        rendezVousService.permanentlyDeleteAppointment(id);
        return ResponseEntity.ok().build();
    }

    /**
     * Checks if an appointment can be permanently deleted.
     * This is useful for the frontend to determine whether to show the permanent delete option.
     * 
     * @param id The appointment ID to check
     * @return true if the appointment can be permanently deleted, false if it has dependencies
     */
    @GetMapping("/appointments/{id}/can-delete-permanently")
    public ResponseEntity<Boolean> canPermanentlyDeleteAppointment(@PathVariable Long id) {
        boolean canDelete = rendezVousService.canPermanentlyDeleteAppointment(id);
        return ResponseEntity.ok(canDelete);
    }

    @GetMapping("/appointments/doctors/available")
    public ResponseEntity<List<UUID>> getAvailableDoctors(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDateTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDateTime) {
        
        return ResponseEntity.ok(rendezVousService.getAvailableDoctorsForTimeSlot(startDateTime, endDateTime));
    }

    // Temporary debug endpoint to get ALL appointments
    @GetMapping("/debug/appointments/all")
    public ResponseEntity<List<RendezVous>> getAllAppointmentsForDebug() {
        return ResponseEntity.ok(rendezVousRepository.findAll());
    }
} 