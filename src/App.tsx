
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CandidatesPage from './pages/CandidatesPage';
import ClientsPage from './pages/ClientsPage';
import JobsPage from './pages/JobsPage';
import ChatAssistantPage from './pages/ChatAssistantPage';
import CandidateFormPage from './pages/CandidateFormPage';
import CandidateProfilePage from './pages/CandidateProfilePage';
import CandidateUploadPage from './pages/CandidateUploadPage';
import ClientDashboard from './pages/ClientDashboard';
import ClientFormPage from './pages/ClientFormPage';
import NotFound from './pages/NotFound';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import HelpPage from './pages/HelpPage';

// Client pages
import ClientCandidatesPage from './pages/ClientCandidatesPage';
import ClientCandidateDetailPage from './pages/ClientCandidateDetailPage';
import ClientJobsPage from './pages/ClientJobsPage';
import ClientJobDetailPage from './pages/ClientJobDetailPage';
import ClientProfilePage from './pages/ClientProfilePage';
import ClientHelpPage from './pages/ClientHelpPage';

function App() {
  const { user, userRole, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to={userRole === 'client' ? '/client' : '/dashboard'} />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/help" element={<HelpPage />} />
      
      {/* Protected routes for Admin and Staff */}
      {user && userRole !== 'client' && (
        <>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/candidates" element={<CandidatesPage />} />
          <Route path="/candidates/new" element={<CandidateFormPage />} />
          <Route path="/candidates/upload" element={<CandidateUploadPage />} />
          <Route path="/candidates/:id" element={<CandidateProfilePage />} />
          <Route path="/candidates/:id/edit" element={<CandidateFormPage isEdit={true} />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/new" element={<ClientFormPage />} />
          <Route path="/clients/:id" element={<ClientFormPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/ai-assistant" element={<ChatAssistantPage />} />
        </>
      )}
      
      {/* Protected routes for Clients */}
      {user && userRole === 'client' && (
        <>
          <Route path="/client" element={<ClientDashboard />} />
          <Route path="/client/candidates" element={<ClientCandidatesPage />} />
          <Route path="/client/candidates/:id" element={<ClientCandidateDetailPage />} />
          <Route path="/client/jobs" element={<ClientJobsPage />} />
          <Route path="/client/jobs/:id" element={<ClientJobDetailPage />} />
          <Route path="/client/profile" element={<ClientProfilePage />} />
          <Route path="/client/help" element={<ClientHelpPage />} />
        </>
      )}
      
      {/* Redirect based on authentication status */}
      <Route path="/" element={
        user 
          ? userRole === 'client' 
            ? <Navigate to="/client" /> 
            : <Navigate to="/dashboard" />
          : <Navigate to="/login" />
      } />
      
      {/* 404 route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
