package com.hdoc.sgdm.dto.response;

import com.hdoc.sgdm.dto.common.UtilisateurDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UtilisateurResponse {
    
    private boolean success;
    private String message;
    private UtilisateurDTO utilisateur;
} 