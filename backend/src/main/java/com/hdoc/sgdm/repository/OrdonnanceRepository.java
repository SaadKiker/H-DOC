package com.hdoc.sgdm.repository;

import com.hdoc.sgdm.entity.Ordonnance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrdonnanceRepository extends JpaRepository<Ordonnance, Long> {
    
    /**
     * Find all ordonnances for a specific patient, ordered by creation date (newest first)
     * 
     * @param idPatient Patient's UUID
     * @return List of ordonnances
     */
    List<Ordonnance> findAllByIdPatientOrderByDateCreationDesc(UUID idPatient);
    
    /**
     * Find all ordonnances for a specific visite
     * 
     * @param idVisite Visite ID
     * @return List of ordonnances
     */
    List<Ordonnance> findAllByIdVisiteOrderByDateCreationDesc(Long idVisite);
    
    /**
     * Find active ordonnance for a specific patient and visite
     * 
     * @param idPatient Patient's UUID
     * @param idVisite Visite ID
     * @param statut Status of the ordonnance
     * @return Optional containing the active ordonnance if found
     */
    Optional<Ordonnance> findByIdPatientAndIdVisiteAndStatut(UUID idPatient, Long idVisite, String statut);
} 