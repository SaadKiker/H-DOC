package com.hdoc.sgdm.dto.response;

import com.hdoc.sgdm.dto.common.MedecinDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedecinListResponse {
    private String status;
    private String message;
    private List<MedecinDTO> medecins;
    private int count;
}