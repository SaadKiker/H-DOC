import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import ProtectedRoute from '../auth/ProtectedRoute';
import Login from '../auth/Login';
import Dashboard from '../dashboard/Dashboard';
import PatientProfileRouter from '../patient/PatientProfile';
import NotesPage from '../notes/NotesPage';
import MedicalFormsPage from '../notes/MedicalFormsPage';
import UsersManagementPage from '../admin/UsersManagementPage';
import EditUserPage from '../admin/EditUserPage';
import CreateUserPage from '../admin/CreateUserPage';
import SpecialtiesManagementPage from '../admin/SpecialtiesManagementPage';
import { ToastProvider } from '../shared/components/ToastContext';
import './styles/global.css';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <AuthProvider>
        <ToastProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Agent routes */}
                <Route path="/agent/patient/new" element={<Dashboard />} />
                <Route path="/agent/patient/edit/:ipp" element={<PatientProfileRouter />} />
                <Route path="/agent/patient/:ipp" element={<PatientProfileRouter />} />
                
                {/* Doctor routes */}
                <Route path="/medecin/patient/:ipp" element={<PatientProfileRouter />} />
                
                {/* Admin routes - mirror of agent routes but view-only */}
                <Route path="/admin/patient/:ipp" element={<PatientProfileRouter />} />
                <Route path="/admin/users" element={<UsersManagementPage />} />
                <Route path="/admin/users/edit/:userId" element={<EditUserPage />} />
                <Route path="/admin/users/new" element={<CreateUserPage />} />
                <Route path="/admin/specialties" element={<SpecialtiesManagementPage />} />
                
                {/* Notes page route */}
                <Route path="/notes" element={<NotesPage />} />
                
                {/* Medical Forms route */}
                <Route path="/medical-forms" element={<MedicalFormsPage />} />
              </Route>
              
              {/* Redirect root to login */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* Fallback for undefined routes */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </div>
  );
}

export default App;