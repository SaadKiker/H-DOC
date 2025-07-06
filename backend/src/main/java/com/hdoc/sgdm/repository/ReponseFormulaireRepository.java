package com.hdoc.sgdm.repository;

import com.hdoc.sgdm.entity.ReponseFormulaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReponseFormulaireRepository extends JpaRepository<ReponseFormulaire, Integer> {
    List<ReponseFormulaire> findByIdFormulaire(Integer idFormulaire);
    List<ReponseFormulaire> findByIdFormulaireAndIdSection(Integer idFormulaire, Integer idSection);
    
    @Query("SELECT r FROM ReponseFormulaire r " +
           "LEFT JOIN FETCH r.champFormulaire c " +
           "LEFT JOIN FETCH r.section s " + 
           "WHERE r.idFormulaire = :idFormulaire")
    List<ReponseFormulaire> findByIdFormulaireWithRelations(@Param("idFormulaire") Integer idFormulaire);
} 