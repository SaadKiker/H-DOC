package com.hdoc.sgdm.service.impl;

import com.hdoc.sgdm.dto.*;
import com.hdoc.sgdm.entity.*;
import com.hdoc.sgdm.mapper.FormulaireMedicauxMapper;
import com.hdoc.sgdm.repository.*;
import com.hdoc.sgdm.service.FormulaireMedicalService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FormulaireMedicalServiceImpl implements FormulaireMedicalService {

    private final ModeleFormulaireRepository modeleFormulaireRepository;
    private final SectionFormulaireRepository sectionFormulaireRepository;
    private final ChampFormulaireRepository champFormulaireRepository;
    private final FormulairePatientRepository formulairePatientRepository;
    private final ReponseFormulaireRepository reponseFormulaireRepository;
    private final MedecinRepository medecinRepository;
    private final VisiteRepository visiteRepository;
    private final FormulaireMedicauxMapper mapper;

    @Override
    public List<ModeleFormulaireDTO> getModeleFormulairesBySpecialite(Integer idSpecialite) {
        return modeleFormulaireRepository.findByIdSpecialite(idSpecialite)
                .stream()
                .map(mapper::toModeleDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<SectionFormulaireDTO> getStructureFormulaire(Integer idModele) {
        // Get root sections (no parent)
        List<SectionFormulaire> rootSections = sectionFormulaireRepository
                .findByIdModeleAndIdParentSectionIsNullOrderByOrdreAffichage(idModele);
        
        List<SectionFormulaireDTO> sectionDTOs = new ArrayList<>();
        
        for (SectionFormulaire rootSection : rootSections) {
            // Get fields for this section
            List<ChampFormulaire> champs = champFormulaireRepository
                    .findByIdSectionOrderByOrdreAffichage(rootSection.getIdSection());
            
            // Get subsections for this section
            List<SectionFormulaire> subSections = sectionFormulaireRepository
                    .findByIdParentSectionOrderByOrdreAffichage(rootSection.getIdSection());
            
            // Build section DTO with fields and subsections
            SectionFormulaireDTO sectionDTO = mapper.toSectionDTO(rootSection, champs, subSections);
            sectionDTOs.add(sectionDTO);
        }
        
        return sectionDTOs;
    }

    @Override
    @Transactional
    public FormulairePatientDTO soumettreFormulaire(FormulaireRequest request) {
        // Verify access - Make sure the doctor has access to this model and patient
        validateMedecinAccess(request.getIdMedecin(), request.getIdModele(), request.getIdPatient(), request.getIdVisite());
        
        // Log incoming request
        System.out.println("Processing form request with " + 
                (request.getReponses() != null ? request.getReponses().size() : "null") + " responses");
        
        // Create and save the form
        FormulairePatient formulaire = mapper.toFormulairePatientEntity(request);
        FormulairePatient savedFormulaire = formulairePatientRepository.save(formulaire);
        System.out.println("Saved form with ID: " + savedFormulaire.getIdFormulaire());
        
        // Create and save all responses
        if (request.getReponses() == null || request.getReponses().isEmpty()) {
            System.out.println("WARNING: No responses in the request");
        } else {
            System.out.println("Preparing to save " + request.getReponses().size() + " responses");
            for (FormulaireRequest.ReponseRequest resp : request.getReponses()) {
                System.out.println("  - Response field ID: " + resp.getIdChamp() + ", value: " + resp.getValeur());
            }
        }
        
        List<ReponseFormulaire> reponses = mapper.toReponseEntities(
                savedFormulaire.getIdFormulaire(), 
                request.getReponses()
        );
        
        List<ReponseFormulaire> savedReponses = reponseFormulaireRepository.saveAll(reponses);
        System.out.println("Saved " + savedReponses.size() + " responses to database");
        
        // Return the created form with its responses
        FormulairePatientDTO result = mapper.toFormulairePatientDTO(savedFormulaire, savedReponses);
        System.out.println("Returning DTO with " + 
                (result.getReponses() != null ? result.getReponses().size() : "null") + " responses");
        
        return result;
    }

    @Override
    public List<FormulairePatientDTO> getFormulairesPatient(UUID idPatient) {
        List<FormulairePatient> formulaires = formulairePatientRepository.findByIdPatient(idPatient);
        
        return formulaires.stream()
                .map(formulaire -> {
                    List<ReponseFormulaire> reponses = reponseFormulaireRepository
                            .findByIdFormulaireWithRelations(formulaire.getIdFormulaire());
                    return mapper.toFormulairePatientDTO(formulaire, reponses);
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Get forms for a patient filtered by the medecin's access
     */
    @Override
    public List<FormulairePatientDTO> getFormulairesPatientForMedecin(UUID idPatient, UUID idMedecin) {
        List<FormulairePatient> formulaires = formulairePatientRepository.findByIdPatientAndIdMedecin(idPatient, idMedecin);
        
        return formulaires.stream()
                .map(formulaire -> {
                    List<ReponseFormulaire> reponses = reponseFormulaireRepository
                            .findByIdFormulaireWithRelations(formulaire.getIdFormulaire());
                    return mapper.toFormulairePatientDTO(formulaire, reponses);
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<FormulairePatientDTO> getFormulairesVisite(Integer idVisite) {
        List<FormulairePatient> formulaires = formulairePatientRepository.findByIdVisite(idVisite);
        
        return formulaires.stream()
                .map(formulaire -> {
                    List<ReponseFormulaire> reponses = reponseFormulaireRepository
                            .findByIdFormulaireWithRelations(formulaire.getIdFormulaire());
                    return mapper.toFormulairePatientDTO(formulaire, reponses);
                })
                .collect(Collectors.toList());
    }

    @Override
    public FormulairePatientDTO getFormulairePatient(Integer idFormulaire) {
        Optional<FormulairePatient> formulaireOpt = formulairePatientRepository.findById(idFormulaire);
        
        if (formulaireOpt.isEmpty()) {
            return null;
        }
        
        // Get the form with basic data
        FormulairePatient formulaire = formulaireOpt.get();
        
        // Use the enhanced method that eagerly loads relationships for PDF generation
        List<ReponseFormulaire> reponses = reponseFormulaireRepository.findByIdFormulaireWithRelations(idFormulaire);
        
        // Verify that each response has the associated field name loaded
        for (ReponseFormulaire reponse : reponses) {
            // Check if champFormulaire is loaded but nomChamp would be null in the DTO
            if (reponse.getChampFormulaire() == null) {
                System.out.println("Warning: Response " + reponse.getIdReponse() + 
                        " for field ID " + reponse.getIdChamp() + " has no champFormulaire reference");
            } else {
                System.out.println("Response field name: " + reponse.getChampFormulaire().getNom() + 
                        " for field ID " + reponse.getIdChamp());
            }
        }
        
        // Convert to DTO with all related data
        FormulairePatientDTO dto = mapper.toFormulairePatientDTO(formulaire, reponses);
        
        // Additional verification for the DTO
        if (dto.getReponses() != null) {
            int emptyFieldNames = 0;
            int emptyValues = 0;
            
            for (ReponseFormulaireDTO resp : dto.getReponses()) {
                if (resp.getNomChamp() == null || resp.getNomChamp().isEmpty()) {
                    emptyFieldNames++;
                }
                if (resp.getValeur() == null || resp.getValeur().isEmpty()) {
                    emptyValues++;
                }
            }
            
            System.out.println("DTO contains " + dto.getReponses().size() + " responses, " +
                    emptyFieldNames + " have empty field names, " +
                    emptyValues + " have empty values");
        }
        
        return dto;
    }
    
    /**
     * Check if a medecin can access a specific form
     */
    @Override
    public boolean canMedecinAccessFormulaire(UUID idMedecin, Integer idFormulaire) {
        Optional<FormulairePatient> formulaireOpt = formulairePatientRepository.findById(idFormulaire);
        
        if (formulaireOpt.isEmpty()) {
            return false;
        }
        
        FormulairePatient formulaire = formulaireOpt.get();
        
        // Medecin can access if they created the form or it's for their patient
        return formulaire.getIdMedecin().equals(idMedecin);
    }

    @Override
    public List<FormulairePatientDTO> getFormulaireMedecin(UUID idMedecin) {
        List<FormulairePatient> formulaires = formulairePatientRepository.findByIdMedecin(idMedecin);
        
        return formulaires.stream()
                .map(formulaire -> {
                    List<ReponseFormulaire> reponses = reponseFormulaireRepository
                            .findByIdFormulaireWithRelations(formulaire.getIdFormulaire());
                    return mapper.toFormulairePatientDTO(formulaire, reponses);
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Validate if a doctor has access to create/view a form
     * This will throw an IllegalArgumentException if access is denied
     */
    private void validateMedecinAccess(UUID idMedecin, Integer idModele, UUID idPatient, Integer idVisite) {
        // 1. Verify the doctor has the correct specialty for this form template
        Optional<ModeleFormulaire> modeleOpt = modeleFormulaireRepository.findById(idModele);
        if (modeleOpt.isEmpty()) {
            throw new IllegalArgumentException("Form template not found: " + idModele);
        }
        
        ModeleFormulaire modele = modeleOpt.get();
        
        // Special case: Form model ID 1 (Signes vitaux et biométrie) should be accessible to all doctors
        // regardless of their specialty
        if (modele.getIdModele() != 1) {
            // Only perform specialty check for models other than ID 1
            System.out.println("Checking specialty access for form model: " + modele.getIdModele() + " - " + modele.getNom());
            if (!isModelCompatibleWithMedecinSpecialite(modele.getIdSpecialite(), idMedecin)) {
                throw new IllegalArgumentException("Doctor does not have the right specialty for this form");
            }
        } else {
            System.out.println("Skipping specialty check for form model ID 1 (Signes vitaux et biométrie)");
        }
        
        // 2. Verify the doctor is assigned to the patient's visit
        if (!isMedecinAssignedToVisite(idMedecin, idVisite)) {
            throw new IllegalArgumentException("Doctor is not assigned to this visit");
        }
    }
    
    /**
     * Check if a model's specialty is compatible with the doctor's specialty
     */
    private boolean isModelCompatibleWithMedecinSpecialite(Integer idSpecialite, UUID idMedecin) {
        // Get the doctor's specialty
        Optional<Medecin> medecinOpt = medecinRepository.findById(idMedecin);
        
        if (medecinOpt.isEmpty()) {
            // Doctor not found
            return false;
        }
        
        Medecin medecin = medecinOpt.get();
        Integer medecinSpecialty = medecin.getIdSpecialite();
        
        // Check if the doctor has the right specialty
        return medecinSpecialty != null && medecinSpecialty.equals(idSpecialite);
    }
    
    /**
     * Check if a doctor is assigned to a specific visit
     */
    private boolean isMedecinAssignedToVisite(UUID idMedecin, Integer idVisite) {
        // Check if the visit exists and is assigned to this doctor
        Optional<Visite> visiteOpt = visiteRepository.findById(idVisite.longValue());
        
        if (visiteOpt.isEmpty()) {
            // Visit not found
            return false;
        }
        
        Visite visite = visiteOpt.get();
        
        // Check if the doctor is assigned to this visit
        return visite.getIdMedecin() != null && visite.getIdMedecin().equals(idMedecin);
    }

    @Override
    @Transactional
    public ModeleFormulaireDTO createModeleFormulaire(ModeleFormulaireRequest request) {
        ModeleFormulaire modele = ModeleFormulaire.builder()
                .nom(request.getNom())
                .description(request.getDescription())
                .idSpecialite(request.getIdSpecialite())
                .prix(request.getPrix() != null ? request.getPrix() : BigDecimal.ZERO)
                .build();
        
        modele = modeleFormulaireRepository.save(modele);
        return mapper.toModeleDTO(modele);
    }

    @Override
    @Transactional
    public ModeleFormulaireDTO updateModeleFormulaire(Integer idModele, ModeleFormulaireRequest request) {
        ModeleFormulaire modele = modeleFormulaireRepository.findById(idModele)
                .orElseThrow(() -> new IllegalArgumentException("Modèle de formulaire non trouvé avec ID: " + idModele));
        
        modele.setNom(request.getNom());
        modele.setDescription(request.getDescription());
        modele.setIdSpecialite(request.getIdSpecialite());
        modele.setPrix(request.getPrix() != null ? request.getPrix() : BigDecimal.ZERO);
        
        modele = modeleFormulaireRepository.save(modele);
        return mapper.toModeleDTO(modele);
    }

    @Override
    @Transactional
    public List<SectionFormulaireDTO> createCompleteFormulaire(CreateModeleFormulaireRequest request) {
        // 1. Create and save the form model
        ModeleFormulaire modeleFormulaire = ModeleFormulaire.builder()
                .nom(request.getNom())
                .description(request.getDescription())
                .idSpecialite(request.getIdSpecialite())
                .prix(request.getPrix() != null ? request.getPrix() : BigDecimal.ZERO)
                .build();
        
        ModeleFormulaire savedModele = modeleFormulaireRepository.save(modeleFormulaire);
        Integer idModele = savedModele.getIdModele();
        
        // 2. Process top-level sections
        if (request.getSections() != null) {
            for (CreateModeleFormulaireRequest.SectionRequest sectionRequest : request.getSections()) {
                createSectionWithSubsections(sectionRequest, idModele, null);
            }
        }
        
        // 3. Return the full structure of the created form
        return getStructureFormulaire(idModele);
    }
    
    /**
     * Helper method to recursively create sections with their subsections and fields
     */
    private SectionFormulaire createSectionWithSubsections(
            CreateModeleFormulaireRequest.SectionRequest sectionRequest, 
            Integer idModele,
            Integer idParentSection) {
        
        // Create the section
        SectionFormulaire section = SectionFormulaire.builder()
                .nom(sectionRequest.getNom())
                .description(sectionRequest.getDescription())
                .ordreAffichage(sectionRequest.getOrdreAffichage())
                .idModele(idModele)
                .idParentSection(idParentSection)
                .build();
        
        SectionFormulaire savedSection = sectionFormulaireRepository.save(section);
        Integer idSection = savedSection.getIdSection();
        
        // Create fields for this section
        if (sectionRequest.getChamps() != null) {
            for (CreateModeleFormulaireRequest.ChampRequest champRequest : sectionRequest.getChamps()) {
                ChampFormulaire champ = ChampFormulaire.builder()
                        .nom(champRequest.getNom())
                        .estObligatoire(champRequest.getEstObligatoire() != null ? champRequest.getEstObligatoire() : false)
                        .typeChamp(champRequest.getTypeChamp())
                        .placeholder(champRequest.getPlaceholder())
                        .ordreAffichage(champRequest.getOrdreAffichage())
                        .valeursPossibles(champRequest.getValeursPossibles())
                        .unite(champRequest.getUnite())
                        .idSection(idSection)
                        .build();
                
                champFormulaireRepository.save(champ);
            }
        }
        
        // Create subsections recursively
        if (sectionRequest.getSousSections() != null) {
            for (CreateModeleFormulaireRequest.SectionRequest subSectionRequest : sectionRequest.getSousSections()) {
                createSectionWithSubsections(subSectionRequest, idModele, idSection);
            }
        }
        
        return savedSection;
    }

    @Override
    @Transactional
    public boolean deleteModeleFormulaire(Integer idModele) {
        // Check if the form exists
        ModeleFormulaire modeleFormulaire = modeleFormulaireRepository.findById(idModele)
                .orElseThrow(() -> new com.hdoc.sgdm.exception.ResourceNotFoundException("Formulaire non trouvé avec l'ID: " + idModele));
        
        // Check if the form is used in any submitted form
        boolean isFormUsed = formulairePatientRepository.existsByIdModele(idModele);
        if (isFormUsed) {
            throw new com.hdoc.sgdm.exception.ConflictException("Ce modèle de formulaire est déjà utilisé dans des formulaires soumis et ne peut pas être supprimé.");
        }
        
        // Delete the form model - cascading will handle sections and fields
        modeleFormulaireRepository.delete(modeleFormulaire);
        
        return true;
    }

    @Override
    @Transactional
    public List<SectionFormulaireDTO> updateCompleteFormulaire(UpdateModeleFormulaireRequest request) {
        // 1. Verify the form exists
        Integer idModele = request.getIdModele();
        ModeleFormulaire modeleFormulaire = modeleFormulaireRepository.findById(idModele)
                .orElseThrow(() -> new com.hdoc.sgdm.exception.ResourceNotFoundException("Formulaire non trouvé avec l'ID: " + idModele));
        
        // 2. Check if the form is used in any submitted form
        boolean isFormUsed = formulairePatientRepository.existsByIdModele(idModele);
        if (isFormUsed) {
            throw new com.hdoc.sgdm.exception.ConflictException(
                "Ce modèle de formulaire est déjà utilisé dans des formulaires soumis. " +
                "Les modifications pourraient affecter les données existantes.");
        }
        
        // 3. Update the form model basic properties
        modeleFormulaire.setNom(request.getNom());
        modeleFormulaire.setDescription(request.getDescription());
        modeleFormulaire.setIdSpecialite(request.getIdSpecialite());
        modeleFormulaire.setPrix(request.getPrix() != null ? request.getPrix() : BigDecimal.ZERO);
        modeleFormulaireRepository.save(modeleFormulaire);
        
        // 4. Get existing sections for this form
        List<SectionFormulaire> existingSections = sectionFormulaireRepository.findByIdModeleAndIdParentSectionIsNullOrderByOrdreAffichage(idModele);
        
        // Create a map of existing section IDs
        Map<Integer, SectionFormulaire> existingSectionMap = existingSections.stream()
                .collect(Collectors.toMap(SectionFormulaire::getIdSection, section -> section));
        
        // 5. Process top-level sections
        if (request.getSections() != null) {
            // Track processed section IDs to identify which ones to delete later
            Set<Integer> processedSectionIds = new HashSet<>();
            
            for (UpdateModeleFormulaireRequest.SectionRequest sectionRequest : request.getSections()) {
                SectionFormulaire updatedSection = updateSectionWithSubsections(sectionRequest, idModele, null, processedSectionIds);
            }
            
            // 6. Delete sections that weren't in the update request
            for (SectionFormulaire existingSection : existingSections) {
                if (!processedSectionIds.contains(existingSection.getIdSection())) {
                    sectionFormulaireRepository.delete(existingSection);
                }
            }
        } else {
            // If no sections are provided, delete all existing sections
            for (SectionFormulaire existingSection : existingSections) {
                sectionFormulaireRepository.delete(existingSection);
            }
        }
        
        // 7. Return the full updated structure
        return getStructureFormulaire(idModele);
    }
    
    /**
     * Helper method to recursively update sections with their subsections and fields
     * 
     * @param sectionRequest The section data from the request
     * @param idModele The parent form model ID
     * @param idParentSection The parent section ID (null for top-level sections)
     * @param processedSectionIds Set to track processed section IDs
     * @return The updated or created section
     */
    private SectionFormulaire updateSectionWithSubsections(
            UpdateModeleFormulaireRequest.SectionRequest sectionRequest, 
            Integer idModele,
            Integer idParentSection,
            Set<Integer> processedSectionIds) {
        
        SectionFormulaire section;
        boolean isNewSection = sectionRequest.getIdSection() == null;
        
        if (isNewSection) {
            // Create new section
            section = SectionFormulaire.builder()
                    .idModele(idModele)
                    .idParentSection(idParentSection)
                    .nom(sectionRequest.getNom())
                    .description(sectionRequest.getDescription())
                    .ordreAffichage(sectionRequest.getOrdreAffichage())
                    .build();
        } else {
            // Update existing section
            section = sectionFormulaireRepository.findById(sectionRequest.getIdSection())
                    .orElseThrow(() -> new com.hdoc.sgdm.exception.ResourceNotFoundException(
                            "Section non trouvée avec l'ID: " + sectionRequest.getIdSection()));
            
            // Add to processed set
            processedSectionIds.add(section.getIdSection());
            
            // Update section properties
            section.setNom(sectionRequest.getNom());
            section.setDescription(sectionRequest.getDescription());
            section.setOrdreAffichage(sectionRequest.getOrdreAffichage());
            section.setIdParentSection(idParentSection);
        }
        
        // Save the section
        SectionFormulaire savedSection = sectionFormulaireRepository.save(section);
        Integer idSection = savedSection.getIdSection();
        
        // Process fields for this section
        updateSectionFields(sectionRequest, idSection);
        
        // Process subsections recursively
        if (sectionRequest.getSousSections() != null) {
            // Get existing subsections
            List<SectionFormulaire> existingSubsections = sectionFormulaireRepository
                    .findByIdParentSectionOrderByOrdreAffichage(idSection);
            
            Map<Integer, SectionFormulaire> existingSubsectionMap = existingSubsections.stream()
                    .collect(Collectors.toMap(SectionFormulaire::getIdSection, subsection -> subsection));
            
            // Track processed subsection IDs
            Set<Integer> processedSubsectionIds = new HashSet<>();
            
            for (UpdateModeleFormulaireRequest.SectionRequest subSectionRequest : sectionRequest.getSousSections()) {
                updateSectionWithSubsections(subSectionRequest, idModele, idSection, processedSubsectionIds);
            }
            
            // Delete subsections that weren't in the update request
            for (SectionFormulaire existingSubsection : existingSubsections) {
                if (!processedSubsectionIds.contains(existingSubsection.getIdSection())) {
                    sectionFormulaireRepository.delete(existingSubsection);
                }
            }
        } else {
            // If no subsections are specified, delete all existing subsections
            List<SectionFormulaire> existingSubsections = sectionFormulaireRepository
                    .findByIdParentSectionOrderByOrdreAffichage(idSection);
            
            for (SectionFormulaire existingSubsection : existingSubsections) {
                sectionFormulaireRepository.delete(existingSubsection);
            }
        }
        
        return savedSection;
    }
    
    /**
     * Helper method to update fields within a section
     */
    private void updateSectionFields(UpdateModeleFormulaireRequest.SectionRequest sectionRequest, Integer idSection) {
        // Get existing fields for this section
        List<ChampFormulaire> existingFields = champFormulaireRepository
                .findByIdSectionOrderByOrdreAffichage(idSection);
        
        // Create a map for quick lookup
        Map<Integer, ChampFormulaire> existingFieldMap = existingFields.stream()
                .collect(Collectors.toMap(ChampFormulaire::getIdChamp, field -> field));
        
        // Track processed field IDs
        Set<Integer> processedFieldIds = new HashSet<>();
        
        // Process fields from the request
        if (sectionRequest.getChamps() != null) {
            for (UpdateModeleFormulaireRequest.ChampRequest champRequest : sectionRequest.getChamps()) {
                ChampFormulaire champ;
                boolean isNewField = champRequest.getIdChamp() == null;
                
                if (isNewField) {
                    // Create new field
                    champ = ChampFormulaire.builder()
                            .idSection(idSection)
                            .nom(champRequest.getNom())
                            .estObligatoire(champRequest.getEstObligatoire() != null ? champRequest.getEstObligatoire() : false)
                            .typeChamp(champRequest.getTypeChamp())
                            .placeholder(champRequest.getPlaceholder())
                            .ordreAffichage(champRequest.getOrdreAffichage())
                            .valeursPossibles(champRequest.getValeursPossibles())
                            .unite(champRequest.getUnite())
                            .build();
                } else {
                    // Update existing field
                    champ = existingFieldMap.get(champRequest.getIdChamp());
                    if (champ == null) {
                        throw new com.hdoc.sgdm.exception.ResourceNotFoundException(
                                "Champ non trouvé avec l'ID: " + champRequest.getIdChamp());
                    }
                    
                    // Add to processed set
                    processedFieldIds.add(champ.getIdChamp());
                    
                    // Update field properties
                    champ.setNom(champRequest.getNom());
                    champ.setEstObligatoire(champRequest.getEstObligatoire() != null ? champRequest.getEstObligatoire() : false);
                    champ.setTypeChamp(champRequest.getTypeChamp());
                    champ.setPlaceholder(champRequest.getPlaceholder());
                    champ.setOrdreAffichage(champRequest.getOrdreAffichage());
                    champ.setValeursPossibles(champRequest.getValeursPossibles());
                    champ.setUnite(champRequest.getUnite());
                }
                
                champFormulaireRepository.save(champ);
            }
        }
        
        // Delete fields that weren't in the update request
        for (ChampFormulaire existingField : existingFields) {
            if (!processedFieldIds.contains(existingField.getIdChamp())) {
                champFormulaireRepository.delete(existingField);
            }
        }
    }
} 