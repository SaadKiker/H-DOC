package com.hdoc.sgdm.repository;

import com.hdoc.sgdm.entity.Medicament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicamentRepository extends JpaRepository<Medicament, Integer> {
    
    /**
     * Find a medicament by its name
     * 
     * @param nom Medicament name
     * @return Optional containing the medicament if found
     */
    Optional<Medicament> findByNom(String nom);
    
    /**
     * Find all medicaments whose name contains the given text (case insensitive)
     * 
     * @param nom Text to search for in medicament names
     * @return List of matching medicaments
     */
    List<Medicament> findByNomContainingIgnoreCase(String nom);
} 