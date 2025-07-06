package com.hdoc.sgdm.mapper;

import com.hdoc.sgdm.dto.*;
import com.hdoc.sgdm.entity.*;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class FormulaireMedicauxMapper {

    public ModeleFormulaireDTO toModeleDTO(ModeleFormulaire modele) {
        if (modele == null) {
            return null;
        }

        return ModeleFormulaireDTO.builder()
                .idModele(modele.getIdModele())
                .nom(modele.getNom())
                .description(modele.getDescription())
                .idSpecialite(modele.getIdSpecialite())
                .nomSpecialite(modele.getSpecialite() != null ? modele.getSpecialite().getNom() : null)
                .prix(modele.getPrix())
                .build();
    }
    
    public SectionFormulaireDTO toSectionDTO(SectionFormulaire section, List<ChampFormulaire> champs, List<SectionFormulaire> sousSections) {
        if (section == null) {
            return null;
        }

        SectionFormulaireDTO dto = SectionFormulaireDTO.builder()
                .idSection(section.getIdSection())
                .idModele(section.getIdModele())
                .nom(section.getNom())
                .description(section.getDescription())
                .ordreAffichage(section.getOrdreAffichage())
                .idParentSection(section.getIdParentSection())
                .build();
        
        if (champs != null) {
            dto.setChamps(champs.stream()
                    .map(this::toChampDTO)
                    .collect(Collectors.toList()));
        }
        
        if (sousSections != null) {
            List<SectionFormulaireDTO> sousSectionsDTO = new ArrayList<>();
            
            for (SectionFormulaire sousSection : sousSections) {
                List<ChampFormulaire> sousChamps = sousSection.getChamps();
                List<SectionFormulaire> sousSousSections = sousSection.getSousSection();
                
                SectionFormulaireDTO sousSectionDTO = toSectionDTO(sousSection, sousChamps, sousSousSections);
                sousSectionsDTO.add(sousSectionDTO);
            }
            
            dto.setSousSections(sousSectionsDTO);
        }
        
        return dto;
    }
    
    public ChampFormulaireDTO toChampDTO(ChampFormulaire champ) {
        if (champ == null) {
            return null;
        }

        return ChampFormulaireDTO.builder()
                .idChamp(champ.getIdChamp())
                .idSection(champ.getIdSection())
                .nom(champ.getNom())
                .estObligatoire(champ.getEstObligatoire())
                .typeChamp(champ.getTypeChamp())
                .placeholder(champ.getPlaceholder())
                .ordreAffichage(champ.getOrdreAffichage())
                .valeursPossibles(champ.getValeursPossibles())
                .unite(champ.getUnite())
                .build();
    }
    
    public FormulairePatientDTO toFormulairePatientDTO(FormulairePatient formulaire, List<ReponseFormulaire> reponses) {
        if (formulaire == null) {
            return null;
        }

        FormulairePatientDTO dto = FormulairePatientDTO.builder()
                .idFormulaire(formulaire.getIdFormulaire())
                .idPatient(formulaire.getIdPatient())
                .nomPatient(formulaire.getPatient() != null ? 
                        formulaire.getPatient().getNom() + " " + formulaire.getPatient().getPrenom() : null)
                .idModele(formulaire.getIdModele())
                .nomModele(formulaire.getModeleFormulaire() != null ? formulaire.getModeleFormulaire().getNom() : null)
                .status(formulaire.getStatus())
                .idMedecin(formulaire.getIdMedecin())
                .nomMedecin(formulaire.getMedecin() != null ? 
                        formulaire.getMedecin().getUtilisateur() != null ? 
                                formulaire.getMedecin().getUtilisateur().getNom() + " " + 
                                formulaire.getMedecin().getUtilisateur().getPrenom() : null : null)
                .idVisite(formulaire.getIdVisite())
                .dateRemplissage(formulaire.getDateRemplissage())
                .prix(formulaire.getModeleFormulaire() != null ? formulaire.getModeleFormulaire().getPrix() : null)
                .build();
        
        if (reponses != null) {
            dto.setReponses(reponses.stream()
                    .map(this::toReponseDTO)
                    .collect(Collectors.toList()));
        }
        
        return dto;
    }
    
    public ReponseFormulaireDTO toReponseDTO(ReponseFormulaire reponse) {
        if (reponse == null) {
            return null;
        }

        return ReponseFormulaireDTO.builder()
                .idReponse(reponse.getIdReponse())
                .idFormulaire(reponse.getIdFormulaire())
                .idChamp(reponse.getIdChamp())
                .nomChamp(reponse.getChampFormulaire() != null ? reponse.getChampFormulaire().getNom() : null)
                .typeChamp(reponse.getChampFormulaire() != null ? reponse.getChampFormulaire().getTypeChamp() : null)
                .valeur(reponse.getValeur())
                .idSection(reponse.getIdSection())
                .nomSection(reponse.getSection() != null ? reponse.getSection().getNom() : null)
                .unite(reponse.getChampFormulaire() != null ? reponse.getChampFormulaire().getUnite() : null)
                .build();
    }
    
    public FormulairePatient toFormulairePatientEntity(FormulaireRequest request) {
        if (request == null) {
            return null;
        }
        
        return FormulairePatient.builder()
                .idPatient(request.getIdPatient())
                .idModele(request.getIdModele())
                .status(request.getStatus())
                .idMedecin(request.getIdMedecin())
                .idVisite(request.getIdVisite())
                .dateRemplissage(LocalDateTime.now())
                .build();
    }
    
    public List<ReponseFormulaire> toReponseEntities(Integer idFormulaire, List<FormulaireRequest.ReponseRequest> reponses) {
        if (reponses == null) {
            return null;
        }
        
        return reponses.stream()
                .map(reponse -> ReponseFormulaire.builder()
                        .idFormulaire(idFormulaire)
                        .idChamp(reponse.getIdChamp())
                        .valeur(reponse.getValeur())
                        .idSection(reponse.getIdSection())
                        .build())
                .collect(Collectors.toList());
    }
} 