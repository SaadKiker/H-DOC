import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Patient } from '../dashboard/types';

interface PatientContextType {
  patient: Patient | null;
  setPatient: (patient: Patient | null) => void;
}

// Create a context with a default value
export const PatientContext = createContext<PatientContextType | null>(null);

// Provider component
interface PatientProviderProps {
  children: ReactNode;
  initialPatient?: Patient | null;
}

export const PatientProvider: React.FC<PatientProviderProps> = ({
  children,
  initialPatient = null,
}) => {
  const [patient, setPatient] = useState<Patient | null>(initialPatient);

  return (
    <PatientContext.Provider value={{ patient, setPatient }}>
      {children}
    </PatientContext.Provider>
  );
};

// Custom hook to use the patient context
export const usePatient = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
}; 