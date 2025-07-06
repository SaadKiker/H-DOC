package com.hdoc.sgdm.dto.response;

import com.hdoc.sgdm.dto.common.VisiteDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisiteResponse {
    private String status;
    private String message;
    private VisiteDTO visite;
    private RendezVousResponse rendezVous; // Associated appointment if the visit was created from an appointment
}