package com.hdoc.sgdm.repository;

import com.hdoc.sgdm.entity.ModeleFormulaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ModeleFormulaireRepository extends JpaRepository<ModeleFormulaire, Integer> {
    List<ModeleFormulaire> findByIdSpecialite(Integer idSpecialite);
} 