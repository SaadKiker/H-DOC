package com.hdoc.sgdm.dto.response;

import java.util.List;

import com.hdoc.sgdm.dto.common.PatientDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PatientSearchResponse {
    
    private boolean success;
    private String message;
    private List<PatientDTO> patients;
    private int count;
}