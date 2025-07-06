package com.hdoc.sgdm.repository;

import com.hdoc.sgdm.entity.Medecin;
import org.jetbrains.annotations.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MedecinRepository extends JpaRepository<Medecin, UUID> {
    
    @Query("SELECT m FROM Medecin m JOIN FETCH m.utilisateur u WHERE u.estDesactive = false AND m.status = 'AVAILABLE'")
    List<Medecin> findAllActive();

    @NotNull
    @Query("SELECT m FROM Medecin m JOIN FETCH m.utilisateur u WHERE u.estDesactive = false ")
    List<Medecin> findAll();
    
    @Query("SELECT m FROM Medecin m JOIN FETCH m.utilisateur u WHERE m.idSpecialite = :specialiteId AND u.estDesactive = false AND m.status = 'AVAILABLE'")
    List<Medecin> findBySpecialite(@Param("specialiteId") Integer specialiteId);
    
    @Query("SELECT COUNT(m) FROM Medecin m WHERE m.idSpecialite = :specialiteId")
    long countBySpecialite(@Param("specialiteId") Integer specialiteId);
    
    @Query("SELECT COUNT(v) FROM Visite v WHERE v.idMedecin = :medecinId AND v.statut = 'IN_PROGRESS'")
    long countActiveVisits(@Param("medecinId") UUID medecinId);
    
    @Query("SELECT m FROM Medecin m JOIN FETCH m.utilisateur WHERE m.status = :status")
    List<Medecin> findByStatus(@Param("status") String status);
    
    @Query("SELECT m FROM Medecin m JOIN FETCH m.utilisateur WHERE m.idMedecin = :id")
    Optional<Medecin> findByIdWithUtilisateur(@Param("id") UUID id);
}