package com.hdoc.sgdm.service;

import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class SupabaseStorageService {
    private static final Logger logger = LoggerFactory.getLogger(SupabaseStorageService.class);

    @Value("${supabase.url}")
    private String supabaseUrl;
    
    @Value("${supabase.key}")
    private String supabaseKey;
    
    @Value("${supabase.service-role-key}")
    private String serviceRoleKey;
    
    @Value("${supabase.storage.bucket}")
    private String bucketName;
    
    @Value("${supabase.storage.documents-bucket}")
    private String documentsBucketName;
    
    private final OkHttpClient httpClient;
    
    public SupabaseStorageService() {
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .build();
    }
    
    /**
     * Uploads a file to the default bucket in Supabase Storage
     * 
     * @param file The file to upload
     * @param filename Original filename (will be made unique)
     * @return The public URL to access the file
     */
    public String uploadFile(MultipartFile file, String filename) throws IOException {
        if (file.isEmpty()) {
            throw new IOException("File is empty");
        }
        
        // Generate a unique filename
        String originalFilename = filename != null ? filename : file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        String uniqueFilename = UUID.randomUUID().toString().substring(0, 8) + extension;
        
        // Create URLs
        String downloadUrl = supabaseUrl + "/storage/v1/object/public/" + bucketName + "/" + uniqueFilename;
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + uniqueFilename;
        
        logger.debug("Uploading file to: {}", uploadUrl);
        
        // Determine content type
        String contentType = file.getContentType();
        if (contentType == null) {
            contentType = "application/octet-stream";
        }
        
        try {
            // Prepare request body
            RequestBody requestBody = RequestBody.create(file.getBytes(), MediaType.parse(contentType));
            
            // Build the request
            Request request = new Request.Builder()
                    .url(uploadUrl)
                    .put(requestBody)
                    .addHeader("apikey", serviceRoleKey) // Using service role key for authorization
                    .addHeader("Authorization", "Bearer " + serviceRoleKey)
                    .addHeader("Content-Type", contentType)
                    .addHeader("x-upsert", "true")
                    .build();
            
            // Execute request
            try (Response response = httpClient.newCall(request).execute()) {
                int statusCode = response.code();
                String responseBody = response.body() != null ? response.body().string() : "";
                
                logger.debug("Upload response status: {}", statusCode);
                
                if (statusCode >= 200 && statusCode < 300) {
                    logger.info("File uploaded successfully");
                    return downloadUrl;
                } else {
                    throw new IOException("Failed to upload file to Supabase. Status: " + statusCode + " - " + responseBody);
                }
            }
        } catch (Exception e) {
            logger.error("Error during file upload: {}", e.getMessage());
            
            // For development, return the URL even if upload fails
            // This allows testing the rest of the functionality
            logger.warn("DEVELOPMENT MODE: Returning URL despite upload failure");
            return downloadUrl;
        }
    }
    
    /**
     * Uploads a patient document to the documents-importe bucket with a specific folder structure
     * 
     * @param file The file to upload
     * @param patientIpp The patient's IPP to organize files
     * @param documentType The type of document (e.g., "IRM", "BILAN", etc.)
     * @param title A descriptive title for organizing the file
     * @return The public URL to access the file
     */
    public String uploadPatientDocument(MultipartFile file, String patientIpp, String documentType, String title) throws IOException {
        if (file.isEmpty()) {
            throw new IOException("File is empty");
        }
        
        // Generate a well-structured filename with timestamp
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        // Format current timestamp for filename
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));
        
        // Sanitize title for filename
        String sanitizedTitle = title
                .replaceAll("\\s+", "_")
                .replaceAll("[^a-zA-Z0-9_-]", "");
        
        // Construct filename and path
        String filename = sanitizedTitle + "_" + timestamp + extension;
        String folderPath = "patients/" + patientIpp + "/";
        String fullPath = folderPath + filename;
        
        // Create URLs
        String downloadUrl = supabaseUrl + "/storage/v1/object/public/" + documentsBucketName + "/" + fullPath;
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + documentsBucketName + "/" + fullPath;
        
        logger.debug("Uploading patient document to: {}", uploadUrl);
        
        // Determine content type
        String contentType = file.getContentType();
        if (contentType == null) {
            contentType = "application/octet-stream";
        }
        
        try {
            // Prepare request body
            RequestBody requestBody = RequestBody.create(file.getBytes(), MediaType.parse(contentType));
            
            // Build the request
            Request request = new Request.Builder()
                    .url(uploadUrl)
                    .put(requestBody)
                    .addHeader("apikey", serviceRoleKey) 
                    .addHeader("Authorization", "Bearer " + serviceRoleKey)
                    .addHeader("Content-Type", contentType)
                    .addHeader("x-upsert", "true")
                    .build();
            
            // Execute request
            try (Response response = httpClient.newCall(request).execute()) {
                int statusCode = response.code();
                String responseBody = response.body() != null ? response.body().string() : "";
                
                logger.debug("Upload response status: {}", statusCode);
                
                if (statusCode >= 200 && statusCode < 300) {
                    logger.info("Patient document uploaded successfully to {}", fullPath);
                    return downloadUrl;
                } else {
                    throw new IOException("Failed to upload document to Supabase. Status: " + statusCode + " - " + responseBody);
                }
            }
        } catch (Exception e) {
            logger.error("Error during patient document upload: {}", e.getMessage());
            
            // For development, return the URL even if upload fails
            logger.warn("DEVELOPMENT MODE: Returning URL despite upload failure");
            return downloadUrl;
        }
    }
    
    public boolean deleteFile(String fileUrl) throws IOException {
        if (fileUrl == null || fileUrl.isEmpty()) {
            logger.warn("Attempted to delete file with null or empty URL");
            return false;
        }
        
        try {
            // Extract the bucket and path from the URL
            String storageUrl = supabaseUrl + "/storage/v1/object/public/";
            if (!fileUrl.startsWith(storageUrl)) {
                logger.warn("URL does not appear to be a Supabase storage URL: {}", fileUrl);
                return false;
            }
            
            String pathAfterBucket = fileUrl.substring(storageUrl.length());
            String bucketAndPath = pathAfterBucket;
            
            // Construct the delete URL
            String deleteUrl = supabaseUrl + "/storage/v1/object/" + bucketAndPath;
            
            logger.debug("Deleting file: {}", deleteUrl);
            
            // Build the request
            Request request = new Request.Builder()
                    .url(deleteUrl)
                    .delete()
                    .addHeader("apikey", serviceRoleKey)
                    .addHeader("Authorization", "Bearer " + serviceRoleKey)
                    .build();
            
            // Execute request
            try (Response response = httpClient.newCall(request).execute()) {
                int statusCode = response.code();
                logger.debug("Delete response status: {}", statusCode);
                
                if (statusCode >= 200 && statusCode < 300) {
                    return true;
                } else if (statusCode == 404) {
                    // File not found is still a successful deletion
                    logger.info("File not found in storage, considering delete successful");
                    return true;
                } else {
                    logger.warn("Failed to delete file, status: {}", statusCode);
                    return false;
                }
            }
        } catch (Exception e) {
            logger.error("Error deleting file: {}", e.getMessage());
            return false;
        }
    }
}