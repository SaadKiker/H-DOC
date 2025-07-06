package com.hdoc.sgdm.dto.common;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * This class represents the currently authenticated user.
 * It's used for role-based access control in API endpoints.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurrentUser {
    private UUID id;
    private String role;
    private UUID idMedecin; // Will be the same as id if role is MEDECIN
} 