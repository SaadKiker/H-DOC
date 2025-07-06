package com.hdoc.sgdm.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AllergieResponse {
    
    private boolean success;
    private String message;
    private AllergieDTO allergie;
} 