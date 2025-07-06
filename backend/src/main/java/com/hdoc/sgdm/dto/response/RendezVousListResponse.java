package com.hdoc.sgdm.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RendezVousListResponse {
    private String status;
    private String message;
    private List<RendezVousResponse> appointments;
    
    @Builder.Default
    private Integer count = 0;  // Number of appointments in the list
} 