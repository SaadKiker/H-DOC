package com.hdoc.sgdm.util;

import java.util.UUID;

import org.springframework.stereotype.Component;

import com.hdoc.sgdm.dto.common.CurrentUser;

/**
 * Utility class to extract and validate user information from request headers.
 * This centralizes the logic for creating CurrentUser objects across all controllers.
 */
@Component
public class UserRequestUtil {

    /**
     * Extract user information from headers and create a CurrentUser object
     * 
     * @param userId The user ID from X-User-ID header
     * @param userRole The user role from X-User-Role header
     * @return CurrentUser object if valid headers are provided, null otherwise
     */
    public CurrentUser extractCurrentUser(String userId, String userRole) {
        if (userId == null || userRole == null) {
            return null;
        }
        
        UUID userUUID = null;
        try {
            userUUID = UUID.fromString(userId);
        } catch (IllegalArgumentException e) {
            // Invalid UUID format
            return null;
        }
        
        return CurrentUser.builder()
                .id(userUUID)
                .role(userRole)
                .idMedecin("MEDECIN".equals(userRole) ? userUUID : null)
                .build();
    }
} 