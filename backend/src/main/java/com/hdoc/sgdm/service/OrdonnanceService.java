package com.hdoc.sgdm.service;

import com.hdoc.sgdm.dto.request.OrdonnanceRequest;
import com.hdoc.sgdm.dto.request.PrescriptionRequest;
import com.hdoc.sgdm.dto.request.EmptyOrdonnanceRequest;
import com.hdoc.sgdm.dto.response.MedicamentDTO;
import com.hdoc.sgdm.dto.response.OrdonnanceDTO;
import com.hdoc.sgdm.dto.response.PrescriptionDTO;
import com.hdoc.sgdm.entity.Medicament;
import com.hdoc.sgdm.entity.Medecin;
import com.hdoc.sgdm.entity.Ordonnance;
import com.hdoc.sgdm.entity.Patient;
import com.hdoc.sgdm.entity.Prescription;
import com.hdoc.sgdm.entity.Visite;
import com.hdoc.sgdm.exception.ResourceNotFoundException;
import com.hdoc.sgdm.repository.MedicamentRepository;
import com.hdoc.sgdm.repository.MedecinRepository;
import com.hdoc.sgdm.repository.OrdonnanceRepository;
import com.hdoc.sgdm.repository.PatientRepository;
import com.hdoc.sgdm.repository.PrescriptionRepository;
import com.hdoc.sgdm.repository.VisiteRepository;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.Chunk;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrdonnanceService {
    private static final Logger logger = LoggerFactory.getLogger(OrdonnanceService.class);
    
    private final OrdonnanceRepository ordonnanceRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicamentRepository medicamentRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final VisiteRepository visiteRepository;
    
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
     * Create a new ordonnance with prescriptions
     * 
     * @param request Ordonnance creation request data
     * @return The created ordonnance DTO with prescriptions
     */
    @Transactional
    public OrdonnanceDTO createOrdonnance(OrdonnanceRequest request) {
        // Verify that patient and doctor exist
        Patient patient = patientRepository.findByIdPatient(request.getIdPatient())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + request.getIdPatient()));
        
        Medecin medecin = medecinRepository.findByIdWithUtilisateur(request.getIdMedecin())
                .orElseThrow(() -> new ResourceNotFoundException("Médecin not found with ID: " + request.getIdMedecin()));
        
        // Verify that visite exists
        Visite visite = visiteRepository.findById(request.getIdVisite())
                .orElseThrow(() -> new ResourceNotFoundException("Visite not found with ID: " + request.getIdVisite()));
        
        // Check if an active ordonnance already exists for this patient and visit
        Ordonnance ordonnance = ordonnanceRepository.findByIdPatientAndIdVisiteAndStatut(
                request.getIdPatient(), 
                request.getIdVisite(), 
                "en_cours")
                .orElse(null);
        
        // If no active ordonnance exists, create a new one
        if (ordonnance == null) {
            ordonnance = Ordonnance.builder()
                    .idPatient(request.getIdPatient())
                    .idMedecin(request.getIdMedecin())
                    .idVisite(request.getIdVisite())
                    .dateCreation(LocalDateTime.now())
                    .statut("en_cours")
                    .build();
            
            // Save ordonnance first to get its ID
            ordonnance = ordonnanceRepository.save(ordonnance);
        }
        
        // Process prescriptions
        List<Prescription> prescriptions = new ArrayList<>();
        
        if (request.getPrescriptions() != null && !request.getPrescriptions().isEmpty()) {
            for (PrescriptionRequest prescriptionRequest : request.getPrescriptions()) {
                Medicament medicament = medicamentRepository.findById(prescriptionRequest.getIdMedicament())
                        .orElseThrow(() -> new ResourceNotFoundException("Medicament not found with ID: " + prescriptionRequest.getIdMedicament()));
                
                Prescription prescription = Prescription.builder()
                        .ordonnance(ordonnance)
                        .medicament(medicament)
                        .dosage(prescriptionRequest.getDosage())
                        .uniteDosage(prescriptionRequest.getUniteDosage())
                        .route(prescriptionRequest.getRoute())
                        .frequence(prescriptionRequest.getFrequence())
                        .instructions(prescriptionRequest.getInstructions())
                        .dateDebut(prescriptionRequest.getDateDebut())
                        .duree(prescriptionRequest.getDuree())
                        .dureeUnite(prescriptionRequest.getDureeUnite())
                        .build();
                
                prescriptions.add(prescriptionRepository.save(prescription));
            }
        } else {
            // Get existing prescriptions if we're using an existing ordonnance
            prescriptions = prescriptionRepository.findAllByOrdonnance(ordonnance);
        }
        
        // Generate PDF and upload it if requested by the user (this will be controlled by frontend)
        // For now, we'll leave the ordonnance in "en_cours" status
        
        // Map to DTO and return
        return mapToDTO(ordonnance, prescriptions, patient, medecin);
    }
    
    /**
     * Get all ordonnances for a patient
     * 
     * @param idPatient Patient's ID
     * @return List of ordonnances with prescriptions
     */
    public List<OrdonnanceDTO> getOrdonnancesForPatient(UUID idPatient) {
        // Verify patient exists
        Patient patient = patientRepository.findByIdPatient(idPatient)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + idPatient));
        
        // Get ordonnances
        List<Ordonnance> ordonnances = ordonnanceRepository.findAllByIdPatientOrderByDateCreationDesc(idPatient);
        
        // Convert to DTOs with prescriptions
        return ordonnances.stream()
                .map(ordonnance -> {
                    Medecin medecin = medecinRepository.findByIdWithUtilisateur(ordonnance.getIdMedecin())
                            .orElse(null);
                    
                    List<Prescription> prescriptions = prescriptionRepository.findAllByOrdonnance(ordonnance);
                    
                    return mapToDTO(ordonnance, prescriptions, patient, medecin);
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Get all ordonnances for a visite
     * 
     * @param idVisite Visite ID
     * @return List of ordonnances with prescriptions
     */
    public List<OrdonnanceDTO> getOrdonnancesForVisite(Long idVisite) {
        // Verify visite exists
        Visite visite = visiteRepository.findById(idVisite)
                .orElseThrow(() -> new ResourceNotFoundException("Visite not found with ID: " + idVisite));
        
        // Get ordonnances
        List<Ordonnance> ordonnances = ordonnanceRepository.findAllByIdVisiteOrderByDateCreationDesc(idVisite);
        
        // Convert to DTOs with prescriptions
        return ordonnances.stream()
                .map(ordonnance -> {
                    Patient patient = patientRepository.findByIdPatient(ordonnance.getIdPatient())
                            .orElse(null);
                    
                    Medecin medecin = medecinRepository.findByIdWithUtilisateur(ordonnance.getIdMedecin())
                            .orElse(null);
                    
                    List<Prescription> prescriptions = prescriptionRepository.findAllByOrdonnance(ordonnance);
                    
                    return mapToDTO(ordonnance, prescriptions, patient, medecin);
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Get a specific ordonnance by ID
     * 
     * @param idOrdonnance Ordonnance ID
     * @return The ordonnance DTO with prescriptions
     */
    public OrdonnanceDTO getOrdonnanceById(Long idOrdonnance) {
        // Get ordonnance
        Ordonnance ordonnance = ordonnanceRepository.findById(idOrdonnance)
                .orElseThrow(() -> new ResourceNotFoundException("Ordonnance not found with ID: " + idOrdonnance));
        
        // Get related entities
        Patient patient = patientRepository.findByIdPatient(ordonnance.getIdPatient())
                .orElse(null);
        
        Medecin medecin = medecinRepository.findByIdWithUtilisateur(ordonnance.getIdMedecin())
                .orElse(null);
        
        List<Prescription> prescriptions = prescriptionRepository.findAllByOrdonnance(ordonnance);
        
        // Convert to DTO
        return mapToDTO(ordonnance, prescriptions, patient, medecin);
    }
    
    /**
     * Convert Ordonnance entity to DTO with prescriptions
     */
    private OrdonnanceDTO mapToDTO(Ordonnance ordonnance, List<Prescription> prescriptions, Patient patient, Medecin medecin) {
        OrdonnanceDTO dto = OrdonnanceDTO.builder()
                .idOrdonnance(ordonnance.getIdOrdonnance())
                .idPatient(ordonnance.getIdPatient())
                .idVisite(ordonnance.getIdVisite())
                .idMedecin(ordonnance.getIdMedecin())
                .dateCreation(ordonnance.getDateCreation())
                .url(ordonnance.getUrl())
                .statut(ordonnance.getStatut())
                .build();
        
        // Add patient info if available
        if (patient != null) {
            dto.setNomPatient(patient.getNom());
            dto.setPrenomPatient(patient.getPrenom());
        }
        
        // Add doctor info if available
        if (medecin != null && medecin.getUtilisateur() != null) {
            dto.setNomMedecin(medecin.getUtilisateur().getNom());
            dto.setPrenomMedecin(medecin.getUtilisateur().getPrenom());
        }
        
        // Map prescriptions to DTOs
        List<PrescriptionDTO> prescriptionDTOs = prescriptions.stream()
                .map(this::mapToPrescriptionDTO)
                .collect(Collectors.toList());
        
        dto.setPrescriptions(prescriptionDTOs);
        
        return dto;
    }
    
    /**
     * Convert Prescription entity to DTO
     */
    private PrescriptionDTO mapToPrescriptionDTO(Prescription prescription) {
        // Map the medicament to DTO
        MedicamentDTO medicamentDTO = MedicamentDTO.builder()
                .idMedicament(prescription.getMedicament().getIdMedicament())
                .nom(prescription.getMedicament().getNom())
                .description(prescription.getMedicament().getDescription())
                .build();
        
        return PrescriptionDTO.builder()
                .idPrescription(prescription.getIdPrescription())
                .medicament(medicamentDTO)
                .dosage(prescription.getDosage())
                .uniteDosage(prescription.getUniteDosage())
                .route(prescription.getRoute())
                .frequence(prescription.getFrequence())
                .instructions(prescription.getInstructions())
                .dateDebut(prescription.getDateDebut())
                .duree(prescription.getDuree())
                .dureeUnite(prescription.getDureeUnite())
                .build();
    }
    
    /**
     * Generate PDF for an ordonnance
     */
    private byte[] generateOrdonnancePDF(Ordonnance ordonnance, List<Prescription> prescriptions, 
                                        Patient patient, Medecin medecin) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        try {
            // Create PDF document
            Document document = new Document(PageSize.A4);
            document.setMargins(36, 36, 72, 36); // left, right, top, bottom (in points)
            PdfWriter pdfWriter = PdfWriter.getInstance(document, baos);
            document.open();
            
            // Add logo to the top-left corner
            addLogo(document);
            
            // Add ordonnance title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Font.BOLD);
            Paragraph title = new Paragraph("ORDONNANCE MÉDICALE", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);
            
            // Add patient information
            addPatientInfo(document, patient);
            
            // Add prescriptions
            addPrescriptions(document, prescriptions);
            
            // Add flexible space
            addFlexibleSpace(document);
            
            // Add doctor and date section
            addDoctorSection(document, medecin, ordonnance.getDateCreation());
            
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
    
    /**
     * Add patient information to the PDF
     */
    private void addPatientInfo(Document document, Patient patient) throws DocumentException {
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
        Font contentFont = FontFactory.getFont(FontFactory.HELVETICA, 11);
        
        // Add a section title
        Paragraph patientSection = new Paragraph("INFORMATIONS PATIENT", headerFont);
        patientSection.setSpacingBefore(5);
        patientSection.setSpacingAfter(5);
        document.add(patientSection);
        
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        
        // Patient name and age
        PdfPCell cell1 = new PdfPCell();
        
        // Add "Nom et Prénom:" label and value
        Paragraph nomPara = new Paragraph();
        nomPara.add(new Phrase("Nom et Prénom: ", headerFont));
        nomPara.add(new Phrase(patient.getNom() + " " + patient.getPrenom(), contentFont));
        cell1.addElement(nomPara);
        
        // Calculate age if birthdate is available
        if (patient.getDateNaissance() != null) {
            int age = java.time.Period.between(patient.getDateNaissance(), java.time.LocalDate.now()).getYears();
            Paragraph agePara = new Paragraph();
            agePara.add(new Phrase("Age: ", headerFont));
            agePara.add(new Phrase(age + " ans", contentFont));
            cell1.addElement(agePara);
        }
        
        cell1.setBorder(Rectangle.NO_BORDER);
        cell1.setPadding(5);
        
        // Patient information (date of birth, gender)
        PdfPCell cell2 = new PdfPCell();
        
        if (patient.getDateNaissance() != null) {
            Paragraph dobPara = new Paragraph();
            dobPara.add(new Phrase("Date de naissance: ", headerFont));
            dobPara.add(new Phrase(formatDate(patient.getDateNaissance()), contentFont));
            cell2.addElement(dobPara);
        }
        
        if (patient.getSexe() != null) {
            Paragraph sexePara = new Paragraph();
            sexePara.add(new Phrase("Sexe: ", headerFont));
            sexePara.add(new Phrase((patient.getSexe().equals("M") ? "Masculin" : "Féminin"), contentFont));
            cell2.addElement(sexePara);
        }
        
        cell2.setBorder(Rectangle.NO_BORDER);
        cell2.setPadding(5);
        
        table.addCell(cell1);
        table.addCell(cell2);
        table.setSpacingAfter(10);
        
        document.add(table);
        
        // Add a line separator
        Paragraph line = new Paragraph();
        line.add(new Chunk(new com.lowagie.text.pdf.draw.LineSeparator()));
        line.setSpacingAfter(15);
        document.add(line);
    }
    
    /**
     * Add flexible space to push the doctor section to the bottom of the page
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
     * Add doctor information and signature section to the PDF
     */
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
    
    /**
     * Add footer with hospital contact information to the PDF
     */
    private void addFooter(Document document) throws DocumentException {
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
        
        // Add a line separator with less space above it
        Paragraph line = new Paragraph();
        line.add(new Chunk(new com.lowagie.text.pdf.draw.LineSeparator()));
        line.setSpacingBefore(10); // Decrease space above the line
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
     * Add prescriptions to the PDF
     */
    private void addPrescriptions(Document document, List<Prescription> prescriptions) throws DocumentException {
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
        Font medicamentFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
        Font detailsFont = FontFactory.getFont(FontFactory.HELVETICA, 11);
        
        // Prescription list title
        Paragraph prescriptionTitle = new Paragraph("PRESCRIPTIONS", headerFont);
        prescriptionTitle.setSpacingAfter(10);
        document.add(prescriptionTitle);
        
        // If no prescriptions, show message
        if (prescriptions == null || prescriptions.isEmpty()) {
            Paragraph noMeds = new Paragraph("Aucun médicament prescrit", detailsFont);
            noMeds.setIndentationLeft(10);
            document.add(noMeds);
            return;
        }
        
        // Create a table for prescriptions
        PdfPTable table = new PdfPTable(1);
        table.setWidthPercentage(100);
        table.setSpacingAfter(15);
        
        // List each prescription
        for (int i = 0; i < prescriptions.size(); i++) {
            Prescription prescription = prescriptions.get(i);
            
            PdfPCell cell = new PdfPCell();
            cell.setPadding(10);
            cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            
            // Create a nested table for better vertical alignment
            PdfPTable contentTable = new PdfPTable(1);
            contentTable.setWidthPercentage(100);
            
            // Medication name
            PdfPCell nameCell = new PdfPCell(new Phrase((i+1) + ". " + prescription.getMedicament().getNom(), medicamentFont));
            nameCell.setBorder(Rectangle.NO_BORDER);
            nameCell.setPaddingBottom(5);
            contentTable.addCell(nameCell);
            
            // LINE 1: Dosage and route information in one line
            StringBuilder line1 = new StringBuilder();
            if (prescription.getDosage() != null && prescription.getUniteDosage() != null) {
                line1.append("Dosage: ").append(prescription.getDosage())
                     .append(" ").append(prescription.getUniteDosage());
            }
            
            // Add route if available
            if (prescription.getRoute() != null && !prescription.getRoute().isEmpty()) {
                if (line1.length() > 0) line1.append(", ");
                line1.append("Voie: ").append(prescription.getRoute());
            }
            
            // Add line 1 if available
            if (line1.length() > 0) {
                PdfPCell line1Cell = new PdfPCell(new Phrase(line1.toString(), detailsFont));
                line1Cell.setBorder(Rectangle.NO_BORDER);
                line1Cell.setPaddingLeft(10);
                line1Cell.setPaddingBottom(5);
                contentTable.addCell(line1Cell);
            }
            
            // LINE 2: Frequency and duration information in one line
            StringBuilder line2 = new StringBuilder();
            if (prescription.getFrequence() != null && !prescription.getFrequence().isEmpty()) {
                line2.append("Fréquence: ").append(prescription.getFrequence());
            }
            
            // Add duration information
            if (prescription.getDuree() != null && prescription.getDureeUnite() != null) {
                if (line2.length() > 0) line2.append(", ");
                line2.append("Durée: ").append(prescription.getDuree())
                       .append(" ").append(prescription.getDureeUnite());
            }
            
            // Add line 2 if available
            if (line2.length() > 0) {
                PdfPCell line2Cell = new PdfPCell(new Phrase(line2.toString(), detailsFont));
                line2Cell.setBorder(Rectangle.NO_BORDER);
                line2Cell.setPaddingLeft(10);
                line2Cell.setPaddingBottom(5);
                contentTable.addCell(line2Cell);
            }
            
            // LINE 3: Start date in one line
            if (prescription.getDateDebut() != null) {
                PdfPCell dateCell = new PdfPCell(
                    new Phrase("Date de début: " + formatDate(prescription.getDateDebut()), detailsFont));
                dateCell.setBorder(Rectangle.NO_BORDER);
                dateCell.setPaddingLeft(10);
                dateCell.setPaddingBottom(5);
                contentTable.addCell(dateCell);
            }
            
            // Add instructions if available
            if (prescription.getInstructions() != null && !prescription.getInstructions().isEmpty()) {
                PdfPCell instructionsCell = new PdfPCell(
                    new Phrase("Instructions: " + prescription.getInstructions(), detailsFont));
                instructionsCell.setBorder(Rectangle.NO_BORDER);
                instructionsCell.setPaddingLeft(10);
                contentTable.addCell(instructionsCell);
            }
            
            // Add the content table to the main cell
            cell.addElement(contentTable);
            
            table.addCell(cell);
        }
        
        document.add(table);
    }
    
    /**
     * Uploads a PDF file to Supabase Storage
     * 
     * @param pdfData The PDF content as byte array
     * @param filename The filename to use
     * @return The public URL to access the file
     */
    private String uploadPDFToSupabase(byte[] pdfData, String filename) throws IOException {
        // Create URLs for the ordonnances bucket
        String bucketName = "ordonnances";
        
        // Ensure the ordonnances bucket exists
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
        try {
            // First, check if bucket exists
            String bucketUrl = supabaseUrl + "/storage/v1/bucket/" + bucketName;
            
            Request checkRequest = new Request.Builder()
                    .url(bucketUrl)
                    .get()
                    .addHeader("Authorization", "Bearer " + serviceRoleKey)
                    .addHeader("apikey", serviceRoleKey)
                    .build();
            
            boolean bucketExists = false;
            
            try (Response checkResponse = httpClient.newCall(checkRequest).execute()) {
                // 200 = bucket exists, other codes = it doesn't
                bucketExists = checkResponse.code() == 200;
            }
            
            // If bucket doesn't exist, create it
            if (!bucketExists) {
                logger.info("Bucket {} doesn't exist, creating...", bucketName);
                
                String createUrl = supabaseUrl + "/storage/v1/bucket";
                
                String jsonBody = "{\"id\":\"" + bucketName + "\",\"name\":\"" + bucketName 
                        + "\",\"public\":true,\"file_size_limit\":null}";
                
                RequestBody createBody = RequestBody.create(jsonBody, MediaType.parse("application/json"));
                
                Request createRequest = new Request.Builder()
                        .url(createUrl)
                        .post(createBody)
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
            }
        } catch (Exception e) {
            logger.error("Error checking/creating bucket {}: {}", bucketName, e.getMessage());
        }
    }
    
    /**
     * Format a date to a display-friendly format
     */
    private String formatDate(java.time.LocalDate date) {
        if (date == null) {
            return "";
        }
        return date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }
    
    /**
     * Format a date-time to a display-friendly format
     */
    private String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "";
        }
        return dateTime.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }
    
    /**
     * Generate a filename for the ordonnance PDF
     */
    private String generateOrdonnanceFilename(Patient patient) {
        String sanitizedName = patient.getNom().replaceAll("\\s+", "_").toLowerCase();
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        return "ordonnance_" + sanitizedName + "_" + timestamp + ".pdf";
    }
    
    /**
     * Create a new empty ordonnance without prescriptions
     * 
     * @param request Empty ordonnance creation request data
     * @return The created empty ordonnance DTO
     */
    @Transactional
    public OrdonnanceDTO createEmptyOrdonnance(EmptyOrdonnanceRequest request) {
        // Verify that patient and doctor exist
        Patient patient = patientRepository.findByIdPatient(request.getIdPatient())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + request.getIdPatient()));
        
        Medecin medecin = medecinRepository.findByIdWithUtilisateur(request.getIdMedecin())
                .orElseThrow(() -> new ResourceNotFoundException("Médecin not found with ID: " + request.getIdMedecin()));
        
        // Verify that visite exists
        Visite visite = visiteRepository.findById(request.getIdVisite())
                .orElseThrow(() -> new ResourceNotFoundException("Visite not found with ID: " + request.getIdVisite()));
        
        // Check if an active ordonnance already exists for this patient and visit
        Ordonnance ordonnance = ordonnanceRepository.findByIdPatientAndIdVisiteAndStatut(
                request.getIdPatient(), 
                request.getIdVisite(), 
                "en_cours")
                .orElse(null);
        
        // If no active ordonnance exists, create a new one
        if (ordonnance == null) {
            ordonnance = Ordonnance.builder()
                    .idPatient(request.getIdPatient())
                    .idMedecin(request.getIdMedecin())
                    .idVisite(request.getIdVisite())
                    .dateCreation(LocalDateTime.now())
                    .statut("en_cours")
                    .build();
            
            // Save ordonnance
            ordonnance = ordonnanceRepository.save(ordonnance);
        }
        
        // Get existing prescriptions if we're using an existing ordonnance
        List<Prescription> prescriptions = prescriptionRepository.findAllByOrdonnance(ordonnance);
        
        // Map to DTO and return
        return mapToDTO(ordonnance, prescriptions, patient, medecin);
    }
    
    /**
     * Generate PDF for an existing ordonnance
     * 
     * @param idOrdonnance Ordonnance ID
     * @return The updated ordonnance DTO with PDF URL
     */
    @Transactional
    public OrdonnanceDTO generateOrdonnancePDF(Long idOrdonnance) {
        // Verify ordonnance exists
        final Ordonnance ordonnanceEntity = ordonnanceRepository.findById(idOrdonnance)
                .orElseThrow(() -> new ResourceNotFoundException("Ordonnance not found with ID: " + idOrdonnance));
        
        // Get patient and doctor
        final Patient patient = patientRepository.findByIdPatient(ordonnanceEntity.getIdPatient())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + ordonnanceEntity.getIdPatient()));
        
        final Medecin medecin = medecinRepository.findByIdWithUtilisateur(ordonnanceEntity.getIdMedecin())
                .orElseThrow(() -> new ResourceNotFoundException("Médecin not found with ID: " + ordonnanceEntity.getIdMedecin()));
        
        // Get prescriptions
        final List<Prescription> prescriptions = prescriptionRepository.findAllByOrdonnance(ordonnanceEntity);
        
        // Generate PDF and upload it
        try {
            byte[] pdfData = generateOrdonnancePDF(ordonnanceEntity, prescriptions, patient, medecin);
            String filename = generateOrdonnanceFilename(patient);
            String pdfUrl = uploadPDFToSupabase(pdfData, filename);
            
            // Update ordonnance with PDF URL and set status to finalise
            ordonnanceEntity.setUrl(pdfUrl);
            ordonnanceEntity.setStatut("finalise");
            Ordonnance updatedOrdonnance = ordonnanceRepository.save(ordonnanceEntity);
            
            // Map to DTO with prescriptions and return
            return mapToDTO(updatedOrdonnance, prescriptions, patient, medecin);
            
        } catch (IOException e) {
            logger.error("Error generating PDF for ordonnance", e);
            throw new RuntimeException("Failed to generate PDF for ordonnance", e);
        }
    }
    
    /**
     * Delete an ordonnance and its associated prescriptions
     * 
     * @param idOrdonnance Ordonnance ID
     * @throws ResourceNotFoundException if ordonnance not found
     */
    @Transactional
    public void deleteOrdonnance(Long idOrdonnance) {
        // Verify ordonnance exists
        Ordonnance ordonnance = ordonnanceRepository.findById(idOrdonnance)
                .orElseThrow(() -> new ResourceNotFoundException("Ordonnance not found with ID: " + idOrdonnance));
        
        // Get all prescriptions for this ordonnance
        List<Prescription> prescriptions = prescriptionRepository.findAllByOrdonnance(ordonnance);
        
        // Delete all prescriptions first
        if (!prescriptions.isEmpty()) {
            logger.info("Deleting {} prescription(s) associated with ordonnance ID: {}", prescriptions.size(), idOrdonnance);
            prescriptionRepository.deleteAll(prescriptions);
        }
        
        // Delete the ordonnance
        ordonnanceRepository.delete(ordonnance);
        logger.info("Ordonnance deleted with ID: {}", idOrdonnance);
    }
} 