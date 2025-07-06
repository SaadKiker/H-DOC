package com.hdoc.sgdm.repository;

import com.hdoc.sgdm.entity.Ordonnance;
import com.hdoc.sgdm.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Integer> {
    
    /**
     * Find all prescriptions for a specific ordonnance
     * 
     * @param ordonnance The ordonnance entity
     * @return List of prescriptions
     */
    List<Prescription> findAllByOrdonnance(Ordonnance ordonnance);
    
    /**
     * Find all prescriptions for a specific ordonnance ID
     * 
     * @param idOrdonnance Ordonnance ID
     * @return List of prescriptions
     */
    List<Prescription> findAllByOrdonnance_IdOrdonnance(Long idOrdonnance);
} 