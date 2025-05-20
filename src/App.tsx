
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ClientDashboard from "./pages/ClientDashboard";
import ChatAssistantPage from "./pages/ChatAssistantPage";
import NotFound from "./pages/NotFound";
import CandidatesPage from "./pages/CandidatesPage";
import CandidateUploadPage from "./pages/CandidateUploadPage";
import CandidateProfilePage from "./pages/CandidateProfilePage";
import CandidateFormPage from "./pages/CandidateFormPage";
import ClientsPage from "./pages/ClientsPage";
import ClientProfilePage from "./pages/ClientProfilePage";
import ClientFormPage from "./pages/ClientFormPage";
import JobsPage from "./pages/JobsPage";
import JobFormPage from "./pages/JobFormPage";
import JobDetailsPage from "./pages/JobDetailsPage";
import SettingsPage from "./pages/SettingsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import HelpPage from "./pages/HelpPage";
import ClientCandidatesPage from "./pages/ClientCandidatesPage";
import ClientCandidateDetailPage from "./pages/ClientCandidateDetailPage";
import ClientJobsPage from "./pages/ClientJobsPage";
import ClientJobDetailPage from "./pages/ClientJobDetailPage";
import ClientHelpPage from "./pages/ClientHelpPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children, allowedRoles = [] }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex space-x-4">
          <div className="h-12 w-12 bg-primary/20 rounded-full"></div>
          <div className="space-y-4">
            <div className="h-4 w-48 bg-primary/20 rounded"></div>
            <div className="h-4 w-32 bg-primary/20 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole || '')) {
    // Redirect based on role
    if (userRole === 'client') {
      return <Navigate to="/client" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Client protected route
const ClientProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex space-x-4">
          <div className="h-12 w-12 bg-primary/20 rounded-full"></div>
          <div className="space-y-4">
            <div className="h-4 w-48 bg-primary/20 rounded"></div>
            <div className="h-4 w-32 bg-primary/20 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (userRole !== 'client') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Public only route - redirects authenticated users to their dashboard
const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex space-x-4">
          <div className="h-12 w-12 bg-primary/20 rounded-full"></div>
          <div className="space-y-4">
            <div className="h-4 w-48 bg-primary/20 rounded"></div>
            <div className="h-4 w-32 bg-primary/20 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    if (userRole === 'client') {
      return <Navigate to="/client" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route 
      path="/login" 
      element={
        <PublicOnlyRoute>
          <Login />
        </PublicOnlyRoute>
      } 
    />
    
    <Route
      path="/privacy-policy"
      element={<PrivacyPolicyPage />}
    />
    
    <Route
      path="/help"
      element={<HelpPage />}
    />

    {/* Staff/Admin routes */}
    <Route 
      path="/dashboard" 
      element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <Dashboard />
        </ProtectedRoute>
      } 
    />
    
    <Route 
      path="/chat-assistant" 
      element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <ChatAssistantPage />
        </ProtectedRoute>
      } 
    />
    
    <Route
      path="/candidates"
      element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <CandidatesPage />
        </ProtectedRoute>
      }
    />
    
    <Route
      path="/candidates/upload"
      element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <CandidateUploadPage />
        </ProtectedRoute>
      }
    />
    
    <Route
      path="/candidates/new"
      element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <CandidateFormPage />
        </ProtectedRoute>
      }
    />
    
    <Route
      path="/candidates/:id"
      element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <CandidateProfilePage />
        </ProtectedRoute>
      }
    />
    
    <Route
      path="/candidates/:id/edit"
      element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <CandidateFormPage isEdit />
        </ProtectedRoute>
      }
    />
    
    <Route
      path="/clients"
      element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <ClientsPage />
        </ProtectedRoute>
      }
    />
    
    <Route
      path="/clients/new"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ClientFormPage />
        </ProtectedRoute>
      }
    />
    
    <Route
      path="/clients/:id"
      element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <ClientProfilePage />
        </ProtectedRoute>
      }
    />
    
    <Route
      path="/clients/:id/edit"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ClientFormPage isEdit />
        </ProtectedRoute>
      }
    />
    
    <Route
      path="/jobs"
      element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <JobsPage />
        </ProtectedRoute>
      }
    />
    
    <Route
      path="/jobs/new"
      element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <JobFormPage />
        </ProtectedRoute>
      }
    />
    
    <Route
      path="/jobs/:id"
      element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <JobDetailsPage />
        </ProtectedRoute>
      }
    />
    
    <Route
      path="/jobs/:id/edit"
      element={
        <ProtectedRoute allowedRoles={['admin', 'staff']}>
          <JobFormPage isEdit />
        </ProtectedRoute>
      }
    />
    
    <Route
      path="/settings"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <SettingsPage />
        </ProtectedRoute>
      }
    />
    
    {/* Client routes */}
    <Route 
      path="/client" 
      element={
        <ClientProtectedRoute>
          <ClientDashboard />
        </ClientProtectedRoute>
      } 
    />
    
    <Route
      path="/client/candidates"
      element={
        <ClientProtectedRoute>
          <ClientCandidatesPage />
        </ClientProtectedRoute>
      }
    />
    
    <Route
      path="/client/candidates/:id"
      element={
        <ClientProtectedRoute>
          <ClientCandidateDetailPage />
        </ClientProtectedRoute>
      }
    />
    
    <Route
      path="/client/jobs"
      element={
        <ClientProtectedRoute>
          <ClientJobsPage />
        </ClientProtectedRoute>
      }
    />
    
    <Route
      path="/client/jobs/:id"
      element={
        <ClientProtectedRoute>
          <ClientJobDetailPage />
        </ClientProtectedRoute>
      }
    />
    
    <Route
      path="/client/help"
      element={
        <ClientProtectedRoute>
          <ClientHelpPage />
        </ClientProtectedRoute>
      }
    />

    {/* Redirect root path based on authentication */}
    <Route path="/" element={<Navigate to="/login" replace />} />

    {/* Catch-all route */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
