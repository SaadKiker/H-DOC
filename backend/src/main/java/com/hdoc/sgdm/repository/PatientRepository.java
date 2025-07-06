package com.hdoc.sgdm.repository;

import com.hdoc.sgdm.entity.Patient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PatientRepository extends JpaRepository<Patient, UUID> {

    Optional<Patient> findByIdPatient(UUID idPatient);
    
    Optional<Patient> findByIpp(String ipp);
    
    boolean existsByIpp(String ipp);

    Optional<Patient> findByEmail(String email);

    Optional<Patient> findByCin(String cin);

    List<Patient> findByNomContainingIgnoreCase(String nom);

    List<Patient> findByPrenomContainingIgnoreCase(String prenom);

    List<Patient> findByNomContainingIgnoreCaseAndPrenomContainingIgnoreCase(String nom, String prenom);

    List<Patient> findByTypeAdmission(String typeAdmission);
    
    @Query("SELECT MAX(p.ipp) FROM Patient p")
    String findHighestIPP();
    
    /**
     * Find all patients who have had at least one visit with the specified doctor
     * 
     * @param idMedecin The doctor ID
     * @return List of patients with an established relationship
     */
    @Query("SELECT DISTINCT p FROM Patient p JOIN Visite v ON p.idPatient = v.patient.idPatient WHERE v.idMedecin = :idMedecin")
    List<Patient> findPatientsByDoctorId(@Param("idMedecin") UUID idMedecin);
    
    /**
     * Find patients by name (containing) who have had at least one visit with the specified doctor
     * 
     * @param nom Patient last name (partial match)
     * @param idMedecin The doctor ID
     * @return List of matching patients with an established relationship
     */
    @Query("SELECT DISTINCT p FROM Patient p JOIN Visite v ON p.idPatient = v.patient.idPatient WHERE LOWER(p.nom) LIKE LOWER(CONCAT('%', :nom, '%')) AND v.idMedecin = :idMedecin")
    List<Patient> findByNomContainingIgnoreCaseAndDoctorId(@Param("nom") String nom, @Param("idMedecin") UUID idMedecin);
    
    /**
     * Find patients by first name (containing) who have had at least one visit with the specified doctor
     * 
     * @param prenom Patient first name (partial match)
     * @param idMedecin The doctor ID
     * @return List of matching patients with an established relationship
     */
    @Query("SELECT DISTINCT p FROM Patient p JOIN Visite v ON p.idPatient = v.patient.idPatient WHERE LOWER(p.prenom) LIKE LOWER(CONCAT('%', :prenom, '%')) AND v.idMedecin = :idMedecin")
    List<Patient> findByPrenomContainingIgnoreCaseAndDoctorId(@Param("prenom") String prenom, @Param("idMedecin") UUID idMedecin);
    
    /**
     * Find patient by IPP who has had at least one visit with the specified doctor
     * 
     * @param ipp Patient IPP (exact match)
     * @param idMedecin The doctor ID
     * @return Optional containing the patient if found
     */
    @Query("SELECT DISTINCT p FROM Patient p JOIN Visite v ON p.idPatient = v.patient.idPatient WHERE p.ipp = :ipp AND v.idMedecin = :idMedecin")
    Optional<Patient> findByIppAndDoctorId(@Param("ipp") String ipp, @Param("idMedecin") UUID idMedecin);
    
    /**
     * Find patient by CIN who has had at least one visit with the specified doctor
     * 
     * @param cin Patient CIN (exact match)
     * @param idMedecin The doctor ID
     * @return Optional containing the patient if found
     */
    @Query("SELECT DISTINCT p FROM Patient p JOIN Visite v ON p.idPatient = v.patient.idPatient WHERE p.cin = :cin AND v.idMedecin = :idMedecin")
    Optional<Patient> findByCinAndDoctorId(@Param("cin") String cin, @Param("idMedecin") UUID idMedecin);
}