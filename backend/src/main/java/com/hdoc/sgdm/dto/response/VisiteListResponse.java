package com.hdoc.sgdm.dto.response;

import com.hdoc.sgdm.dto.common.VisiteDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisiteListResponse {
    private String status;
    private String message;
    private List<VisiteDTO> visites;
    
    @Builder.Default
    private Integer count = 0;  // Number of visits in the list
}