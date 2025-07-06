package com.hdoc.sgdm.dto.response;

import java.util.List;

import com.hdoc.sgdm.dto.common.UtilisateurDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UtilisateurListResponse {
    
    private List<UtilisateurDTO> utilisateurs;
    private int count;
} 