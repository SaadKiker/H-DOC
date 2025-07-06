package com.hdoc.sgdm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "document_importe")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentImporte {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_document")
    private Long idDocument;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_patient", referencedColumnName = "id_patient", nullable = false)
    private Patient patient;
    
    @Column(name = "nom", nullable = false, length = 255)
    private String nom;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "type_document", nullable = false, length = 50)
    private String typeDocument;
    
    @CreationTimestamp
    @Column(name = "date_ajout", nullable = false, updatable = false)
    private LocalDateTime dateAjout;
    
    @Column(name = "url", nullable = false, columnDefinition = "TEXT")
    private String url;
    
    // Removed visite relationship as per requirement
}