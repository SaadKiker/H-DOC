package com.hdoc.sgdm.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import com.hdoc.sgdm.dto.common.CurrentUser;
import com.hdoc.sgdm.dto.request.CreatePatientRequest;
import com.hdoc.sgdm.dto.request.SearchPatientRequest;
import com.hdoc.sgdm.dto.request.UpdatePatientRequest;
import com.hdoc.sgdm.dto.response.PatientResponse;
import com.hdoc.sgdm.dto.response.PatientSearchResponse;
import com.hdoc.sgdm.service.PatientService;
import com.hdoc.sgdm.util.UserRequestUtil;

import jakarta.validation.Valid;

import java.util.UUID;

@RestController
@RequestMapping("/api")
public class PatientController {

    private final PatientService patientService;
    private final UserRequestUtil userRequestUtil;

    @Autowired
    public PatientController(PatientService patientService, UserRequestUtil userRequestUtil) {
        this.patientService = patientService;
        this.userRequestUtil = userRequestUtil;
    }

    @PostMapping("/patients/new")
    public ResponseEntity<PatientResponse> createPatient(@Valid @RequestBody CreatePatientRequest createPatientRequest) {
        PatientResponse response = patientService.createPatient(createPatientRequest);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/patients")
    public ResponseEntity<PatientSearchResponse> getPatients(
            @RequestParam(required = false) String query,
            @RequestHeader(value = "X-User-ID", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        // Extract user information from headers
        CurrentUser currentUser = userRequestUtil.extractCurrentUser(userId, userRole);
        
        // Perform search with appropriate access control
        PatientSearchResponse response = patientService.searchPatients(query, currentUser);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/agent/patient/{ipp}")
    public ResponseEntity<PatientResponse> getPatientByIpp(@PathVariable("ipp") String ipp) {
        PatientResponse response = patientService.getPatientByIpp(ipp);
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PutMapping("/patients/{ipp}/modify")
    public ResponseEntity<PatientResponse> updatePatient(
            @PathVariable("ipp") String ipp,
            @Valid @RequestBody UpdatePatientRequest updatePatientRequest) {
        // The IPP from the path will be used to look up the patient
        updatePatientRequest.setIpp(ipp);
        PatientResponse response = patientService.updatePatient(updatePatientRequest);
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}