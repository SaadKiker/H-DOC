package com.hdoc.sgdm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "specialite")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Specialite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_specialite")
    private Integer idSpecialite;
    
    @Column(name = "code_specialite", nullable = false)
    private String codeSpecialite;
    
    @Column(nullable = false, unique = true)
    private String nom;
    
    @Column
    private String description;
}