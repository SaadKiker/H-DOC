package com.hdoc.sgdm.repository;

import com.hdoc.sgdm.entity.FormulairePatient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FormulairePatientRepository extends JpaRepository<FormulairePatient, Integer> {
    List<FormulairePatient> findByIdPatient(UUID idPatient);
    List<FormulairePatient> findByIdVisite(Integer idVisite);
    List<FormulairePatient> findByIdMedecin(UUID idMedecin);
    List<FormulairePatient> findByIdPatientAndIdMedecin(UUID idPatient, UUID idMedecin);
    boolean existsByIdModele(Integer idModele);
} 