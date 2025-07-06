package com.hdoc.sgdm.repository;

import com.hdoc.sgdm.entity.Facture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FactureRepository extends JpaRepository<Facture, Integer> {
    
    /**
     * Find factures by their visit ID
     * 
     * @param idVisite the visit ID
     * @return list of factures for the given visit
     */
    List<Facture> findByIdVisite(Integer idVisite);
    
    /**
     * Find all factures for a specific patient
     * 
     * @param idPatient the patient's ID
     * @return list of factures
     */
    List<Facture> findByIdPatient(UUID idPatient);
    
    /**
     * Find all factures ordered by most recent first
     * 
     * @return list of factures
     */
    List<Facture> findAllByOrderByDateFacturationDesc();
    
    /**
     * Find all factures created between the given start and end datetime
     * 
     * @param start the start datetime (inclusive)
     * @param end the end datetime (exclusive)
     * @return list of factures
     */
    List<Facture> findByDateFacturationBetween(LocalDateTime start, LocalDateTime end);
    
    /**
     * Find all factures with a specific status, ordered by creation date descending
     * 
     * @param status the status to filter by (e.g., "non payé")
     * @return list of factures with the specified status
     */
    List<Facture> findByStatusOrderByDateFacturationDesc(String status);
    
    /**
     * Find factures by patient ID, visit ID, and status
     * 
     * @param idPatient the patient ID
     * @param idVisite the visit ID
     * @param status the status to filter by
     * @return list of factures matching the criteria
     */
    List<Facture> findByIdPatientAndIdVisiteAndStatus(UUID idPatient, Integer idVisite, String status);
} 