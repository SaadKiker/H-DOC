package com.hdoc.sgdm.repository;

import com.hdoc.sgdm.entity.Certificat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CertificatRepository extends JpaRepository<Certificat, Long> {
    
    /**
     * Find all certificates for a specific patient
     * 
     * @param idPatient The patient's ID
     * @return List of certificates for this patient ordered by creation date (most recent first)
     */
    @Query("SELECT c FROM Certificat c WHERE c.idPatient = :idPatient ORDER BY c.dateRedaction DESC")
    List<Certificat> findAllByIdPatient(UUID idPatient);
} 