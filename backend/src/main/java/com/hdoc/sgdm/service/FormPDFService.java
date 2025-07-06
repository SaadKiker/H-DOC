package com.hdoc.sgdm.service;

import com.hdoc.sgdm.dto.FormulairePatientDTO;
import com.hdoc.sgdm.dto.ReponseFormulaireDTO;
import com.hdoc.sgdm.entity.ModeleFormulaire;
import com.hdoc.sgdm.entity.Patient;
import com.hdoc.sgdm.entity.ChampFormulaire;
import com.hdoc.sgdm.exception.ResourceNotFoundException;
import com.hdoc.sgdm.repository.ModeleFormulaireRepository;
import com.hdoc.sgdm.repository.PatientRepository;
import com.hdoc.sgdm.repository.ChampFormulaireRepository;
import lombok.RequiredArgsConstructor;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class FormPDFService {
    private static final Logger logger = LoggerFactory.getLogger(FormPDFService.class);
    
    private final PDFGeneratorService pdfGeneratorService;
    private final PatientRepository patientRepository;
    private final ModeleFormulaireRepository modeleFormulaireRepository;
    private final FormulaireMedicalService formulaireMedicalService;
    private final ChampFormulaireRepository champFormulaireRepository;
    
    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build();
    
    @Value("${supabase.url}")
    private String supabaseUrl;
    
    @Value("${supabase.service-role-key}")
    private String serviceRoleKey;
    
    /**
     * Generates a PDF from a filled form and uploads it to Supabase Storage
     * 
     * @param formulaire The form data to convert to PDF
     * @return Response map with success status and PDF URL
     */
    public Map<String, Object> generateAndUploadPDF(FormulairePatientDTO formulaire) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Validate input data
            if (formulaire == null) {
                throw new IllegalArgumentException("Form data is null");
            }
            
            if (formulaire.getIdFormulaire() == null) {
                throw new IllegalArgumentException("Form ID is null");
            }
            
            // Log form data being processed
            logger.info("Starting PDF generation for form ID: {}, patient: {}, model: {}",
                    formulaire.getIdFormulaire(), formulaire.getNomPatient(), formulaire.getNomModele());
            
            // Always reload the form data to ensure we have complete data with all relationships loaded
            try {
                FormulairePatientDTO completeFormulaire = formulaireMedicalService.getFormulairePatient(formulaire.getIdFormulaire());
                if (completeFormulaire != null) {
                    formulaire = completeFormulaire;
                    logger.info("Successfully reloaded complete form data with {} responses", 
                        formulaire.getReponses() != null ? formulaire.getReponses().size() : 0);
                } else {
                    logger.warn("Failed to reload complete form data - continuing with original data");
                }
            } catch (Exception e) {
                logger.error("Error reloading form data", e);
                // Continue with original data
            }
            
            // ENHANCEMENT: Direct database check for fields if responses exist but field names are missing
            boolean shouldEnhanceFormData = false;
            
            if (formulaire.getReponses() != null && !formulaire.getReponses().isEmpty()) {
                // Check if field names are missing
                int missingFieldNames = 0;
                for (ReponseFormulaireDTO resp : formulaire.getReponses()) {
                    if (resp.getNomChamp() == null || resp.getNomChamp().isEmpty()) {
                        missingFieldNames++;
                    }
                }
                
                if (missingFieldNames > 0) {
                    logger.warn("Found {} responses with missing field names", missingFieldNames);
                    shouldEnhanceFormData = true;
                }
            }
            
            // Proactively fix missing field names
            if (shouldEnhanceFormData && formulaire.getReponses() != null) {
                logger.info("Enhancing form data with missing field names");
                enhanceFormDataWithFieldNames(formulaire);
            }
            
            // Get patient and model information for filename generation
            Optional<Patient> patientOpt = patientRepository.findByIdPatient(formulaire.getIdPatient());
            Optional<ModeleFormulaire> modeleOpt = modeleFormulaireRepository.findById(formulaire.getIdModele());
            
            if (patientOpt.isEmpty() || modeleOpt.isEmpty()) {
                throw new ResourceNotFoundException("Could not find patient or form model information");
            }
            
            Patient patient = patientOpt.get();
            ModeleFormulaire modele = modeleOpt.get();
            
            // Generate PDF
            try {
                byte[] pdfData = pdfGeneratorService.generatePDF(formulaire);
                logger.info("PDF generated successfully, size: {} bytes", pdfData.length);
                
                // Generate filename
                String patientName = patient.getNom() + "_" + patient.getPrenom();
                String modeleName = modele.getNom();
                String filename = pdfGeneratorService.generateFilename(patientName, modeleName);
                logger.info("Generated filename: {}", filename);
                
                // Upload to Supabase
                try {
                    String pdfUrl = uploadPDFToSupabase(pdfData, filename);
                    logger.info("PDF uploaded successfully to: {}", pdfUrl);
                    
                    // Prepare successful response
                    response.put("success", true);
                    response.put("pdfUrl", pdfUrl);
                } catch (IOException e) {
                    logger.error("Error uploading PDF to Supabase", e);
                    response.put("success", false);
                    response.put("error", "Error uploading PDF to Supabase: " + e.getMessage());
                }
            } catch (IOException e) {
                logger.error("Error generating PDF", e);
                response.put("success", false);
                response.put("error", "Error generating PDF: " + e.getMessage());
            }
            
            return response;
        } catch (Exception e) {
            logger.error("Error in PDF generation process", e);
            
            // Prepare error response
            response.put("success", false);
            response.put("error", e.getMessage());
            
            return response;
        }
    }
    
    /**
     * Uploads a PDF file to Supabase Storage
     * 
     * @param pdfData The PDF content as byte array
     * @param filename The filename to use
     * @return The public URL to access the file
     */
    private String uploadPDFToSupabase(byte[] pdfData, String filename) throws IOException {
        // Bucket name in Supabase Storage
        String bucketName = "forms";
        
        // Create URLs
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + filename;
        String publicUrl = supabaseUrl + "/storage/v1/object/public/" + bucketName + "/" + filename;
        
        // Build request body with PDF data
        RequestBody requestBody = RequestBody.create(pdfData, MediaType.parse("application/pdf"));
        
        // Build the request
        Request request = new Request.Builder()
                .url(uploadUrl)
                .put(requestBody)
                .addHeader("Authorization", "Bearer " + serviceRoleKey)
                .addHeader("Content-Type", "application/pdf")
                .addHeader("x-upsert", "true") // Overwrite if exists
                .build();
        
        // Execute the request
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "Unknown error";
                throw new IOException("Failed to upload PDF to Supabase: " + response.code() + " - " + errorBody);
            }
            
            return publicUrl;
        }
    }
    
    /**
     * Enhances form data with field names from the database
     * This is called when we detect missing field names
     * 
     * @param formulaire The form data to enhance
     */
    private void enhanceFormDataWithFieldNames(FormulairePatientDTO formulaire) {
        if (formulaire.getReponses() == null || formulaire.getReponses().isEmpty()) {
            return;
        }
        
        // Get all field IDs that need names
        Map<Integer, ReponseFormulaireDTO> responsesByFieldId = new HashMap<>();
        List<Integer> fieldIdsToLookup = new ArrayList<>();
        
        // Print all responses to debug
        logger.info("DEBUG - All form responses:");
        for (ReponseFormulaireDTO resp : formulaire.getReponses()) {
            logger.info("Field ID: {}, Name: {}, Value: {}", 
                resp.getIdChamp(), resp.getNomChamp(), resp.getValeur());
            
            // Check if we need to look up the name
            if (resp.getNomChamp() == null || resp.getNomChamp().isEmpty()) {
                responsesByFieldId.put(resp.getIdChamp(), resp);
                fieldIdsToLookup.add(resp.getIdChamp());
            }
            
            // Check if the value is the same as what should be the field name
            // This handles the case where field names and values got switched
            if (resp.getValeur() != null) {
                String expectedFieldName = getExpectedFieldName(resp.getIdChamp());
                if (resp.getValeur().equals(expectedFieldName)) {
                    logger.warn("Field value matches expected field name for ID {}: {}", 
                              resp.getIdChamp(), expectedFieldName);
                    // In this case, we need to update both field name and value
                }
            }
        }
        
        if (fieldIdsToLookup.isEmpty()) {
            return;
        }
        
        logger.info("Attempting to find field names for {} fields", responsesByFieldId.size());
        
        // Try bulk lookup from database
        try {
            List<ChampFormulaire> fields = champFormulaireRepository.findAllByIds(fieldIdsToLookup);
            Map<Integer, String> fieldNamesFromDb = new HashMap<>();
            
            for (ChampFormulaire field : fields) {
                fieldNamesFromDb.put(field.getIdChamp(), field.getNom());
                logger.info("Found field name in DB: ID {} = {}", field.getIdChamp(), field.getNom());
            }
            
            // Now update the responses with found names
            for (Integer fieldId : responsesByFieldId.keySet()) {
                ReponseFormulaireDTO resp = responsesByFieldId.get(fieldId);
                if (fieldNamesFromDb.containsKey(fieldId)) {
                    resp.setNomChamp(fieldNamesFromDb.get(fieldId));
                } else {
                    // Use fallback name if not found in DB
                    resp.setNomChamp(getExpectedFieldName(fieldId));
                }
            }
        } catch (Exception e) {
            logger.error("Error looking up field names from database: {}", e.getMessage());
            // Fall back to individual lookups and known field names
            fallbackFieldNameEnhancement(responsesByFieldId);
        }
    }
    
    /**
     * Get expected field name for common field IDs
     */
    private String getExpectedFieldName(Integer fieldId) {
        Map<Integer, String> knownFieldNames = new HashMap<>();
        knownFieldNames.put(146, "Scolarité");
        knownFieldNames.put(149, "Nombre d'années");
        knownFieldNames.put(151, "Type");
        knownFieldNames.put(153, "État");
        knownFieldNames.put(155, "Date");
        knownFieldNames.put(156, "Signature");
        
        return knownFieldNames.getOrDefault(fieldId, "Champ " + fieldId);
    }
    
    /**
     * Fallback method for enhancing field names one by one
     */
    private void fallbackFieldNameEnhancement(Map<Integer, ReponseFormulaireDTO> responsesByFieldId) {
        // Define known field names for common field IDs (backup for those in the screenshot)
        Map<Integer, String> knownFieldNames = new HashMap<>();
        knownFieldNames.put(146, "Scolarité");
        knownFieldNames.put(149, "Nombre d'années");
        knownFieldNames.put(151, "Type");
        knownFieldNames.put(153, "État");
        knownFieldNames.put(155, "Date");
        knownFieldNames.put(156, "Signature");
        
        // Try to find names from database first
        for (Integer fieldId : responsesByFieldId.keySet()) {
            Optional<ChampFormulaire> champOpt = champFormulaireRepository.findById(fieldId);
            if (champOpt.isPresent()) {
                String fieldName = champOpt.get().getNom();
                responsesByFieldId.get(fieldId).setNomChamp(fieldName);
                logger.info("Found field name for ID {}: {}", fieldId, fieldName);
            } else if (knownFieldNames.containsKey(fieldId)) {
                // Fallback to known field names
                String fieldName = knownFieldNames.get(fieldId);
                responsesByFieldId.get(fieldId).setNomChamp(fieldName);
                logger.info("Using known field name for ID {}: {}", fieldId, fieldName);
            } else {
                logger.warn("Could not find field name for ID {}", fieldId);
            }
        }
    }
} 