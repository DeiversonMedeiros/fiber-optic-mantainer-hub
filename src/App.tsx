import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import UserManagement from "./pages/UserManagement";
import MyReports from "./pages/MyReports";
import ReportValidation from "./pages/ReportValidation";
import MyAdjustments from "./pages/MyAdjustments";
import MaterialControl from "./pages/MaterialControl";
import PreventiveMaintenance from "./pages/PreventiveMaintenance";
import Preventivas from "./pages/Preventivas";
import Vistoria from "./pages/Vistoria";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// ID do perfil de acesso "Técnico"
const TECNICO_PROFILE_ID = '38a5d358-75d6-4ae6-a109-1456a7dba714';

// Componente para redirecionar baseado no perfil
const ProfileBasedRedirect = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const location = useLocation();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('access_profile_id')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Só redireciona se estiver na rota "/dashboard"
  if (
    !isLoading &&
    profile?.access_profile_id === TECNICO_PROFILE_ID &&
    location.pathname === "/dashboard"
  ) {
    return <Navigate to="/my-reports" replace />;
  }

  return <>{children}</>;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-fiber-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <div className="w-8 h-8 bg-primary rounded-full"></div>
          </div>
          <p className="text-white">Carregando SGM...</p>
        </div>
      </div>
    );
  }

  return user ? (
    <AppLayout>
      <ProfileBasedRedirect>
        {children}
      </ProfileBasedRedirect>
    </AppLayout>
  ) : (
    <Navigate to="/auth" replace />
  );
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-fiber-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <div className="w-8 h-8 bg-primary rounded-full"></div>
          </div>
          <p className="text-white">Carregando SGM...</p>
        </div>
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth" element={
        <PublicRoute>
          <Auth />
        </PublicRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute>
          <UserManagement />
        </ProtectedRoute>
      } />
      <Route path="/my-reports" element={
        <ProtectedRoute>
          <MyReports />
        </ProtectedRoute>
      } />
      <Route path="/report-validation" element={
        <ProtectedRoute>
          <ReportValidation />
        </ProtectedRoute>
      } />
      <Route path="/my-adjustments" element={
        <ProtectedRoute>
          <MyAdjustments />
        </ProtectedRoute>
      } />
      <Route path="/material-control" element={
        <ProtectedRoute>
          <MaterialControl />
        </ProtectedRoute>
      } />
      <Route path="/preventive-maintenance" element={
        <ProtectedRoute>
          <PreventiveMaintenance />
        </ProtectedRoute>
      } />
      <Route path="/preventivas" element={
        <ProtectedRoute>
          <Preventivas />
        </ProtectedRoute>
      } />
      <Route path="/vistoria" element={
        <ProtectedRoute>
          <Vistoria />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
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
};

export default App;
