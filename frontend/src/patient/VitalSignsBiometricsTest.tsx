import React, { useState } from 'react';
import VitalSignsBiometrics from './VitalSignsBiometrics';

/**
 * This is a test/demo component to show how VitalSignsBiometrics should be integrated
 * into the patient profile application.
 */
const VitalSignsBiometricsTest: React.FC = () => {
  const [isFormVisible, setIsFormVisible] = useState<boolean>(false);
  
  // Example patient data
  const patientData = {
    patientIPP: "12345678",
    patientId: "965c3955-fe6b-4edf-b4a3-93ff138cfac4", // Must be a valid UUID in the system
    activeVisitId: 81, // Must be a valid visit ID
  };
  
  // Mock doctor ID function
  const getCurrentDoctorId = () => {
    return "141fc646-b241-4893-b87c-2bc542fe9bc3"; // Must be a valid doctor ID
  };
  
  // Form visibility handler
  const handleFormVisibilityChange = (isVisible: boolean) => {
    setIsFormVisible(isVisible);
    console.log(`Form visibility changed to: ${isVisible}`);
  };
  
  // Open form handler
  const handleOpenForm = (modelId: number) => {
    console.log(`Opening form with model ID: ${modelId}`);
    setIsFormVisible(true);
  };

  return (
    <div className="test-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1>Vital Signs & Biometrics Demo</h1>
        <p>This demonstrates the implementation of the Signes vitaux et biométrie page</p>
      </header>
      
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <VitalSignsBiometrics 
          patientIPP={patientData.patientIPP}
          patientId={patientData.patientId}
          activeVisitId={patientData.activeVisitId}
          getCurrentDoctorId={getCurrentDoctorId}
          openForm={handleOpenForm}
          onFormVisibilityChange={handleFormVisibilityChange}
        />
      </div>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#eee', borderRadius: '4px' }}>
        <p>Form visibility status: <strong>{isFormVisible ? 'Open' : 'Closed'}</strong></p>
      </div>
    </div>
  );
};

export default VitalSignsBiometricsTest; 