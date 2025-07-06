package com.hdoc.sgdm.service;

import com.hdoc.sgdm.dto.FormulairePatientDTO;
import com.hdoc.sgdm.dto.request.FactureRequest;
import com.hdoc.sgdm.entity.Facture;
import com.hdoc.sgdm.entity.Patient;
import com.hdoc.sgdm.entity.Visite;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.lowagie.text.pdf.draw.LineSeparator;
import lombok.RequiredArgsConstructor;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class FacturePDFService {
    private static final Logger logger = LoggerFactory.getLogger(FacturePDFService.class);
    
    @Value("${supabase.url}")
    private String supabaseUrl;
    
    @Value("${supabase.key}")
    private String supabaseKey;
    
    @Value("${supabase.service-role-key}")
    private String serviceRoleKey;
    
    private final FormulaireMedicalService formulaireMedicalService;
    
    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build();
    
    /**
     * Generate a PDF for a facture and upload it to Supabase storage
     * 
     * @param facture the facture entity
     * @param patient the patient entity
     * @param visite the visite entity
     * @return the URL to the uploaded PDF
     * @throws IOException if PDF generation or upload fails
     */
    public String generateAndUploadPDF(Facture facture, Patient patient, Visite visite) throws IOException {
        byte[] pdfBytes = generatePDF(facture, patient, visite);
        
        // Generate a filename - handle case where facture might not have ID yet
        String idPart = (facture.getIdFacture() != null) ? 
                        facture.getIdFacture().toString() : 
                        "temp_" + System.currentTimeMillis();
        
        String filename = "facture_" + idPart + "_" + UUID.randomUUID().toString().substring(0, 8) + ".pdf";
        return uploadPDFToSupabase(pdfBytes, filename);
    }
    
    /**
     * Generate the PDF content for a facture
     * 
     * @param facture the facture entity
     * @param patient the patient entity
     * @param visite the visite entity
     * @return the PDF as a byte array
     * @throws IOException if PDF generation fails
     */
    private byte[] generatePDF(Facture facture, Patient patient, Visite visite) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        try {
            // Create PDF document
            Document document = new Document(PageSize.A4);
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            document.open();
            
            // Add logo
            addLogo(document);
            
            // Add header with hospital info
            addHeader(document);
            
            // Add facture title and metadata
            addTitle(document, facture);
            
            // Add patient info
            addPatientInfo(document, patient);
            
            // Add services table (replaces visit info and consultation table)
            if (facture.getMontant() != null) {
                addServicesTable(document, visite, facture);
            }
            
            // Add mode de paiement line
            if (facture.getModePaiement() != null && !facture.getModePaiement().isEmpty()) {
                addModePaiement(document, facture);
            }
            
            // Add flexible space to push the footer to the bottom
            addFlexibleSpace(document);
            
            // Add footer
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
            // Path to the logo - using absolute path from requirements
            String logoPath = "/Users/saad/Downloads/H-DOC_Project/H-DOC_Frontend/src/shared/assets/images/logo.jpg";
            File logoFile = new File(logoPath);
            
            if (!logoFile.exists()) {
                logger.warn("Logo file not found at: {}", logoPath);
                return;
            }
            
            // Load the image
            Image logo = Image.getInstance(logoPath);
            
            // Scale the image to an appropriate size
            logo.scaleToFit(100, 50);
            
            // Position the logo at the top-left
            logo.setAbsolutePosition(36, document.getPageSize().getHeight() - 50 - 36);
            
            // Add the logo to the document
            document.add(logo);
            
            // Add more space after the logo
            document.add(new Paragraph(" "));
            document.add(new Paragraph(" "));
        } catch (Exception e) {
            logger.error("Error adding logo to PDF", e);
        }
    }
    
    /**
     * Add header with hospital information
     */
    private void addHeader(Document document) throws DocumentException {
        // We're removing the entire address section under the logo as requested
        // The logo position remains unchanged (handled by addLogo method)
        
        // Not adding the line separator anymore
        document.add(new Paragraph(" "));
    }
    
    /**
     * Add the title and facture metadata
     */
    private void addTitle(Document document, Facture facture) throws DocumentException {
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
        Paragraph title = new Paragraph("FACTURE", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);
        
        // Add facture number and date
        Font metadataFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
        
        // Always display the ID from the database
        Paragraph factureNumber = new Paragraph("Facture N°: " + facture.getIdFacture(), metadataFont);
        factureNumber.setAlignment(Element.ALIGN_RIGHT);
        document.add(factureNumber);
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String formattedDate = facture.getDateFacturation().format(formatter);
        
        Paragraph factureDate = new Paragraph("Date: " + formattedDate, metadataFont);
        factureDate.setAlignment(Element.ALIGN_RIGHT);
        document.add(factureDate);
        
        document.add(new Paragraph(" "));
    }
    
    /**
     * Add patient information
     */
    private void addPatientInfo(Document document, Patient patient) throws DocumentException {
        // Update to match ordonnance format
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
        Font contentFont = FontFactory.getFont(FontFactory.HELVETICA, 11);
        
        // Add a section title
        Paragraph patientSection = new Paragraph("INFORMATIONS PATIENT", headerFont);
        patientSection.setSpacingBefore(5);
        patientSection.setSpacingAfter(5);
        document.add(patientSection);
        
        // Create a table for patient information with left-aligned content
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        
        // Left column with patient details
        PdfPCell cell1 = new PdfPCell();
        
        // Add Nom
        Paragraph nomPara = new Paragraph();
        nomPara.add(new Phrase("Nom: ", headerFont));
        nomPara.add(new Phrase(patient.getNom(), contentFont));
        cell1.addElement(nomPara);
        
        // Add Prénom
        Paragraph prenomPara = new Paragraph();
        prenomPara.add(new Phrase("Prénom: ", headerFont));
        prenomPara.add(new Phrase(patient.getPrenom(), contentFont));
        cell1.addElement(prenomPara);
        
        cell1.setBorder(Rectangle.NO_BORDER);
        cell1.setPadding(5);
        
        // Right column with IPP and CIN
        PdfPCell cell2 = new PdfPCell();
        
        // Add IPP
        Paragraph ippPara = new Paragraph();
        ippPara.add(new Phrase("IPP: ", headerFont));
        ippPara.add(new Phrase(patient.getIpp(), contentFont));
        cell2.addElement(ippPara);
        
        // Add CIN
        Paragraph cinPara = new Paragraph();
        cinPara.add(new Phrase("CIN: ", headerFont));
        cinPara.add(new Phrase(patient.getCin(), contentFont));
        cell2.addElement(cinPara);
        
        cell2.setBorder(Rectangle.NO_BORDER);
        cell2.setPadding(5);
        
        table.addCell(cell1);
        table.addCell(cell2);
        table.setSpacingAfter(10);
        
        document.add(table);
        
        // Add a line separator after patient info
        Paragraph line = new Paragraph();
        line.add(new Chunk(new com.lowagie.text.pdf.draw.LineSeparator()));
        line.setSpacingAfter(15);
        document.add(line);
    }
    
    /**
     * Add services table with total
     * Shows a 2-column table with Service and Prix, where Service is the nomModele of each form
     */
    private void addServicesTable(Document document, Visite visite, Facture facture) throws DocumentException {
        // No section title as per requirements
        document.add(new Paragraph(" "));
        
        // Create table with 2 columns (Service, Prix)
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        
        // Set column widths
        float[] columnWidths = {70f, 30f};
        table.setWidths(columnWidths);
        
        // Add table headers
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
        
        PdfPCell serviceHeader = new PdfPCell(new Phrase("Service", headerFont));
        serviceHeader.setBackgroundColor(new Color(220, 220, 220));
        serviceHeader.setPadding(5);
        
        PdfPCell priceHeader = new PdfPCell(new Phrase("Prix", headerFont));
        priceHeader.setBackgroundColor(new Color(220, 220, 220));
        priceHeader.setPadding(5);
        
        table.addCell(serviceHeader);
        table.addCell(priceHeader);
        
        Font contentFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
        
        // Get all formulaires for this visite
        List<FormulairePatientDTO> formulaires = formulaireMedicalService.getFormulairesVisite(visite.getIdVisite().intValue());
        logger.info("Found {} consultations for visite ID: {}", formulaires.size(), visite.getIdVisite());
        
        // Calculate total amount for verification
        BigDecimal totalAmount = BigDecimal.ZERO;
        
        // Add a row for each consultation (formulaire)
        for (FormulairePatientDTO formulaire : formulaires) {
            logger.info("Processing formulaire: ID={}, nomModele={}, prix={}", 
                formulaire.getIdFormulaire(), formulaire.getNomModele(), formulaire.getPrix());
            
            if (formulaire.getPrix() != null) {
                // Add the consultation name and price, formatting if needed
                String serviceName = formulaire.getNomModele() != null ? formulaire.getNomModele() : "Consultation";
                
                // Remove "Fiche de " prefix if it exists (case-insensitive)
                if (serviceName != null && serviceName.toLowerCase().startsWith("fiche de ")) {
                    serviceName = serviceName.substring(9); // "Fiche de " has 9 characters
                }
                
                // Capitalize only the first letter of the title
                if (serviceName != null && !serviceName.isEmpty()) {
                    serviceName = serviceName.substring(0, 1).toUpperCase() + serviceName.substring(1);
                }
                
                PdfPCell serviceCell = new PdfPCell(new Phrase(serviceName, contentFont));
                serviceCell.setPadding(5);
                
                PdfPCell priceCell = new PdfPCell(
                    new Phrase(formulaire.getPrix().toString() + " MAD", contentFont));
                priceCell.setPadding(5);
                priceCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                
                table.addCell(serviceCell);
                table.addCell(priceCell);
                
                // Add to total
                totalAmount = totalAmount.add(formulaire.getPrix());
            }
        }
        
                // Log the total amount
        logger.info("Calculated total amount: {} MAD", totalAmount);
        
        // If no valid consultation prices were found, use the facture's total amount
        if (totalAmount.compareTo(BigDecimal.ZERO) == 0 && formulaires.isEmpty()) {
            logger.warn("No consultations found with valid prices, using facture amount: {} MAD", facture.getMontant());
            
            // Add a default row
            String defaultServiceName = "Consultation médicale";
            // Capitalize the first letter (already capitalized in this case, but keeping the pattern consistent)
            defaultServiceName = defaultServiceName.substring(0, 1).toUpperCase() + defaultServiceName.substring(1);
            
            PdfPCell serviceCell = new PdfPCell(new Phrase(defaultServiceName, contentFont));
            serviceCell.setPadding(5);
            
            PdfPCell priceCell = new PdfPCell(new Phrase(facture.getMontant().toString() + " MAD", contentFont));
            priceCell.setPadding(5);
            priceCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            
            table.addCell(serviceCell);
            table.addCell(priceCell);
            
            totalAmount = facture.getMontant();
        }

        // Add total row
        PdfPCell totalLabelCell = new PdfPCell(new Phrase("Total", headerFont));
        totalLabelCell.setPadding(5);
        totalLabelCell.setHorizontalAlignment(Element.ALIGN_LEFT);
        
        // Use the calculated total
        PdfPCell totalValueCell = new PdfPCell(new Phrase(totalAmount.toString() + " MAD", headerFont));
        totalValueCell.setPadding(5);
        totalValueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        
        table.addCell(totalLabelCell);
        table.addCell(totalValueCell);
        
        document.add(table);
        document.add(new Paragraph(" "));
    }
    
    /**
     * Add mode de paiement line
     * This is a right-aligned line showing the payment method
     */
    private void addModePaiement(Document document, Facture facture) throws DocumentException {
        Font contentFont = FontFactory.getFont(FontFactory.HELVETICA, 11);
        
        Paragraph modePaiement = new Paragraph("Mode de Paiement: " + facture.getModePaiement(), contentFont);
        modePaiement.setAlignment(Element.ALIGN_RIGHT);
        modePaiement.setSpacingBefore(10);
        modePaiement.setSpacingAfter(10);
        
        document.add(modePaiement);
    }
    
    /**
     * Add footer with hospital contact information to the PDF
     */
    private void addFooter(Document document) throws DocumentException {
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
        
        // Add a light grey line separator
        Paragraph line = new Paragraph();
        LineSeparator lineSeparator = new LineSeparator();
        lineSeparator.setLineColor(new Color(200, 200, 200)); // Light grey color
        lineSeparator.setLineWidth(0.5f);
        line.add(new Chunk(lineSeparator));
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
    
    /**
     * Add a row to a table
     */
    private void addTableRow(PdfPTable table, String label, String value, Font font) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, font));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPadding(5);
        
        PdfPCell valueCell = new PdfPCell(new Phrase(value, font));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPadding(5);
        
        table.addCell(labelCell);
        table.addCell(valueCell);
    }
    
    /**
     * Upload PDF file to Supabase Storage
     */
    private String uploadPDFToSupabase(byte[] pdfData, String filename) throws IOException {
        // Bucket name for factures
        String bucketName = "factures";
        
        // Ensure the factures bucket exists
        ensureBucketExists(bucketName);
        
        // Create URLs
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + filename;
        String publicUrl = supabaseUrl + "/storage/v1/object/public/" + bucketName + "/" + filename;
        
        logger.debug("Uploading PDF to: {}", uploadUrl);
        
        // Build request body with PDF data
        RequestBody requestBody = RequestBody.create(pdfData, MediaType.parse("application/pdf"));
        
        // Build the request
        Request request = new Request.Builder()
                .url(uploadUrl)
                .header("Authorization", "Bearer " + serviceRoleKey)
                .header("apikey", supabaseKey)
                .put(requestBody)
                .build();
        
        // Execute the request
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "Unknown error";
                logger.error("Failed to upload PDF to Supabase: {} - {}", response.code(), errorBody);
                throw new IOException("Failed to upload PDF to Supabase: " + response.code() + " - " + errorBody);
            }
            
            logger.info("Successfully uploaded PDF to Supabase: {}", publicUrl);
            return publicUrl;
        }
    }
    
    /**
     * Ensure that the bucket exists (create it if it doesn't)
     */
    private void ensureBucketExists(String bucketName) {
        // URL for bucket operations
        String bucketUrl = supabaseUrl + "/storage/v1/bucket";
        
        // First, check if the bucket exists
        Request getRequest = new Request.Builder()
                .url(bucketUrl + "/" + bucketName)
                .header("Authorization", "Bearer " + serviceRoleKey)
                .header("apikey", supabaseKey)
                .get()
                .build();
        
        try (Response response = httpClient.newCall(getRequest).execute()) {
            if (response.isSuccessful()) {
                logger.debug("Bucket '{}' already exists", bucketName);
                return;
            }
            
            if (response.code() != 404) {
                // Some error other than "not found" occurred
                String errorBody = response.body() != null ? response.body().string() : "Unknown error";
                logger.error("Error checking if bucket exists: {} - {}", response.code(), errorBody);
                return;
            }
            
            // Bucket doesn't exist, create it
            MediaType JSON = MediaType.parse("application/json; charset=utf-8");
            String jsonBody = "{\"id\":\"" + bucketName + "\",\"public\":true}";
            RequestBody body = RequestBody.create(jsonBody, JSON);
            
            Request createRequest = new Request.Builder()
                    .url(bucketUrl)
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .header("apikey", supabaseKey)
                    .post(body)
                    .build();
            
            try (Response createResponse = httpClient.newCall(createRequest).execute()) {
                if (createResponse.isSuccessful()) {
                    logger.info("Successfully created bucket: {}", bucketName);
                } else {
                    String errorBody = createResponse.body() != null ? createResponse.body().string() : "Unknown error";
                    logger.error("Failed to create bucket: {} - {}", createResponse.code(), errorBody);
                }
            }
        } catch (Exception e) {
            logger.error("Exception while ensuring bucket exists", e);
        }
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
}
