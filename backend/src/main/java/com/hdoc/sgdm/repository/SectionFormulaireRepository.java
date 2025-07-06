package com.hdoc.sgdm.repository;

import com.hdoc.sgdm.entity.SectionFormulaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SectionFormulaireRepository extends JpaRepository<SectionFormulaire, Integer> {
    List<SectionFormulaire> findByIdModeleOrderByOrdreAffichage(Integer idModele);
    List<SectionFormulaire> findByIdModeleAndIdParentSectionIsNullOrderByOrdreAffichage(Integer idModele);
    List<SectionFormulaire> findByIdParentSectionOrderByOrdreAffichage(Integer idParentSection);
} 