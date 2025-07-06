package com.hdoc.sgdm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "medicament")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Medicament {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_medicament")
    private Integer idMedicament;
    
    @Column(name = "nom", nullable = false, unique = true)
    private String nom;
    
    @Column(name = "description")
    private String description;
} 