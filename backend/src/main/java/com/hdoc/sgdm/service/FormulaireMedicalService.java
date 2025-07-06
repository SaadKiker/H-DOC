package com.hdoc.sgdm.service;

import com.hdoc.sgdm.dto.*;
import java.util.List;
import java.util.UUID;

public interface FormulaireMedicalService {
    
    /**
     * Create a complete form model with sections and fields
     * @param request The form model data with sections and fields
     * @return The created form model structure with all relationships
     */
    List<SectionFormulaireDTO> createCompleteFormulaire(CreateModeleFormulaireRequest request);
    
    /**
     * Get all form templates available for a specific specialty
     * @param idSpecialite The specialty ID
     * @return List of form templates
     */
    List<ModeleFormulaireDTO> getModeleFormulairesBySpecialite(Integer idSpecialite);
    
    /**
     * Get the full structure of a form template including sections and fields
     * @param idModele The form template ID
     * @return The template with its section and field structure
     */
    List<SectionFormulaireDTO> getStructureFormulaire(Integer idModele);
    
    /**
     * Submit a new filled form
     * @param request The form data with responses
     * @return The saved form data
     */
    FormulairePatientDTO soumettreFormulaire(FormulaireRequest request);
    
    /**
     * Get all submitted forms for a patient
     * @param idPatient The patient ID
     * @return List of submitted forms
     */
    List<FormulairePatientDTO> getFormulairesPatient(UUID idPatient);
    
    /**
     * Get forms for a patient filtered by the medecin's access
     * @param idPatient The patient ID
     * @param idMedecin The doctor ID
     * @return List of forms that the doctor has access to
     */
    List<FormulairePatientDTO> getFormulairesPatientForMedecin(UUID idPatient, UUID idMedecin);
    
    /**
     * Get submitted forms for a specific visit
     * @param idVisite The visit ID
     * @return List of submitted forms for the visit
     */
    List<FormulairePatientDTO> getFormulairesVisite(Integer idVisite);
    
    /**
     * Get a specific submitted form with all its responses
     * @param idFormulaire The form ID
     * @return The form with all responses
     */
    FormulairePatientDTO getFormulairePatient(Integer idFormulaire);
    
    /**
     * Create a new form template
     * @param request The form template data
     * @return The created form template
     */
    ModeleFormulaireDTO createModeleFormulaire(ModeleFormulaireRequest request);
    
    /**
     * Update an existing form template
     * @param idModele The form template ID
     * @param request The form template data
     * @return The updated form template
     */
    ModeleFormulaireDTO updateModeleFormulaire(Integer idModele, ModeleFormulaireRequest request);
    
    /**
     * Update a complete form template with its sections and fields
     * @param request The form update request containing all new and existing data
     * @return The complete updated form structure
     */
    List<SectionFormulaireDTO> updateCompleteFormulaire(UpdateModeleFormulaireRequest request);
    
    /**
     * Check if a medecin can access a specific form
     * @param idMedecin The doctor ID
     * @param idFormulaire The form ID
     * @return true if the doctor has access to the form
     */
    boolean canMedecinAccessFormulaire(UUID idMedecin, Integer idFormulaire);
    
    /**
     * Get all forms submitted by a specific doctor
     * @param idMedecin The doctor ID
     * @return List of forms submitted by the doctor
     */
    List<FormulairePatientDTO> getFormulaireMedecin(UUID idMedecin);
    
    /**
     * Delete a form model and all its associated sections and fields
     * @param idModele The form model ID to delete
     * @return true if deleted successfully, throws exception otherwise
     * @throws com.hdoc.sgdm.exception.ResourceNotFoundException if the form doesn't exist
     */
    boolean deleteModeleFormulaire(Integer idModele);
} 