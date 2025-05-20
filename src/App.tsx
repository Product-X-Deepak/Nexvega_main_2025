
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

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect based on role
    if (userRole === 'client') {
      return <Navigate to="/client" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Client protected route
const ClientProtectedRoute = ({ children }) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (userRole !== 'client') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public only route - redirects authenticated users to their dashboard
const PublicOnlyRoute = ({ children }) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    if (userRole === 'client') {
      return <Navigate to="/client" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
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
    
    {/* Client routes */}
    <Route 
      path="/client" 
      element={
        <ClientProtectedRoute>
          <ClientDashboard />
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
