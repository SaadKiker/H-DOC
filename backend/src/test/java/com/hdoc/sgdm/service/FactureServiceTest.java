package com.hdoc.sgdm.service;

import com.hdoc.sgdm.dto.request.FactureUpdateRequest;
import com.hdoc.sgdm.dto.response.FactureResponse;
import com.hdoc.sgdm.entity.Facture;
import com.hdoc.sgdm.entity.Patient;
import com.hdoc.sgdm.entity.Visite;
import com.hdoc.sgdm.mapper.FactureMapper;
import com.hdoc.sgdm.repository.FactureRepository;
import com.hdoc.sgdm.repository.PatientRepository;
import com.hdoc.sgdm.repository.VisiteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FactureServiceTest {

    @Mock
    private FactureRepository factureRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private VisiteRepository visiteRepository;

    @Mock
    private FactureMapper factureMapper;

    @Mock
    private FacturePDFService facturePDFService;

    @InjectMocks
    private FactureService factureService;

    private Facture facture;
    private Patient patient;
    private Visite visite;
    private FactureUpdateRequest updateRequest;
    private FactureResponse factureResponse;
    private final Integer FACTURE_ID = 1;
    private final UUID PATIENT_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        // Setup test data
        facture = new Facture();
        facture.setIdFacture(FACTURE_ID);
        facture.setIdPatient(PATIENT_ID);
        facture.setIdVisite(123);
        facture.setMontant(new BigDecimal("100.00"));
        facture.setModePaiement("Carte bancaire");
        facture.setStatus("non payé");
        facture.setDateFacturation(null);
        facture.setUrl(null);

        patient = new Patient();
        patient.setIdPatient(PATIENT_ID);
        patient.setNom("Doe");
        patient.setPrenom("John");

        visite = new Visite();
        visite.setIdVisite(123L);
        visite.setPatient(patient);

        updateRequest = new FactureUpdateRequest();
        updateRequest.setMontant(new BigDecimal("150.00"));
        updateRequest.setModePaiement("Espèces");
        updateRequest.setStatus("payé");

        factureResponse = new FactureResponse();
        factureResponse.setIdFacture(FACTURE_ID);
        factureResponse.setMontant(new BigDecimal("150.00"));
        factureResponse.setModePaiement("Espèces");
        factureResponse.setStatus("payé");
    }

    @Test
    void updateFacture_Success() {
        // Arrange
        when(factureRepository.findById(FACTURE_ID)).thenReturn(Optional.of(facture));
        when(factureRepository.save(any(Facture.class))).thenReturn(facture);
        when(patientRepository.findByIdPatient(PATIENT_ID)).thenReturn(Optional.of(patient));
        when(visiteRepository.findById(123L)).thenReturn(Optional.of(visite));
        when(factureMapper.toDto(any(Facture.class))).thenReturn(factureResponse);

        // Act
        FactureResponse result = factureService.updateFacture(FACTURE_ID, updateRequest);

        // Assert
        assertNotNull(result);
        assertEquals("payé", result.getStatus());
        assertEquals(new BigDecimal("150.00"), result.getMontant());
        assertEquals("Espèces", result.getModePaiement());
        
        // Verify facture was saved
        verify(factureRepository).save(any(Facture.class));
        // Verify patient and visit were looked up for PDF generation
        verify(patientRepository).findByIdPatient(PATIENT_ID);
        verify(visiteRepository).findById(123L);
    }

    @Test
    void updateFacture_FactureNotFound() {
        // Arrange
        when(factureRepository.findById(FACTURE_ID)).thenReturn(Optional.empty());

        // Act & Assert
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> 
            factureService.updateFacture(FACTURE_ID, updateRequest)
        );
        
        assertEquals("404 NOT_FOUND \"Facture non trouvée\"", exception.getMessage());
    }

    @Test
    void updateFacture_AlreadyPaid() {
        // Arrange
        facture.setStatus("payé");
        when(factureRepository.findById(FACTURE_ID)).thenReturn(Optional.of(facture));

        // Act & Assert
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> 
            factureService.updateFacture(FACTURE_ID, updateRequest)
        );
        
        assertEquals("400 BAD_REQUEST \"Seules les factures avec statut 'non payé' peuvent être modifiées\"", exception.getMessage());
    }
} 