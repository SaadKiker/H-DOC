package com.hdoc.sgdm.util;

import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.hdoc.sgdm.repository.PatientRepository;

import jakarta.annotation.PostConstruct;

@Component
public class IPPGenerator {
    
    private AtomicInteger counter;
    private static final String IPP_PREFIX = "P";
    private static final int IPP_NUMERIC_LENGTH = 6; // Will result in P000001 format
    
    private final PatientRepository patientRepository;
    
    @Autowired
    public IPPGenerator(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }
    
    @PostConstruct
    public void initialize() {
        // Find the highest existing IPP and initialize the counter
        String highestIPP = patientRepository.findHighestIPP();
        
        if (highestIPP == null || highestIPP.isEmpty()) {
            counter = new AtomicInteger(0);
        } else {
            try {
                // Extract the numeric part from the highest IPP (e.g., "P000123" -> 123)
                String numericPart = highestIPP.substring(IPP_PREFIX.length());
                int highestValue = Integer.parseInt(numericPart);
                counter = new AtomicInteger(highestValue);
            } catch (NumberFormatException | IndexOutOfBoundsException e) {
                // If there's an error parsing, start from 0
                counter = new AtomicInteger(0);
            }
        }
    }
    
    public String generateIPP() {
        int nextValue = counter.incrementAndGet();
        
        // Format with leading zeros
        String numericPart = String.format("%0" + IPP_NUMERIC_LENGTH + "d", nextValue);
        
        return IPP_PREFIX + numericPart;
    }
}