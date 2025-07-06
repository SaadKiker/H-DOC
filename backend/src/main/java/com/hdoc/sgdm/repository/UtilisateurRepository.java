package com.hdoc.sgdm.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hdoc.sgdm.entity.Utilisateur;

@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, UUID> {
    
    Optional<Utilisateur> findByIdentifiant(String identifiant);
    
    List<Utilisateur> findByEstDesactiveFalse();

}