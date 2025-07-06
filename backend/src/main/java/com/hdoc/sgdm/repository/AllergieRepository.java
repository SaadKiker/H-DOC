package com.hdoc.sgdm.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hdoc.sgdm.entity.Allergie;

@Repository
public interface AllergieRepository extends JpaRepository<Allergie, Long> {
    
    /**
     * Find all allergies for a specific patient
     * 
     * @param idPatient the patient ID
     * @return List of allergies
     */
    List<Allergie> findByPatientIdPatient(UUID idPatient);
} 