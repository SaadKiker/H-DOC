package com.hdoc.sgdm.dto.request;

import lombok.Data;

@Data
public class EditVisiteRequest {
    private String typeVisite;
    private String motif;
    private String service;
    private String idMedecin;
    private String note;
}