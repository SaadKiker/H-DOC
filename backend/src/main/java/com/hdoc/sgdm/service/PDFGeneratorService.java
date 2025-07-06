package com.hdoc.sgdm.service;

import com.hdoc.sgdm.dto.FormulairePatientDTO;
import com.hdoc.sgdm.dto.ReponseFormulaireDTO;
import com.hdoc.sgdm.entity.ModeleFormulaire;
import com.hdoc.sgdm.entity.Patient;
import com.hdoc.sgdm.entity.Medecin;
import com.hdoc.sgdm.entity.ChampFormulaire;
import com.hdoc.sgdm.repository.ModeleFormulaireRepository;
import com.hdoc.sgdm.repository.PatientRepository;
import com.hdoc.sgdm.repository.MedecinRepository;
import com.hdoc.sgdm.repository.ChampFormulaireRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.lowagie.text.Image;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;
import java.util.Arrays;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class PDFGeneratorService {
    private static final Logger logger = LoggerFactory.getLogger(PDFGeneratorService.class);
    
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final ModeleFormulaireRepository modeleFormulaireRepository;
    private final ChampFormulaireRepository champFormulaireRepository;

    /**
     * Generates a PDF document from form data
     * 
     * @param formulaire The form data to convert to PDF
     * @return The generated PDF as a byte array
     */
    public byte[] generatePDF(FormulairePatientDTO formulaire) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        try {
            // Retrieve patient, doctor, and form model information
            Optional<Patient> patientOpt = patientRepository.findByIdPatient(formulaire.getIdPatient());
            Optional<Medecin> medecinOpt = medecinRepository.findByIdWithUtilisateur(formulaire.getIdMedecin());
            Optional<ModeleFormulaire> modeleOpt = modeleFormulaireRepository.findById(formulaire.getIdModele());
            
            if (patientOpt.isEmpty() || medecinOpt.isEmpty() || modeleOpt.isEmpty()) {
                throw new IOException("Could not retrieve all required information for PDF generation");
            }
            
            Patient patient = patientOpt.get();
            Medecin medecin = medecinOpt.get();
            ModeleFormulaire modele = modeleOpt.get();
            
            // Create PDF document
            Document document = new Document(PageSize.A4);
            // Set smaller margins to fit content on a single page
            document.setMargins(36, 36, 36, 36); // left, right, top, bottom (in points)
            PdfWriter pdfWriter = PdfWriter.getInstance(document, baos);
            document.open();
            
            // Add logo to the top-left corner
            addLogo(document);
            
            // Add document header with hospital/clinic information
            addHeader(document);
            
            // Add form title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, Font.BOLD);
            
            // Use the standard title for certificates or the model name for other forms
            String titleText = "FICHE DE CERTIFICAT MÉDICAL";
            if (!modele.getNom().toLowerCase().contains("certificat")) {
                titleText = modele.getNom().toUpperCase();
            }
            
            Paragraph title = new Paragraph(titleText, titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(15);
            document.add(title);
            
            // Add patient information
            addPatientInfo(document, patient);
            
            // Add form content with responses
            addFormContent(document, formulaire);
            
            // Add flexible space to push doctor section and footer to the bottom
            addFlexibleSpace(document);
            
            // Add doctor and date section right above the footer
            addDoctorSection(document, medecin, formulaire.getDateRemplissage());
            
            // Add the footer with hospital contact information
            addFooter(document);
            
            document.close();
            
            return baos.toByteArray();
        } catch (DocumentException e) {
            logger.error("Error generating PDF document", e);
            throw new IOException("Error generating PDF document: " + e.getMessage(), e);
        } finally {
            baos.close();
        }
    }
    
    /**
     * Add logo to the PDF document
     */
    private void addLogo(Document document) throws DocumentException {
        try {
            // Path to the logo
            String logoPath = "/logo.jpg";
            
            // Load the image
            Image logo = Image.getInstance(getClass().getResource(logoPath));
            
            // Scale the image to an appropriate size (adjust as needed)
            logo.scaleToFit(100, 50);
            
            // Position the logo at the top-left
            logo.setAbsolutePosition(36, document.getPageSize().getHeight() - 50 - 36);
            
            // Add the logo to the document
            document.add(logo);
            
            // Add more space after the logo
            document.add(new Paragraph(" "));
            document.add(new Paragraph(" "));
            document.add(new Paragraph(" "));
            document.add(new Paragraph(" "));
            document.add(new Paragraph(" "));
        } catch (Exception e) {
            logger.error("Error adding logo to PDF", e);
        }
    }
    
    private void addHeader(Document document) throws DocumentException {
        // Header is now empty - no line separator needed
    }
    
    private void addPatientInfo(Document document, Patient patient) throws DocumentException {
        Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
        Paragraph patientSection = new Paragraph("INFORMATIONS PATIENT", sectionFont);
        patientSection.setSpacingBefore(5);
        patientSection.setSpacingAfter(5);
        document.add(patientSection);
        
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingAfter(5);
        
        // Only show specified fields with increased spacing for readability
        addTableRowWithSpacing(table, "Nom:", patient.getNom());
        addTableRowWithSpacing(table, "Prénom:", patient.getPrenom());
        addTableRowWithSpacing(table, "Date de Naissance:", formatDate(patient.getDateNaissance()));
        addTableRowWithSpacing(table, "Lieu de Naissance:", patient.getLieuNaissance());
        
        document.add(table);
        
        // Add a line separator using a horizontal line
        Paragraph line = new Paragraph();
        line.add(new Chunk(new com.lowagie.text.pdf.draw.LineSeparator()));
        line.setSpacingBefore(10);
        line.setSpacingAfter(10);
        document.add(line);
    }
    
    /**
     * Adds a table row with additional spacing for better readability
     * If the field is a number type and has a unit, it will be displayed next to the value
     */
    private void addTableRowWithSpacing(PdfPTable table, String label, String value, String typeChamp, String unite) {
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
        Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
        
        // Debug logging
        logger.info("Field: {} | Value: {} | Type: {} | Unit: {}", label, value, typeChamp, unite);
        
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPadding(3);
        labelCell.setPaddingBottom(5);
        
        // Add unit to value if it's a number type and has a unit
        String displayValue = value;
        boolean isNumeric = value != null && value.matches("^\\d+(\\.\\d+)?$");
        
        // Known numeric fields with their units - hardcoded as a fallback
        Map<String, String> knownNumericFields = new HashMap<>();
        knownNumericFields.put("Poids:", "kg");
        knownNumericFields.put("Taille:", "cm");
        knownNumericFields.put("IMC calculé:", "kg/m²");
        
        // Check if this is a known numeric field
        String knownUnit = knownNumericFields.get(label);
        
        if ((isNumeric || "number".equalsIgnoreCase(typeChamp)) && 
            (unite != null && !unite.isEmpty() || knownUnit != null)) {
            // Use the provided unit or the known unit as fallback
            String unitToUse = (unite != null && !unite.isEmpty()) ? unite : knownUnit;
            displayValue = value + " " + unitToUse;
            logger.info("Adding unit to value: {}", displayValue);
        }
        
        PdfPCell valueCell = new PdfPCell(new Phrase(displayValue, valueFont));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPadding(3);
        valueCell.setPaddingBottom(5);
        
        table.addCell(labelCell);
        table.addCell(valueCell);
    }
    
    /**
     * Overloaded method for backward compatibility
     */
    private void addTableRowWithSpacing(PdfPTable table, String label, String value) {
        addTableRowWithSpacing(table, label, value, null, null);
    }
    
    private void addFormContent(Document document, FormulairePatientDTO formulaire) throws DocumentException {
        Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
        Paragraph contentSection = new Paragraph("DÉTAILS DU FORMULAIRE", sectionFont);
        contentSection.setSpacingBefore(5);
        contentSection.setSpacingAfter(5);
        document.add(contentSection);
        
        // Count valid responses to determine if we need a two-column layout
        int validResponses = 0;
        for (ReponseFormulaireDTO r : formulaire.getReponses()) {
            if (r.getValeur() != null && !r.getValeur().isEmpty()) {
                validResponses++;
            }
        }
        
        // Use a 2-column layout if there are more than 6 fields to improve readability
        boolean useTwoColumnLayout = validResponses > 6;
        
        if (useTwoColumnLayout) {
            addFormContentTwoColumns(document, formulaire);
        } else {
            addFormContentSingleColumn(document, formulaire);
        }
        
        // Add a line separator
        Paragraph line = new Paragraph();
        line.add(new Chunk(new com.lowagie.text.pdf.draw.LineSeparator()));
        line.setSpacingBefore(10);
        line.setSpacingAfter(10);
        document.add(line);
    }
    
    /**
     * Display form content in a single column layout
     */
    private void addFormContentSingleColumn(Document document, FormulairePatientDTO formulaire) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingAfter(5);
        
        // Direct mapping for the field IDs seen in the screenshot - these are definitive
        Map<Integer, String> fieldLabels = new HashMap<>();
        fieldLabels.put(146, "Scolarité");
        fieldLabels.put(149, "Nombre d'années");
        fieldLabels.put(151, "Type");
        fieldLabels.put(153, "État");
        fieldLabels.put(155, "Date");
        fieldLabels.put(156, "Signature");
        fieldLabels.put(157, "Durée de validité du certificat");
        
        // Debug info and directly add raw response data to the PDF
        if (formulaire.getReponses() == null || formulaire.getReponses().isEmpty()) {
            Font warningFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Font.ITALIC);
            PdfPCell warningCell = new PdfPCell(new Phrase("Aucune donnée disponible", warningFont));
            warningCell.setColspan(2);
            warningCell.setBorder(Rectangle.NO_BORDER);
            warningCell.setPadding(5);
            warningCell.setHorizontalAlignment(Element.ALIGN_LEFT);
            table.addCell(warningCell);
        } else {
            // FORCE CORRECT FIELD LABELS
            // Add specific field rows in a defined order with fixed labels
            addFieldIfPresent(table, formulaire, 146, fieldLabels);
            addFieldIfPresent(table, formulaire, 149, fieldLabels);
            addFieldIfPresent(table, formulaire, 151, fieldLabels);
            addFieldIfPresent(table, formulaire, 153, fieldLabels);
            addFieldIfPresent(table, formulaire, 155, fieldLabels);
            addFieldIfPresent(table, formulaire, 156, fieldLabels);
            addFieldIfPresent(table, formulaire, 157, fieldLabels);
            
            // Add any remaining fields that weren't specifically handled above
            for (ReponseFormulaireDTO r : formulaire.getReponses()) {
                // Skip fields we've already handled
                if (fieldLabels.containsKey(r.getIdChamp())) {
                    continue;
                }
                
                if (r.getValeur() != null && !r.getValeur().isEmpty()) {
                    // Get field name with our helper method for other fields
                    String fieldLabel = getFieldName(r);
                    
                    // Add to table with improved spacing
                    addTableRowWithSpacing(table, fieldLabel + ":", r.getValeur(), r.getTypeChamp(), r.getUnite());
                }
            }
        }
        
        document.add(table);
    }
    
    /**
     * Display form content in a two-column layout for better readability
     */
    private void addFormContentTwoColumns(Document document, FormulairePatientDTO formulaire) throws DocumentException {
        // Create list of all valid responses
        List<ReponseFormulaireDTO> validResponses = new ArrayList<>();
        
        // Direct mapping for the field IDs seen in the screenshot - these are definitive
        Map<Integer, String> fieldLabels = new HashMap<>();
        fieldLabels.put(146, "Scolarité");
        fieldLabels.put(149, "Nombre d'années");
        fieldLabels.put(151, "Type");
        fieldLabels.put(153, "État");
        fieldLabels.put(155, "Date");
        fieldLabels.put(156, "Signature");
        fieldLabels.put(157, "Durée de validité du certificat");
        
        // Priority to handle known fields first
        for (Integer fieldId : Arrays.asList(146, 149, 151, 153, 155, 156, 157)) {
            for (ReponseFormulaireDTO r : formulaire.getReponses()) {
                if (r.getIdChamp().equals(fieldId) && r.getValeur() != null && !r.getValeur().isEmpty()) {
                    validResponses.add(r);
                    break;
                }
            }
        }
        
        // Add remaining fields
        for (ReponseFormulaireDTO r : formulaire.getReponses()) {
            // Skip fields we've already handled
            if (fieldLabels.containsKey(r.getIdChamp()) || r.getValeur() == null || r.getValeur().isEmpty()) {
                continue;
            }
            validResponses.add(r);
        }
        
        if (validResponses.isEmpty()) {
            PdfPTable table = new PdfPTable(1);
            table.setWidthPercentage(100);
            table.setSpacingAfter(10);
            
            Font warningFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Font.ITALIC);
            PdfPCell warningCell = new PdfPCell(new Phrase("Aucune donnée disponible", warningFont));
            warningCell.setBorder(Rectangle.NO_BORDER);
            warningCell.setPadding(5);
            warningCell.setHorizontalAlignment(Element.ALIGN_LEFT);
            table.addCell(warningCell);
            
            document.add(table);
            return;
        }
        
        // Split responses into two equal groups for two-column layout
        int halfSize = (validResponses.size() + 1) / 2; // Ceiling division
        
        // Create a table with one row, two columns
        PdfPTable outerTable = new PdfPTable(2);
        outerTable.setWidthPercentage(100);
        outerTable.setSpacingAfter(5);
        
        // First column table
        PdfPTable leftTable = new PdfPTable(2);
        leftTable.setWidthPercentage(98);
        
        // Second column table
        PdfPTable rightTable = new PdfPTable(2);
        rightTable.setWidthPercentage(98);
        
        // Add fields to left column
        for (int i = 0; i < halfSize && i < validResponses.size(); i++) {
            ReponseFormulaireDTO r = validResponses.get(i);
            String fieldLabel;
            if (fieldLabels.containsKey(r.getIdChamp())) {
                fieldLabel = fieldLabels.get(r.getIdChamp());
            } else {
                fieldLabel = getFieldName(r);
            }
            addTableRowWithSpacing(leftTable, fieldLabel + ":", r.getValeur(), r.getTypeChamp(), r.getUnite());
        }
        
        // Add fields to right column
        for (int i = halfSize; i < validResponses.size(); i++) {
            ReponseFormulaireDTO r = validResponses.get(i);
            String fieldLabel;
            if (fieldLabels.containsKey(r.getIdChamp())) {
                fieldLabel = fieldLabels.get(r.getIdChamp());
            } else {
                fieldLabel = getFieldName(r);
            }
            addTableRowWithSpacing(rightTable, fieldLabel + ":", r.getValeur(), r.getTypeChamp(), r.getUnite());
        }
        
        // Add tables to outer table cells
        PdfPCell leftCell = new PdfPCell(leftTable);
        leftCell.setBorder(Rectangle.NO_BORDER);
        leftCell.setPadding(0);
        
        PdfPCell rightCell = new PdfPCell(rightTable);
        rightCell.setBorder(Rectangle.NO_BORDER);
        rightCell.setPadding(0);
        
        outerTable.addCell(leftCell);
        outerTable.addCell(rightCell);
        
        document.add(outerTable);
    }
    
    /**
     * Helper method to add a specific field to the table if it exists
     */
    private void addFieldIfPresent(PdfPTable table, FormulairePatientDTO formulaire, 
                                 Integer fieldId, Map<Integer, String> fieldLabels) {
        String fixedLabel = fieldLabels.get(fieldId);
        
        // Find the response with this field ID
        for (ReponseFormulaireDTO r : formulaire.getReponses()) {
            if (r.getIdChamp().equals(fieldId) && r.getValeur() != null && !r.getValeur().isEmpty()) {
                // Use the fixed label, not any name that might be in the response
                addTableRowWithSpacing(table, fixedLabel + ":", r.getValeur(), r.getTypeChamp(), r.getUnite());
                logger.info("Added field to PDF using fixed label: {} = {}", fixedLabel, r.getValeur());
                break;
            }
        }
    }
    
    /**
     * Get field name with fallbacks and direct repository lookup if needed
     */
    private String getFieldName(ReponseFormulaireDTO response) {
        // Enhanced logging for debugging
        logger.info("Getting field name for field ID: {}", response.getIdChamp());
        
        // First try: use nomChamp if available in the response
        if (response.getNomChamp() != null && !response.getNomChamp().isEmpty()) {
            logger.info("Using name from response DTO: {}", response.getNomChamp());
            return response.getNomChamp();
        } else {
            logger.warn("Field ID {} has no name in response DTO", response.getIdChamp());
        }
        
        // Second try: direct lookup from the repository
        try {
            Integer idChamp = response.getIdChamp();
            logger.info("Looking up field name in database for ID: {}", idChamp);
            
            // Get directly from database
            Optional<ChampFormulaire> champOpt = champFormulaireRepository.findById(idChamp);
            
            if (champOpt.isPresent()) {
                String fieldName = champOpt.get().getNom();
                logger.info("Found field name in database: {}", fieldName);
                return fieldName;
            } else {
                logger.warn("Field ID {} not found in database", idChamp);
                
                // Hardcoded field names as a last resort for these specific field IDs
                // These are the ones seen in the screenshot
                Map<Integer, String> knownFields = new HashMap<>();
                knownFields.put(146, "Scolarité");
                knownFields.put(149, "Nombre d'années");
                knownFields.put(151, "Type");
                knownFields.put(153, "État");
                knownFields.put(155, "Date");
                knownFields.put(156, "Signature");
                
                if (knownFields.containsKey(idChamp)) {
                    String knownName = knownFields.get(idChamp);
                    logger.info("Using hardcoded field name for ID {}: {}", idChamp, knownName);
                    return knownName;
                }
            }
            
            // Fallback: return generic field name
            logger.warn("Falling back to generic field name for ID: {}", idChamp);
            return "Champ " + idChamp;
        } catch (Exception e) {
            logger.error("Error looking up field name for ID {}: {}", response.getIdChamp(), e.getMessage());
            return "Champ " + response.getIdChamp();
        }
    }
    
    private void addDoctorSection(Document document, Medecin medecin, LocalDateTime date) throws DocumentException {
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
        Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
        
        // Create a table for the doctor information and signature
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        
        // Left cell - Date
        Paragraph dateInfo = new Paragraph();
        dateInfo.add(new Phrase("Fait à Rabat, le " + formatDateTime(date) + "\n", normalFont));
        
        PdfPCell leftCell = new PdfPCell();
        leftCell.addElement(dateInfo);
        leftCell.setBorder(Rectangle.NO_BORDER);
        leftCell.setPadding(5);
        
        // Right cell - Doctor information and signature
        Paragraph doctorInfo = new Paragraph();
        doctorInfo.add(new Phrase("Dr. " + (medecin != null && medecin.getUtilisateur() != null ? 
                medecin.getUtilisateur().getNom() + " " + medecin.getUtilisateur().getPrenom() : "") + "\n", boldFont));
        
        // Add speciality if available
        if (medecin != null && medecin.getIdSpecialite() != null) {
            try {
                String specialite = "Médecin";
                doctorInfo.add(new Phrase(specialite + "\n", normalFont));
            } catch (Exception e) {
                logger.error("Error retrieving doctor's speciality", e);
            }
        }
        
        doctorInfo.add(new Phrase("Signature et cachet", normalFont));
        doctorInfo.setAlignment(Element.ALIGN_RIGHT);
        
        PdfPCell rightCell = new PdfPCell();
        rightCell.addElement(doctorInfo);
        rightCell.setBorder(Rectangle.NO_BORDER);
        rightCell.setPadding(5);
        
        table.addCell(leftCell);
        table.addCell(rightCell);
        
        document.add(table);
    }
    
    private String formatDate(LocalDate date) {
        if (date == null) return "";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        return date.format(formatter);
    }
    
    private String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return "";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        return dateTime.format(formatter);
    }
    
    /**
     * Generates a filename for the form PDF based on patient name, form model, and date with timestamp
     * 
     * @param patientName Patient's name
     * @param modelName Model name (e.g., certificat)
     * @return Formatted filename
     */
    public String generateFilename(String patientName, String modelName) {
        // Remove any spaces or special characters and convert to lowercase
        String sanitizedPatientName = patientName.toLowerCase()
                .replaceAll("\\s+", "_")
                .replaceAll("[^a-z0-9_]", "");
        
        String sanitizedModelName = modelName.toLowerCase()
                .replaceAll("\\s+", "_")
                .replaceAll("[^a-z0-9_]", "");
        
        // Get current date and time
        LocalDateTime now = LocalDateTime.now();
        
        // Format the date and time as yyyy-MM-dd_HH-mm-ss
        // Using hyphens instead of colons for time components to ensure filename compatibility
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss");
        String formattedDateTime = now.format(formatter);
        
        return sanitizedModelName + "_" + sanitizedPatientName + "_" + formattedDateTime + ".pdf";
    }

    /**
     * Add flexible space to push the footer to the bottom of the page
     */
    private void addFlexibleSpace(Document document) throws DocumentException {
        // Add vertical space that will expand to fill available space
        for (int i = 0; i < 3; i++) {
            Paragraph spacer = new Paragraph(" ");
            spacer.setSpacingAfter(30);
            document.add(spacer);
        }
    }

    /**
     * Add footer with hospital contact information to the PDF
     */
    private void addFooter(Document document) throws DocumentException {
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
        
        // Add a line separator
        Paragraph line = new Paragraph();
        line.add(new Chunk(new com.lowagie.text.pdf.draw.LineSeparator()));
        line.setSpacingBefore(10);
        line.setSpacingAfter(10);
        document.add(line);
        
        // Create a table for the footer with two columns
        PdfPTable footerTable = new PdfPTable(2);
        footerTable.setWidthPercentage(100);
        
        // Left column - Hospital information
        Paragraph hospitalInfo = new Paragraph();
        hospitalInfo.add(new Phrase("Hôpital Universitaire International de Rabat\n", headerFont));
        hospitalInfo.add(new Phrase("Parc Technopolis 11 100 Sala Al Jadida – Maroc", normalFont));
        
        // Right column - Contact information
        Paragraph contactInfo = new Paragraph();
        contactInfo.add(new Phrase("+212 5 30 10 30 00\n", normalFont)); 
        contactInfo.add(new Phrase("contact@huir.ma", normalFont));
        contactInfo.setAlignment(Element.ALIGN_RIGHT);
        
        // Add cells to table
        PdfPCell leftCell = new PdfPCell();
        leftCell.addElement(hospitalInfo);
        leftCell.setBorder(Rectangle.NO_BORDER);
        leftCell.setPadding(0);
        
        PdfPCell rightCell = new PdfPCell();
        rightCell.addElement(contactInfo);
        rightCell.setBorder(Rectangle.NO_BORDER);
        rightCell.setPadding(0);
        rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        
        footerTable.addCell(leftCell);
        footerTable.addCell(rightCell);
        
        document.add(footerTable);
    }
} 