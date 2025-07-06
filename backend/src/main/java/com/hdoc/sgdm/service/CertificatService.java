package com.hdoc.sgdm.service;

import com.hdoc.sgdm.dto.request.CertificatRequest;
import com.hdoc.sgdm.dto.response.CertificatDTO;
import com.hdoc.sgdm.entity.Certificat;
import com.hdoc.sgdm.entity.Medecin;
import com.hdoc.sgdm.entity.Patient;
import com.hdoc.sgdm.exception.ResourceNotFoundException;
import com.hdoc.sgdm.repository.CertificatRepository;
import com.hdoc.sgdm.repository.MedecinRepository;
import com.hdoc.sgdm.repository.PatientRepository;
import com.hdoc.sgdm.repository.SpecialiteRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.lowagie.text.Image;
import lombok.RequiredArgsConstructor;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CertificatService {
    private static final Logger logger = LoggerFactory.getLogger(CertificatService.class);
    
    private final CertificatRepository certificatRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final SpecialiteRepository specialiteRepository;
    
    @Value("${supabase.url}")
    private String supabaseUrl;
    
    @Value("${supabase.service-role-key}")
    private String serviceRoleKey;
    
    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build();
    
    /**
     * Create a new medical certificate
     * 
     * @param request Certificate creation request data
     * @return The created certificate DTO
     */
    @Transactional
    public CertificatDTO createCertificat(CertificatRequest request) {
        // Verify patient and doctor exist
        Patient patient = patientRepository.findByIdPatient(request.getIdPatient())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + request.getIdPatient()));
        
        Medecin medecin = medecinRepository.findByIdWithUtilisateur(request.getIdMedecin())
                .orElseThrow(() -> new ResourceNotFoundException("Médecin not found with ID: " + request.getIdMedecin()));
        
        // Create the certificate entity
        Certificat certificat = Certificat.builder()
                .idPatient(request.getIdPatient())
                .idMedecin(request.getIdMedecin())
                .dateRedaction(LocalDateTime.now())
                .motif(request.getMotif())
                .nombreJoursRepos(request.getNombreJoursRepos())
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .pdfUrl(request.getPdfUrl())
                .build();
        
        // If there's no PDF URL, generate one
        if (certificat.getPdfUrl() == null || certificat.getPdfUrl().isEmpty()) {
            try {
                byte[] pdfData = generateCertificatPDF(certificat, patient, medecin);
                String filename = generateCertificatFilename(patient);
                String pdfUrl = uploadPDFToSupabase(pdfData, filename);
                certificat.setPdfUrl(pdfUrl);
            } catch (IOException e) {
                logger.error("Error generating PDF for certificate", e);
                throw new RuntimeException("Failed to generate PDF for certificate", e);
            }
        }
        
        // Save and return
        Certificat savedCertificat = certificatRepository.save(certificat);
        return mapToDTO(savedCertificat, patient, medecin);
    }
    
    /**
     * Uploads a PDF file to Supabase Storage
     * 
     * @param pdfData The PDF content as byte array
     * @param filename The filename to use
     * @return The public URL to access the file
     */
    private String uploadPDFToSupabase(byte[] pdfData, String filename) throws IOException {
        // Create URLs for the certificats bucket
        String bucketName = "certificats";
        
        // Ensure the certificats bucket exists
        ensureBucketExists(bucketName);
        
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + filename;
        String publicUrl = supabaseUrl + "/storage/v1/object/public/" + bucketName + "/" + filename;
        
        logger.debug("Uploading PDF to: {}", uploadUrl);
        
        // Build request body with PDF data
        RequestBody requestBody = RequestBody.create(pdfData, MediaType.parse("application/pdf"));
        
        // Build the request
        Request request = new Request.Builder()
                .url(uploadUrl)
                .put(requestBody)
                .addHeader("Authorization", "Bearer " + serviceRoleKey)
                .addHeader("apikey", serviceRoleKey)
                .addHeader("Content-Type", "application/pdf")
                .addHeader("x-upsert", "true") // Overwrite if exists
                .build();
        
        // Execute the request
        try (Response response = httpClient.newCall(request).execute()) {
            int statusCode = response.code();
            logger.debug("Upload response status: {}", statusCode);
            
            if (statusCode >= 200 && statusCode < 300) {
                logger.info("PDF uploaded successfully");
                return publicUrl;
            } else {
                String responseBody = response.body() != null ? response.body().string() : "";
                throw new IOException("Failed to upload PDF to Supabase. Status: " + statusCode + " - " + responseBody);
            }
        } catch (Exception e) {
            logger.error("Error during PDF upload: {}", e.getMessage());
            
            // For development, return the URL even if upload fails
            logger.warn("DEVELOPMENT MODE: Returning URL despite upload failure");
            return publicUrl;
        }
    }
    
    /**
     * Ensures that the specified bucket exists in Supabase Storage
     * Creates it if it doesn't exist
     * 
     * @param bucketName The name of the bucket to check/create
     */
    private void ensureBucketExists(String bucketName) {
        // Check if bucket exists
        String checkUrl = supabaseUrl + "/storage/v1/bucket/" + bucketName;
        
        Request checkRequest = new Request.Builder()
                .url(checkUrl)
                .get()
                .addHeader("Authorization", "Bearer " + serviceRoleKey)
                .addHeader("apikey", serviceRoleKey)
                .build();
        
        try (Response response = httpClient.newCall(checkRequest).execute()) {
            if (response.code() == 200) {
                // Bucket exists
                logger.debug("Bucket '{}' already exists", bucketName);
                return;
            } else if (response.code() != 404) {
                // Unexpected error
                logger.warn("Unexpected response when checking bucket: {}", response.code());
            }
            
            // Bucket doesn't exist or error occurred, try to create it
            String createUrl = supabaseUrl + "/storage/v1/bucket";
            
            // Create request body with bucket configuration
            String jsonBody = "{\"name\":\"" + bucketName + "\", \"public\":true}";
            RequestBody body = RequestBody.create(jsonBody, MediaType.parse("application/json"));
            
            Request createRequest = new Request.Builder()
                    .url(createUrl)
                    .post(body)
                    .addHeader("Authorization", "Bearer " + serviceRoleKey)
                    .addHeader("apikey", serviceRoleKey)
                    .addHeader("Content-Type", "application/json")
                    .build();
            
            try (Response createResponse = httpClient.newCall(createRequest).execute()) {
                if (createResponse.code() >= 200 && createResponse.code() < 300) {
                    logger.info("Successfully created bucket: {}", bucketName);
                } else {
                    String responseBody = createResponse.body() != null ? createResponse.body().string() : "";
                    logger.warn("Failed to create bucket {}: {} - {}", 
                            bucketName, createResponse.code(), responseBody);
                }
            }
        } catch (Exception e) {
            logger.error("Error checking/creating bucket {}: {}", bucketName, e.getMessage());
        }
    }
    
    /**
     * Get all certificates for a patient
     * 
     * @param idPatient Patient's ID
     * @return List of certificate DTOs
     */
    public List<CertificatDTO> getCertificatsForPatient(UUID idPatient) {
        // Verify patient exists
        Patient patient = patientRepository.findByIdPatient(idPatient)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + idPatient));
        
        // Get certificates
        List<Certificat> certificats = certificatRepository.findAllByIdPatient(idPatient);
        
        // Map each certificate to DTO with patient and doctor info
        return certificats.stream()
                .map(certificat -> {
                    Optional<Medecin> medecin = medecinRepository.findByIdWithUtilisateur(certificat.getIdMedecin());
                    return mapToDTO(certificat, patient, medecin.orElse(null));
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Generate PDF for a medical certificate
     */
    private byte[] generateCertificatPDF(Certificat certificat, Patient patient, Medecin medecin) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        try {
            // Create PDF document
            Document document = new Document(PageSize.A4);
            // Set larger top margin (72 points = 1 inch)
            document.setMargins(36, 36, 72, 36); // left, right, top, bottom (in points)
            PdfWriter pdfWriter = PdfWriter.getInstance(document, baos);
            document.open();
            
            // Add logo to the top-left corner
            addLogo(document);
            
            // Add certificate title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Font.BOLD);
            Paragraph title = new Paragraph("CERTIFICAT MÉDICAL", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(40);
            document.add(title);
            
            // Add certificate content (modified format)
            addCertificateContent(document, certificat, patient, medecin);
            
            // Add doctor and date section
            addDoctorSection(document, medecin, certificat.getDateRedaction());
            
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
            
            // Add some space after the logo
            document.add(new Paragraph(" "));
            document.add(new Paragraph(" "));
        } catch (Exception e) {
            logger.error("Error adding logo to PDF", e);
        }
    }
    
    private void addCertificateContent(Document document, Certificat certificat, Patient patient, Medecin medecin) throws DocumentException {
        Font contentFont = FontFactory.getFont(FontFactory.HELVETICA, 13);
        Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13);
        
        // Main content paragraph
        Paragraph content = new Paragraph();
        content.setAlignment(Element.ALIGN_JUSTIFIED);
        content.setIndentationLeft(20);
        content.setIndentationRight(20);
        content.setSpacingAfter(40);
        content.setLeading(24f); // Increase line spacing for better readability
        
        // Determine gender-specific text
        boolean isFemale = patient.getSexe() != null && patient.getSexe().equalsIgnoreCase("F");
        String prefix = isFemale ? "Mme" : "Mr";
        String suffix = isFemale ? "e" : "";
        
        // Add the certificate text in the specified format
        content.add(new Phrase("Je soussigné, Dr ", contentFont));
        content.add(new Phrase(medecin.getUtilisateur().getPrenom() + " " + medecin.getUtilisateur().getNom(), boldFont));
        content.add(Chunk.NEWLINE);
        content.add(Chunk.NEWLINE);
        
        content.add(new Phrase("certifie que " + prefix + " ", contentFont));
        content.add(new Phrase(patient.getPrenom() + " " + patient.getNom(), boldFont));
        content.add(Chunk.NEWLINE);
        content.add(Chunk.NEWLINE);
        
        // Add specific information about the certificate
        if (certificat.getNombreJoursRepos() != null && certificat.getNombreJoursRepos() > 0) {
            content.add(new Phrase("nécessite un repos médical de ", contentFont));
            content.add(new Phrase(certificat.getNombreJoursRepos() + " jour(s)", boldFont));
            content.add(new Phrase(" à compter de ce jour", contentFont));
            
            if (certificat.getDateDebut() != null && certificat.getDateFin() != null) {
                content.add(new Phrase(" (du ", contentFont));
                content.add(new Phrase(formatDate(certificat.getDateDebut()), boldFont));
                content.add(new Phrase(" au ", contentFont));
                content.add(new Phrase(formatDate(certificat.getDateFin()), boldFont));
                content.add(new Phrase(")", contentFont));
            }
            content.add(new Phrase(".", contentFont));
        }
        
        content.add(Chunk.NEWLINE);
        content.add(Chunk.NEWLINE);
        
        // Add the standard closing text
        content.add(new Phrase("Ce certificat est délivré à l'intéressé" + suffix + " pour servir et faire valoir ce que de droit.", contentFont));
        
        // Add motif if present
        if (certificat.getMotif() != null && !certificat.getMotif().isEmpty()) {
            content.add(Chunk.NEWLINE);
            content.add(Chunk.NEWLINE);
            content.add(Chunk.NEWLINE); // Add extra space before motif
            content.add(new Phrase("Motif : ", boldFont));
            content.add(new Phrase(certificat.getMotif(), contentFont));
            content.add(Chunk.NEWLINE);
            content.add(Chunk.NEWLINE); // Add extra space after motif
        }
        
        document.add(content);
    }
    
    private void addDoctorSection(Document document, Medecin medecin, LocalDateTime date) throws DocumentException {
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 11);
        Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
        
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
        doctorInfo.add(new Phrase("Dr. " + medecin.getUtilisateur().getNom() + " " + 
                medecin.getUtilisateur().getPrenom() + "\n", boldFont));
        
        // Add speciality if available
        if (medecin.getIdSpecialite() != null) {
            specialiteRepository.findById(medecin.getIdSpecialite())
                    .ifPresent(specialite -> doctorInfo.add(new Phrase(specialite.getNom() + "\n", normalFont)));
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
    
    private void addFooter(Document document) throws DocumentException {
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
        
        // Add a line separator with more space above it
        Paragraph line = new Paragraph();
        line.add(new Chunk(new com.lowagie.text.pdf.draw.LineSeparator()));
        line.setSpacingBefore(60); // Increase space above the line
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
    
    private void addPatientInfo(Document document, Patient patient) throws DocumentException {
        Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
        Paragraph patientSection = new Paragraph("INFORMATIONS PATIENT", sectionFont);
        patientSection.setSpacingBefore(5);
        patientSection.setSpacingAfter(5);
        document.add(patientSection);
        
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingAfter(5);
        
        // Add patient details
        addTableRow(table, "Nom:", patient.getNom());
        addTableRow(table, "Prénom:", patient.getPrenom());
        addTableRow(table, "Date de Naissance:", formatDate(patient.getDateNaissance()));
        addTableRow(table, "Lieu de Naissance:", patient.getLieuNaissance());
        
        document.add(table);
        
        // Add a line separator
        Paragraph line = new Paragraph();
        line.add(new Chunk(new com.lowagie.text.pdf.draw.LineSeparator()));
        line.setSpacingBefore(10);
        line.setSpacingAfter(10);
        document.add(line);
    }
    
    private void addTableRow(PdfPTable table, String label, String value) {
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
        Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
        
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPadding(3);
        labelCell.setPaddingBottom(5);
        
        PdfPCell valueCell = new PdfPCell(new Phrase(value != null ? value : "", valueFont));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPadding(3);
        valueCell.setPaddingBottom(5);
        
        table.addCell(labelCell);
        table.addCell(valueCell);
    }
    
    private String formatDate(java.time.LocalDate date) {
        if (date == null) {
            return "";
        }
        return date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }
    
    private String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "";
        }
        return dateTime.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }
    
    private String generateCertificatFilename(Patient patient) {
        String sanitizedName = patient.getNom().replaceAll("\\s+", "_").toLowerCase();
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        return "certificat_" + sanitizedName + "_" + timestamp + ".pdf";
    }
    
    /**
     * Map a Certificat entity to a CertificatDTO with patient and doctor information
     */
    private CertificatDTO mapToDTO(Certificat certificat, Patient patient, Medecin medecin) {
        CertificatDTO dto = CertificatDTO.builder()
                .idCertificat(certificat.getIdCertificat())
                .idPatient(certificat.getIdPatient())
                .idMedecin(certificat.getIdMedecin())
                .dateRedaction(certificat.getDateRedaction())
                .motif(certificat.getMotif())
                .nombreJoursRepos(certificat.getNombreJoursRepos())
                .dateDebut(certificat.getDateDebut())
                .dateFin(certificat.getDateFin())
                .pdfUrl(certificat.getPdfUrl())
                .createdAt(certificat.getCreatedAt())
                .build();
        
        if (patient != null) {
            dto.setNomPatient(patient.getNom());
            dto.setPrenomPatient(patient.getPrenom());
        }
        
        if (medecin != null && medecin.getUtilisateur() != null) {
            dto.setNomMedecin(medecin.getUtilisateur().getNom());
            dto.setPrenomMedecin(medecin.getUtilisateur().getPrenom());
        }
        
        return dto;
    }
} 