package com.hdoc.sgdm.repository;

import com.hdoc.sgdm.entity.Patient;
import com.hdoc.sgdm.entity.Visite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VisiteRepository extends JpaRepository<Visite, Long> {
    
    List<Visite> findByPatientOrderByDateDebutDesc(Patient patient);
    
    List<Visite> findByPatientAndStatutOrderByDateDebutDesc(Patient patient, String statut);
    
    List<Visite> findByStatutOrderByDateDebutDesc(String statut);
    

    List<Visite> findByStatutAndDateFinBetweenOrderByDateFinDesc(String statut, LocalDateTime startDateTime, LocalDateTime endDateTime);
    

    @Query("SELECT v FROM Visite v WHERE v.statut = :statut AND FUNCTION('DATE', v.dateFin) = FUNCTION('DATE', :date) ORDER BY v.dateFin DESC")
    List<Visite> findCompletedVisitsByDate(@Param("statut") String statut, @Param("date") LocalDateTime date);

    @Query("SELECT v FROM Visite v WHERE v.statut = :statut AND FUNCTION('DATE', v.dateFin) = FUNCTION('DATE', :date) AND v.idMedecin = :idMedecin ORDER BY v.dateFin DESC")
    List<Visite> findCompletedVisitsByDateAndDoctor(
            @Param("statut") String statut, 
            @Param("date") LocalDateTime date, 
            @Param("idMedecin") UUID idMedecin);

    Optional<Visite> findByIdMedecinAndStatut(UUID idMedecin, String statut);

    @Query("SELECT v FROM Visite v WHERE v.statut = 'PLANIFIE' AND FUNCTION('DATE', v.dateDebut) = FUNCTION('DATE', :today) AND v.dateDebut > :currentTime ORDER BY v.dateDebut ASC")
    List<Visite> findUpcomingVisitesForToday(@Param("today") LocalDateTime today, @Param("currentTime") LocalDateTime currentTime);
}