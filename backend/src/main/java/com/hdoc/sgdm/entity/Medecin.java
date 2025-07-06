package com.hdoc.sgdm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "medecin")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Medecin {

    @Id
    @Column(name = "id_medecin")
    private UUID idMedecin;
    
    @Column(name = "id_specialite")
    private Integer idSpecialite;
    
    @Column(name = "status", nullable = false, length = 20)
    private String status;
    
    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_medecin", referencedColumnName = "id_utilisateur", insertable = false, updatable = false)
    private Utilisateur utilisateur;
}