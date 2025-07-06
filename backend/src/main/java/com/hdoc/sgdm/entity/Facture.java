package com.hdoc.sgdm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "facture")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Facture {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_facture")
    private Integer idFacture;

    @Column(name = "id_patient")
    private UUID idPatient;

    @Column(name = "id_visite")
    private Integer idVisite;

    @Column(name = "montant", precision = 10, scale = 2)
    private BigDecimal montant;

    @Column(name = "mode_paiement", length = 50)
    private String modePaiement;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "date_facturation")
    private LocalDateTime dateFacturation;

    @Column(name = "url", length = 255)
    private String url;
} 