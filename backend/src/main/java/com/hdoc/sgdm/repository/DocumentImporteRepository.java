package com.hdoc.sgdm.repository;

import com.hdoc.sgdm.entity.DocumentImporte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentImporteRepository extends JpaRepository<DocumentImporte, Long> {
    List<DocumentImporte> findByPatientIdPatient(UUID patientId);
    List<DocumentImporte> findByPatientIpp(String ipp);
}