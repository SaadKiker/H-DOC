package com.hdoc.sgdm.service;

import com.hdoc.sgdm.dto.request.PrepareFactureRequest;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class FactureServicePrepareTest {
    
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
    
    private UUID patientId;
    private Integer visiteId;
    private Visite visite;
    private Patient patient;
    private Facture savedFacture;
    private FactureResponse factureResponse;
    
    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        
        patientId = UUID.randomUUID();
        visiteId = 123;
        
        // Set up patient
        patient = new Patient();
        patient.setIdPatient(patientId);
        patient.setNom("Dupont");
        patient.setPrenom("Jean");
        
        // Set up visite
        visite = new Visite();
        visite.setIdVisite(visiteId.longValue());
        visite.setPatient(patient);
        
        // Set up facture
        savedFacture = new Facture();
        savedFacture.setIdFacture(1);
        savedFacture.setIdPatient(patientId);
        savedFacture.setIdVisite(visiteId);
        savedFacture.setMontant(BigDecimal.ZERO);
        savedFacture.setStatus("non payé");
        savedFacture.setModePaiement(null);
        savedFacture.setDateFacturation(null);
        savedFacture.setUrl(null);
        
        // Set up response
        factureResponse = new FactureResponse();
        factureResponse.setIdFacture(1);
        factureResponse.setIdPatient(patientId);
        factureResponse.setIdVisite(visiteId);
        factureResponse.setMontant(BigDecimal.ZERO);
        factureResponse.setStatus("non payé");
        factureResponse.setModePaiement(null);
        factureResponse.setDateFacturation(null);
        factureResponse.setUrl(null);
    }
    
    @Test
    public void testPrepareFacture_Success() {
        // Arrange
        PrepareFactureRequest request = new PrepareFactureRequest(patientId, visiteId);
        
        when(factureRepository.findByIdVisite(visiteId)).thenReturn(List.of());
        when(visiteRepository.findById(visiteId.longValue())).thenReturn(Optional.of(visite));
        when(factureRepository.save(any(Facture.class))).thenReturn(savedFacture);
        when(factureMapper.toDto(savedFacture)).thenReturn(factureResponse);
        
        // Act
        FactureResponse result = factureService.prepareFacture(request);
        
        // Assert
        assertNotNull(result);
        assertEquals(1, result.getIdFacture());
        assertEquals(patientId, result.getIdPatient());
        assertEquals(visiteId, result.getIdVisite());
        assertEquals(BigDecimal.ZERO, result.getMontant());
        assertEquals("non payé", result.getStatus());
        assertNull(result.getModePaiement());
        assertNull(result.getDateFacturation());
        assertNull(result.getUrl());
        
        verify(factureRepository).findByIdVisite(visiteId);
        verify(visiteRepository).findById(visiteId.longValue());
        verify(factureRepository).save(any(Facture.class));
        verify(factureMapper).toDto(savedFacture);
    }
    
    @Test
    public void testPrepareFacture_FactureAlreadyExists() {
        // Arrange
        PrepareFactureRequest request = new PrepareFactureRequest(patientId, visiteId);
        Facture existingFacture = new Facture();
        
        when(factureRepository.findByIdVisite(visiteId)).thenReturn(List.of(existingFacture));
        
        // Act & Assert
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            factureService.prepareFacture(request);
        });
        
        assertEquals("409 CONFLICT \"Une facture existe déjà pour cette visite\"", exception.getMessage());
        verify(factureRepository).findByIdVisite(visiteId);
        verify(visiteRepository, never()).findById(any());
        verify(factureRepository, never()).save(any());
    }
    
    @Test
    public void testPrepareFacture_VisiteNotFound() {
        // Arrange
        PrepareFactureRequest request = new PrepareFactureRequest(patientId, visiteId);
        
        when(factureRepository.findByIdVisite(visiteId)).thenReturn(List.of());
        when(visiteRepository.findById(visiteId.longValue())).thenReturn(Optional.empty());
        
        // Act & Assert
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            factureService.prepareFacture(request);
        });
        
        assertEquals("404 NOT_FOUND \"Visite non trouvée\"", exception.getMessage());
        verify(factureRepository).findByIdVisite(visiteId);
        verify(visiteRepository).findById(visiteId.longValue());
        verify(factureRepository, never()).save(any());
    }
    
    @Test
    public void testPrepareFacture_PatientMismatch() {
        // Arrange
        UUID differentPatientId = UUID.randomUUID();
        PrepareFactureRequest request = new PrepareFactureRequest(differentPatientId, visiteId);
        
        when(factureRepository.findByIdVisite(visiteId)).thenReturn(List.of());
        when(visiteRepository.findById(visiteId.longValue())).thenReturn(Optional.of(visite));
        
        // Act & Assert
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            factureService.prepareFacture(request);
        });
        
        assertEquals("400 BAD_REQUEST \"L'ID du patient ne correspond pas au patient associé à cette visite\"", exception.getMessage());
        verify(factureRepository).findByIdVisite(visiteId);
        verify(visiteRepository).findById(visiteId.longValue());
        verify(factureRepository, never()).save(any());
    }
} 