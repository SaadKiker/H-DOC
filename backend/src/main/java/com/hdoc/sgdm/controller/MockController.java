package com.hdoc.sgdm.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * This controller provides mock endpoints for debugging and development purposes.
 * It should be used only when the real endpoints are not working properly.
 */
@RestController
@RequestMapping("/api/mock")
public class MockController {

    /**
     * Mock endpoint to return a doctor with their specialty
     */
    @GetMapping("/medecins/{idMedecin}")
    public ResponseEntity<Map<String, Object>> getMockMedecin(@PathVariable UUID idMedecin) {
        Map<String, Object> mockDoctor = new HashMap<>();
        mockDoctor.put("idMedecin", idMedecin);
        mockDoctor.put("idSpecialite", 1);  // Use an existing specialty ID
        mockDoctor.put("nomSpecialite", "Médecine Générale");
        mockDoctor.put("nom", "Mock");
        mockDoctor.put("prenom", "Doctor");
        mockDoctor.put("status", "DISPONIBLE");
        
        return ResponseEntity.ok(mockDoctor);
    }

    /**
     * Mock endpoint to return form templates for a specialty
     */
    @GetMapping("/formulaires/modeles/specialite/{idSpecialite}")
    public ResponseEntity<List<Map<String, Object>>> getMockFormTemplates(@PathVariable Integer idSpecialite) {
        List<Map<String, Object>> mockTemplates = new ArrayList<>();
        
        // First template
        Map<String, Object> template1 = new HashMap<>();
        template1.put("idModele", 1);
        template1.put("nom", "Examen général");
        template1.put("description", "Formulaire d'examen général pour tous patients");
        template1.put("idSpecialite", idSpecialite);
        template1.put("nomSpecialite", "Médecine Générale");
        
        // Second template
        Map<String, Object> template2 = new HashMap<>();
        template2.put("idModele", 2);
        template2.put("nom", "Suivi cardiologique");
        template2.put("description", "Formulaire pour le suivi des patients cardiaques");
        template2.put("idSpecialite", idSpecialite);
        template2.put("nomSpecialite", "Médecine Générale");
        
        mockTemplates.add(template1);
        mockTemplates.add(template2);
        
        return ResponseEntity.ok(mockTemplates);
    }

    /**
     * Mock endpoint to return the structure of a form template
     */
    @GetMapping("/formulaires/modeles/{idModele}/structure")
    public ResponseEntity<List<Map<String, Object>>> getMockFormStructure(@PathVariable Integer idModele) {
        List<Map<String, Object>> rootSections = new ArrayList<>();
        
        // First section (Vital Signs)
        Map<String, Object> section1 = new HashMap<>();
        section1.put("idSection", 1);
        section1.put("idModele", idModele);
        section1.put("nom", "Signes vitaux");
        section1.put("description", "Mesures des signes vitaux du patient");
        section1.put("ordreAffichage", 1);
        section1.put("idParentSection", null);
        
        // Fields for first section
        List<Map<String, Object>> fieldsSection1 = new ArrayList<>();
        
        Map<String, Object> field1 = new HashMap<>();
        field1.put("idChamp", 1);
        field1.put("idSection", 1);
        field1.put("nom", "Tension artérielle");
        field1.put("estObligatoire", true);
        field1.put("typeChamp", "text");
        field1.put("placeholder", "ex: 120/80");
        field1.put("ordreAffichage", 1);
        field1.put("valeursPossibles", null);
        field1.put("unite", "mmHg");
        
        Map<String, Object> field2 = new HashMap<>();
        field2.put("idChamp", 2);
        field2.put("idSection", 1);
        field2.put("nom", "Température");
        field2.put("estObligatoire", true);
        field2.put("typeChamp", "number");
        field2.put("placeholder", "ex: 37.0");
        field2.put("ordreAffichage", 2);
        field2.put("valeursPossibles", null);
        field2.put("unite", "°C");
        
        fieldsSection1.add(field1);
        fieldsSection1.add(field2);
        
        section1.put("champs", fieldsSection1);
        section1.put("sousSections", new ArrayList<>());
        
        // Second section (Medical History)
        Map<String, Object> section2 = new HashMap<>();
        section2.put("idSection", 2);
        section2.put("idModele", idModele);
        section2.put("nom", "Antécédents médicaux");
        section2.put("description", "Antécédents du patient");
        section2.put("ordreAffichage", 2);
        section2.put("idParentSection", null);
        section2.put("champs", new ArrayList<>());
        
        // Subsection for section 2
        List<Map<String, Object>> subSections = new ArrayList<>();
        Map<String, Object> subSection = new HashMap<>();
        subSection.put("idSection", 3);
        subSection.put("idModele", idModele);
        subSection.put("nom", "Antécédents familiaux");
        subSection.put("description", "Conditions médicales familiales");
        subSection.put("ordreAffichage", 1);
        subSection.put("idParentSection", 2);
        subSection.put("sousSections", new ArrayList<>());
        
        // Field for subsection
        List<Map<String, Object>> fieldsSubSection = new ArrayList<>();
        Map<String, Object> subField = new HashMap<>();
        subField.put("idChamp", 3);
        subField.put("idSection", 3);
        subField.put("nom", "Antécédents familiaux de maladies cardiaques");
        subField.put("estObligatoire", false);
        subField.put("typeChamp", "select");
        subField.put("placeholder", "Sélectionnez oui ou non");
        subField.put("ordreAffichage", 1);
        subField.put("valeursPossibles", "Oui,Non,Je ne sais pas");
        subField.put("unite", null);
        
        fieldsSubSection.add(subField);
        subSection.put("champs", fieldsSubSection);
        
        subSections.add(subSection);
        section2.put("sousSections", subSections);
        
        rootSections.add(section1);
        rootSections.add(section2);
        
        return ResponseEntity.ok(rootSections);
    }
} 