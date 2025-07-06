package com.hdoc.sgdm.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "allergie")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Allergie {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_allergie")
    private Long idAllergie;
    
    @ManyToOne
    @JoinColumn(name = "id_patient", nullable = false)
    private Patient patient;
    
    @Column(nullable = false, length = 255)
    private String allergene;
    
    @Column(name = "type_allergie", length = 100)
    private String typeAllergie;
    
    @Column(name = "gravité", length = 50)
    private String gravite;
    
    @Column(name = "réaction")
    private String reaction;
    
    @Column(name = "date_diagnostic")
    private LocalDate dateDiagnostic;
    
    @Column
    private String remarques;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
} 