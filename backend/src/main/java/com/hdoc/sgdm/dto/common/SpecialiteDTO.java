package com.hdoc.sgdm.dto.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpecialiteDTO {
    private Integer idSpecialite;
    private String codeSpecialite;
    private String nom;
    private String description;
}