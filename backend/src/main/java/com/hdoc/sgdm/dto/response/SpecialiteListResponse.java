package com.hdoc.sgdm.dto.response;

import com.hdoc.sgdm.dto.common.SpecialiteDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpecialiteListResponse {
    private String status;
    private String message;
    private List<SpecialiteDTO> specialites;
    private int count;
}