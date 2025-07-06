package com.hdoc.sgdm.repository;

import com.hdoc.sgdm.entity.ChampFormulaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChampFormulaireRepository extends JpaRepository<ChampFormulaire, Integer> {
    List<ChampFormulaire> findByIdSectionOrderByOrdreAffichage(Integer idSection);
    Optional<ChampFormulaire> findById(Integer idChamp);
    
    @Query("SELECT c FROM ChampFormulaire c WHERE c.idChamp IN :ids")
    List<ChampFormulaire> findAllByIds(List<Integer> ids);
} 