package com.hdoc.sgdm.controller;

import com.hdoc.sgdm.dto.*;
import com.hdoc.sgdm.service.FormulaireMedicalService;
import com.hdoc.sgdm.service.FormPDFService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/formulaires")
@RequiredArgsConstructor
public class FormulaireMedicalController {

    private final FormulaireMedicalService formulaireMedicalService;
    private final FormPDFService formPDFService;
    
    /**
     * Get all form templates for a specialty
     */
    @GetMapping("/modeles/specialite/{idSpecialite}")
    public ResponseEntity<?> getModelesBySpecialite(@PathVariable Integer idSpecialite) {
        try {
            List<ModeleFormulaireDTO> modeles = formulaireMedicalService.getModeleFormulairesBySpecialite(idSpecialite);
            return ResponseEntity.ok(modeles);
        } catch (Exception e) {
            // Log the exception
            e.printStackTrace();
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Erreur lors de la récupération des modèles de formulaires: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Get the complete structure of a form model
     */
    @GetMapping("/modeles/{idModele}/structure")
    public ResponseEntity<?> getStructureFormulaire(@PathVariable Integer idModele) {
        try {
            List<SectionFormulaireDTO> structure = formulaireMedicalService.getStructureFormulaire(idModele);
            return ResponseEntity.ok(structure);
        } catch (Exception e) {
            // Log the exception
            e.printStackTrace();
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Erreur lors de la récupération de la structure du formulaire: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Submit a filled form
     */
    @PostMapping
    public ResponseEntity<?> soumettreFormulaire(@RequestBody FormulaireRequest request) {
        try {
            FormulairePatientDTO formulaire = formulaireMedicalService.soumettreFormulaire(request);
            return ResponseEntity.ok(formulaire);
        } catch (IllegalArgumentException e) {
            // Log the exception
            e.printStackTrace();
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Données invalides: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            // Log the exception
            e.printStackTrace();
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Erreur lors de la soumission du formulaire: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Submit a filled form and generate PDF
     */
    @PostMapping("/generate-pdf")
    public ResponseEntity<?> submitFormAndGeneratePDF(@RequestBody FormulaireRequest request) {
        try {
            // Log incoming request
            System.out.println("PDF Generation Request received: " + request);
            System.out.println("Request patient ID: " + request.getIdPatient());
            System.out.println("Request model ID: " + request.getIdModele());
            System.out.println("Request doctor ID: " + request.getIdMedecin());
            System.out.println("Request responses count: " + (request.getReponses() != null ? request.getReponses().size() : "null"));
            
            // First save the form normally
            FormulairePatientDTO formulaire = formulaireMedicalService.soumettreFormulaire(request);
            System.out.println("Form saved with ID: " + formulaire.getIdFormulaire());
            System.out.println("Saved form has responses: " + (formulaire.getReponses() != null ? formulaire.getReponses().size() : "null"));
            
            // Ensure we have the complete form data with all responses
            if (formulaire.getIdFormulaire() != null) {
                // Reload the complete form data to ensure all relationships are properly loaded
                FormulairePatientDTO completeFormulaire = formulaireMedicalService.getFormulairePatient(formulaire.getIdFormulaire());
                if (completeFormulaire != null) {
                    formulaire = completeFormulaire;
                    System.out.println("Reloaded form has responses: " + (formulaire.getReponses() != null ? formulaire.getReponses().size() : "null"));
                } else {
                    System.out.println("Failed to reload form data");
                }
            }
            
            // Then generate and upload PDF
            Map<String, Object> result = formPDFService.generateAndUploadPDF(formulaire);
            
            // Add form data to the response
            result.put("formulaire", formulaire);
            
            if ((boolean) result.get("success")) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
            }
        } catch (IllegalArgumentException e) {
            // Log the exception
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Données invalides: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            // Log the exception
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur lors de la génération du PDF: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Get all forms for a patient, filtered by doctor's access if a doctor ID is provided
     */
    @GetMapping("/patient/{idPatient}")
    public ResponseEntity<?> getFormulairesPatient(
            @PathVariable UUID idPatient,
            @RequestParam(required = false) UUID idMedecin) {
        
        try {
            List<FormulairePatientDTO> formulaires;
            
            if (idMedecin != null) {
                // If doctor ID is provided, filter forms by doctor's access
                formulaires = formulaireMedicalService.getFormulairesPatientForMedecin(idPatient, idMedecin);
            } else {
                // Otherwise, return all forms for the patient (admin access)
                formulaires = formulaireMedicalService.getFormulairesPatient(idPatient);
            }
            
            return ResponseEntity.ok(formulaires);
        } catch (Exception e) {
            // Log the exception
            e.printStackTrace();
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Erreur lors de la récupération des formulaires du patient: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Get all forms for a visit
     */
    @GetMapping("/visite/{idVisite}")
    public ResponseEntity<?> getFormulairesVisite(@PathVariable Integer idVisite) {
        try {
            List<FormulairePatientDTO> formulaires = formulaireMedicalService.getFormulairesVisite(idVisite);
            return ResponseEntity.ok(formulaires);
        } catch (Exception e) {
            // Log the exception
            e.printStackTrace();
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Erreur lors de la récupération des formulaires de la visite: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Get a specific form with all responses, with optional doctor access check
     */
    @GetMapping("/{idFormulaire}")
    public ResponseEntity<?> getFormulairePatient(
            @PathVariable Integer idFormulaire,
            @RequestParam(required = false) UUID idMedecin) {
        
        try {
            // If doctor ID is provided, check access
            if (idMedecin != null) {
                boolean hasAccess = formulaireMedicalService.canMedecinAccessFormulaire(idMedecin, idFormulaire);
                if (!hasAccess) {
                    Map<String, String> errorResponse = new HashMap<>();
                    errorResponse.put("status", "error");
                    errorResponse.put("message", "Accès refusé: ce médecin n'a pas accès à ce formulaire");
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
                }
            }
            
            FormulairePatientDTO formulaire = formulaireMedicalService.getFormulairePatient(idFormulaire);
            if (formulaire == null) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("status", "error");
                errorResponse.put("message", "Formulaire non trouvé avec l'ID: " + idFormulaire);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
            
            // Log field names to help debug
            if (formulaire.getReponses() != null) {
                System.out.println("Retrieved form " + idFormulaire + " with " + formulaire.getReponses().size() + " responses");
                int missingNames = 0;
                
                for (ReponseFormulaireDTO response : formulaire.getReponses()) {
                    if (response.getNomChamp() == null || response.getNomChamp().isEmpty()) {
                        missingNames++;
                        System.out.println("Field ID " + response.getIdChamp() + " is missing field name");
                    } else {
                        System.out.println("Field ID " + response.getIdChamp() + ": " + response.getNomChamp() + " = " + response.getValeur());
                    }
                }
                
                if (missingNames > 0) {
                    System.out.println("WARNING: " + missingNames + " fields are missing field names");
                }
            }
            
            return ResponseEntity.ok(formulaire);
        } catch (Exception e) {
            // Log the exception
            e.printStackTrace();
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Erreur lors de la récupération du formulaire: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Get all forms submitted by a specific doctor
     */
    @GetMapping("/medecin/{idMedecin}")
    public ResponseEntity<?> getFormulaireMedecin(@PathVariable UUID idMedecin) {
        try {
            List<FormulairePatientDTO> formulaires = formulaireMedicalService.getFormulaireMedecin(idMedecin);
            return ResponseEntity.ok(formulaires);
        } catch (Exception e) {
            // Log the exception
            e.printStackTrace();
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Erreur lors de la récupération des formulaires du médecin: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Create a new form template
     */
    @PostMapping("/modeles")
    public ResponseEntity<?> createModeleFormulaire(@RequestBody ModeleFormulaireRequest request) {
        try {
            ModeleFormulaireDTO modele = formulaireMedicalService.createModeleFormulaire(request);
            return ResponseEntity.ok(modele);
        } catch (Exception e) {
            // Log the exception
            e.printStackTrace();
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Erreur lors de la création du modèle de formulaire: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Update an existing form template
     */
    @PutMapping("/modeles/{idModele}")
    public ResponseEntity<?> updateModeleFormulaire(@PathVariable Integer idModele, @RequestBody ModeleFormulaireRequest request) {
        try {
            ModeleFormulaireDTO modele = formulaireMedicalService.updateModeleFormulaire(idModele, request);
            return ResponseEntity.ok(modele);
        } catch (IllegalArgumentException e) {
            // Log the exception
            e.printStackTrace();
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Données invalides: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            // Log the exception
            e.printStackTrace();
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Erreur lors de la mise à jour du modèle de formulaire: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Create a complete form template with sections and fields
     */
    @PostMapping("/modeles/complet")
    public ResponseEntity<?> createCompleteFormulaire(@RequestBody CreateModeleFormulaireRequest request) {
        try {
            List<SectionFormulaireDTO> structure = formulaireMedicalService.createCompleteFormulaire(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(structure);
        } catch (IllegalArgumentException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Données invalides: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            e.printStackTrace();
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Erreur lors de la création du formulaire: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Delete a form template and all associated sections and fields
     */
    @DeleteMapping("/modeles/{idModele}")
    public ResponseEntity<?> deleteModeleFormulaire(@PathVariable Integer idModele) {
        try {
            formulaireMedicalService.deleteModeleFormulaire(idModele);
            
            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Modèle de formulaire supprimé avec succès");
            
            return ResponseEntity.ok(response);
        } catch (com.hdoc.sgdm.exception.ResourceNotFoundException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (com.hdoc.sgdm.exception.ConflictException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
        } catch (Exception e) {
            e.printStackTrace();
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Erreur lors de la suppression du formulaire: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Update a complete form template with sections and fields
     */
    @PutMapping("/modeles/complet")
    public ResponseEntity<?> updateCompleteFormulaire(@RequestBody UpdateModeleFormulaireRequest request) {
        try {
            List<SectionFormulaireDTO> structure = formulaireMedicalService.updateCompleteFormulaire(request);
            return ResponseEntity.ok(structure);
        } catch (com.hdoc.sgdm.exception.ResourceNotFoundException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (com.hdoc.sgdm.exception.ConflictException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
        } catch (Exception e) {
            e.printStackTrace();
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Erreur lors de la mise à jour du formulaire: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
} 