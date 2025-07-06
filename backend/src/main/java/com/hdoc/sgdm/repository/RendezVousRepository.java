package com.hdoc.sgdm.repository;

import com.hdoc.sgdm.entity.RendezVous;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface RendezVousRepository extends JpaRepository<RendezVous, Long> {
    
    // Find appointments within a date range
    List<RendezVous> findByDateHeureBetweenAndStatusOrderByDateHeure(
            LocalDateTime startDate, LocalDateTime endDate, RendezVous.StatutRendezVous status);
    
    // Find appointments for a specific doctor within a date range
    List<RendezVous> findByIdMedecinAndDateHeureBetweenAndStatusOrderByDateHeure(
            UUID idMedecin, LocalDateTime startDate, LocalDateTime endDate, RendezVous.StatutRendezVous status);
    
    // Find appointments within a date range regardless of status
    List<RendezVous> findByDateHeureBetweenOrderByDateHeure(
            LocalDateTime startDate, LocalDateTime endDate);
    
    // Find appointments for a specific doctor within a date range regardless of status
    List<RendezVous> findByIdMedecinAndDateHeureBetweenOrderByDateHeure(
            UUID idMedecin, LocalDateTime startDate, LocalDateTime endDate);
    
    // Find appointments for a specific patient
    List<RendezVous> findByIdPatientOrderByDateHeure(UUID idPatient);
    
    // Check for overlapping appointments for a doctor
    @Query(value = "SELECT COUNT(*) > 0 FROM rendez_vous rv WHERE rv.id_medecin = :idMedecin " +
           "AND rv.status = 'PLANIFIE' " +
           "AND rv.date_heure < :endDateTime " +
           "AND (rv.date_heure + INTERVAL '1 minute' * rv.duration_minutes) > :startDateTime", 
           nativeQuery = true)
    boolean hasOverlappingAppointment(
            @Param("idMedecin") UUID idMedecin, 
            @Param("startDateTime") LocalDateTime startDateTime, 
            @Param("endDateTime") LocalDateTime endDateTime);
            
    // Find upcoming appointments for today (only PLANIFIE status)
    @Query("SELECT rv FROM RendezVous rv WHERE rv.status = com.hdoc.sgdm.entity.RendezVous$StatutRendezVous.PLANIFIE AND " +
           "rv.dateHeure >= :today AND rv.dateHeure < :tomorrow AND " +
           "rv.dateHeure > :currentTime ORDER BY rv.dateHeure ASC")
    List<RendezVous> findUpcomingAppointmentsForToday(
            @Param("today") LocalDateTime today,
            @Param("tomorrow") LocalDateTime tomorrow,
            @Param("currentTime") LocalDateTime currentTime);
            
    // Find upcoming appointments for today for a specific doctor (only PLANIFIE status)
    @Query("SELECT rv FROM RendezVous rv WHERE rv.status = com.hdoc.sgdm.entity.RendezVous$StatutRendezVous.PLANIFIE AND " +
           "rv.dateHeure >= :today AND rv.dateHeure < :tomorrow AND " +
           "rv.dateHeure > :currentTime AND " +
           "rv.idMedecin = :idMedecin ORDER BY rv.dateHeure ASC")
    List<RendezVous> findUpcomingAppointmentsForTodayByDoctor(
            @Param("today") LocalDateTime today,
            @Param("tomorrow") LocalDateTime tomorrow,
            @Param("currentTime") LocalDateTime currentTime,
            @Param("idMedecin") UUID idMedecin);
            
    // Find late appointments for today (scheduled time has passed but status is still PLANIFIE)
    @Query("SELECT rv FROM RendezVous rv WHERE rv.status = :status AND " +
           "rv.dateHeure >= :startOfDay AND rv.dateHeure <= :endOfDay AND " +
           "rv.dateHeure < :currentTime ORDER BY rv.dateHeure ASC")
    List<RendezVous> findLateAppointments(
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay,
            @Param("currentTime") LocalDateTime currentTime,
            @Param("status") RendezVous.StatutRendezVous status);
            
    // Find late appointments for today by doctor (scheduled time has passed but status is still PLANIFIE)
    @Query("SELECT rv FROM RendezVous rv WHERE rv.status = :status AND " +
           "rv.dateHeure >= :startOfDay AND rv.dateHeure <= :endOfDay AND " +
           "rv.dateHeure < :currentTime AND " +
           "rv.idMedecin = :idMedecin ORDER BY rv.dateHeure ASC")
    List<RendezVous> findLateAppointmentsByDoctor(
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay,
            @Param("currentTime") LocalDateTime currentTime,
            @Param("status") RendezVous.StatutRendezVous status,
            @Param("idMedecin") UUID idMedecin);
            
    /**
     * Check if an appointment has any references from other tables (like Visite)
     * This query uses a native SQL query to check for references in the visite table
     * Modify as needed based on your actual database schema and relationships
     * 
     * @param idRendezVous The appointment ID to check
     * @return true if there are references to this appointment, false otherwise
     */
    @Query(value = "SELECT EXISTS(SELECT 1 FROM visite WHERE id_rdv = :idRendezVous LIMIT 1)", nativeQuery = true)
    boolean hasReferencesToAppointment(@Param("idRendezVous") Long idRendezVous);
} 