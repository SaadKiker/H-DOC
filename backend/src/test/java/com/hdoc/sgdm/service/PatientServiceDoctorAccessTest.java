package com.hdoc.sgdm.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import com.hdoc.sgdm.dto.common.CurrentUser;
import com.hdoc.sgdm.dto.common.PatientDTO;
import com.hdoc.sgdm.dto.response.PatientSearchResponse;
import com.hdoc.sgdm.entity.Patient;
import com.hdoc.sgdm.repository.PatientRepository;
import com.hdoc.sgdm.repository.VisiteRepository;
import com.hdoc.sgdm.util.IPPGenerator;

public class PatientServiceDoctorAccessTest {

    @Mock
    private PatientRepository patientRepository;
    
    @Mock
    private VisiteRepository visiteRepository;
    
    @Mock
    private IPPGenerator ippGenerator;
    
    @InjectMocks
    private PatientService patientService;
    
    private UUID doctorId;
    private CurrentUser doctorUser;
    private CurrentUser agentUser;
    private Patient patient1;
    private Patient patient2;
    private UUID patient1Id;
    private UUID patient2Id;
    
    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        
        // Set up test data
        doctorId = UUID.randomUUID();
        patient1Id = UUID.randomUUID();
        patient2Id = UUID.randomUUID();
        
        doctorUser = CurrentUser.builder()
                .id(doctorId)
                .role("MEDECIN")
                .idMedecin(doctorId)
                .build();
        
        agentUser = CurrentUser.builder()
                .id(UUID.randomUUID())
                .role("AGENT")
                .build();
        
        // Create test patients
        patient1 = new Patient();
        patient1.setIdPatient(patient1Id);
        patient1.setNom("Dupont");
        patient1.setPrenom("Jean");
        patient1.setIpp("P00001");
        
        patient2 = new Patient();
        patient2.setIdPatient(patient2Id);
        patient2.setNom("Martin");
        patient2.setPrenom("Marie");
        patient2.setIpp("P00002");
    }
    
    @Test
    public void testAgentCanSearchAllPatients() {
        // Setup: Agent should see all patients
        when(patientRepository.findAll()).thenReturn(Arrays.asList(patient1, patient2));
        
        // Execute
        PatientSearchResponse response = patientService.searchPatients("", agentUser);
        
        // Verify
        assertTrue(response.isSuccess());
        assertEquals(2, response.getCount());
        assertEquals(2, response.getPatients().size());
        assertEquals("P00001", response.getPatients().get(0).getIpp());
        assertEquals("P00002", response.getPatients().get(1).getIpp());
    }
    
    @Test
    public void testDoctorCanOnlySeeRelatedPatients() {
        // Setup: Doctor has relationship only with patient1 - using direct repository method now
        when(patientRepository.findPatientsByDoctorId(doctorId)).thenReturn(Collections.singletonList(patient1));
        
        // Execute
        PatientSearchResponse response = patientService.searchPatients("", doctorUser);
        
        // Verify
        assertTrue(response.isSuccess());
        assertEquals(1, response.getCount());
        assertEquals(1, response.getPatients().size());
        assertEquals("P00001", response.getPatients().get(0).getIpp());
    }
    
    @Test
    public void testDoctorWithoutRelationshipsGetsEmptyResults() {
        // Setup: Doctor has no patient relationships
        when(patientRepository.findPatientsByDoctorId(doctorId)).thenReturn(Collections.emptyList());
        
        // Execute
        PatientSearchResponse response = patientService.searchPatients("", doctorUser);
        
        // Verify
        assertTrue(response.isSuccess());
        assertEquals(0, response.getCount());
        assertEquals(0, response.getPatients().size());
        assertEquals("Aucun patient trouvé avec une relation établie avec ce médecin", response.getMessage());
    }
    
    @Test
    public void testDoctorCanOnlySearchOwnPatients() {
        // Setup
        String query = "Dupont";
        // DB-level filtering now
        when(patientRepository.findPatientsByDoctorId(doctorId)).thenReturn(Collections.singletonList(patient1));
        when(patientRepository.findByNomContainingIgnoreCaseAndDoctorId(query, doctorId)).thenReturn(Collections.singletonList(patient1));
        when(patientRepository.findByPrenomContainingIgnoreCaseAndDoctorId(query, doctorId)).thenReturn(Collections.emptyList());
        
        // Execute
        PatientSearchResponse response = patientService.searchPatients(query, doctorUser);
        
        // Verify
        assertTrue(response.isSuccess());
        assertEquals(1, response.getCount());
        assertEquals(1, response.getPatients().size());
        assertEquals("P00001", response.getPatients().get(0).getIpp());
    }
    
    @Test
    public void testDoctorCannotSeePatientsByIPPIfNoRelationship() {
        // Setup
        String ipp = "P00002"; // Patient without relationship
        // Empty result since direct DB filtering returns nothing
        when(patientRepository.findPatientsByDoctorId(doctorId)).thenReturn(Collections.singletonList(patient1));
        when(patientRepository.findByIppAndDoctorId(ipp, doctorId)).thenReturn(Optional.empty());
        
        // Execute
        PatientSearchResponse response = patientService.searchPatients(ipp, doctorUser);
        
        // Verify
        assertTrue(response.isSuccess());
        assertEquals(0, response.getCount());
        assertEquals(0, response.getPatients().size());
    }
} 