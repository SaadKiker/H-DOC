package com.hdoc.sgdm.service;

import com.hdoc.sgdm.entity.RendezVous;
import com.hdoc.sgdm.repository.RendezVousRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RendezVousStatusScheduler {

    private final RendezVousRepository rendezVousRepository;

    /**
     * Scheduled task that runs every 5 minutes to identify appointments that are late but still scheduled for today.
     * - Identifies appointments with status "PLANIFIE" where the scheduled time has passed but is still on the current day
     * - Updates their status to "LATE"
     * - Logs this status change for auditing purposes
     */
    @Scheduled(fixedRate = 300000) // 300,000 ms = 5 minutes
    @Transactional
    public void updateLateAppointments() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        
        // Start of day
        LocalDateTime startOfDay = today.atStartOfDay();
        
        // End of day
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay().minusSeconds(1);
        
        log.info("Running late appointments check at: {}", now);
        
        // Find appointments that:
        // 1. Are scheduled for today
        // 2. The scheduled time has passed (they are "late")
        // 3. Are still in "PLANIFIE" status
        List<RendezVous> lateAppointments = rendezVousRepository.findLateAppointments(
            startOfDay, endOfDay, now, RendezVous.StatutRendezVous.PLANIFIE);
        
        if (!lateAppointments.isEmpty()) {
            log.info("Found {} late appointments to update", lateAppointments.size());
            
            // Update each appointment status to LATE
            for (RendezVous appointment : lateAppointments) {
                appointment.setStatus(RendezVous.StatutRendezVous.LATE);
                log.info("Updating appointment #{} for patient {} from PLANIFIE to LATE (scheduled at: {})", 
                    appointment.getId(), appointment.getIdPatient(), appointment.getDateHeure());
            }
            
            // Bulk save all updated appointments
            rendezVousRepository.saveAll(lateAppointments);
            log.info("Successfully updated {} appointments to LATE status", lateAppointments.size());
        } else {
            log.debug("No late appointments found to update");
        }
    }
} 