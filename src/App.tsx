import ProjectsManagement from "./pages/ProjectsManagement";
import ModulePermissionsManagement from "./pages/ModulePermissionsManagement";
import EntityPermissionsManagement from "./pages/EntityPermissionsManagement";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { ActiveCompanyProvider } from "@/hooks/useActiveCompany";
import { useOfflineInit } from "@/hooks/useOfflineInit";
import { useSyncNotifications } from "@/hooks/useSyncNotifications";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import CompaniesManagement from "./pages/CompaniesManagement";
import ProfilesManagement from "./pages/ProfilesManagement";
import CostCentersManagement from "./pages/CostCentersManagement";
import DepartmentsManagement from "./pages/DepartmentsManagement";
import { RequirePermission } from "@/components/RequirePermission";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import ChangePassword from "./pages/ChangePassword";
// Páginas RH
import RHDashboard from "./pages/RHDashboard";
import EmployeeManagement from "./pages/EmployeeManagement";

import TimeRecordManagement from "./pages/TimeRecordManagement";
import VacationsManagement from "./pages/VacationsManagement";
import MedicalCertificateManagement from "./pages/MedicalCertificateManagement";
import ESocialManagement from "./pages/ESocialManagement";
import RecruitmentManagement from "./pages/RecruitmentManagement";
import TrainingManagement from "./pages/TrainingManagement";
import TimeBankManagement from "./pages/TimeBankManagement";
import CompensationRequestManagement from "./pages/CompensationRequestManagement";
import PeriodicExamManagement from "./pages/PeriodicExamManagement";
import UnionManagement from "./pages/UnionManagement";
import PositionManagement from "./pages/PositionManagement";
import WorkShiftManagement from "./pages/WorkShiftManagement";
import EmploymentContractManagement from "./pages/EmploymentContractManagement";
import EmployeeShiftManagement from "./pages/EmployeeShiftManagement";
import PayrollConfigManagement from "./pages/PayrollConfigManagement";
import HolidaysManagement from "./pages/HolidaysManagement";
import SchedulePlanningPage from "./pages/SchedulePlanningPage";
import RubricasManagement from "./pages/RubricasManagement";
import AdvancedPayrollManagement from "./pages/rh/payroll/AdvancedPayrollManagement";
import EventConsolidationPage from "./pages/rh/payroll/EventConsolidationPage";
import PayrollCalculationPage from "./pages/rh/payroll/PayrollCalculationPage";
import ESocialIntegrationPage from "./pages/rh/payroll/ESocialIntegrationPage";
import FinancialIntegrationPage from "./pages/rh/payroll/FinancialIntegrationPage";
import BradescoIntegrationPage from "./pages/financeiro/payroll/BradescoIntegrationPage";
import PayrollAnalyticsPage from "./pages/rh/analytics/PayrollAnalyticsPage";
import UnitsManagement from "./pages/UnitsManagement";
import DeficiencyTypesManagement from "./pages/DeficiencyTypesManagement";
import DelayReasonsManagement from "./pages/DelayReasonsManagement";
import CidCodesManagement from "./pages/CidCodesManagement";
import AbsenceTypesManagement from "./pages/AbsenceTypesManagement";
import AllowanceTypesManagement from "./pages/AllowanceTypesManagement";
import InssBracketsManagement from "./pages/InssBracketsManagement";
import IrrfBracketsManagement from "./pages/IrrfBracketsManagement";
import FgtsConfigManagement from "./pages/FgtsConfigManagement";
// Páginas Financeiro
import FinancialDashboard from "./pages/financial/FinancialDashboard";
import AccountsPayable from "./pages/financial/AccountsPayable";
import AccountsReceivable from "./pages/financial/AccountsReceivable";
import Treasury from "./pages/financial/Treasury";
import FiscalIntegration from "./pages/financial/FiscalIntegration";
import Accounting from "./pages/financial/Accounting";
// Páginas de Benefícios Avançados
import ConveniosPage from "./pages/ConveniosPage";
import UnifiedBenefitsPage from "./pages/UnifiedBenefitsPage";
import ElegibilidadePage from "./pages/ElegibilidadePage";
import DisciplinaryActionsPage from "./pages/DisciplinaryActionsPage";
import RateiosPage from "./pages/RateiosPage";
import PaymentManagementPage from "./pages/PaymentManagementPage";
// Portal do Colaborador
import PortalColaboradorLayout from "./components/layout/PortalColaboradorLayout";
import ColaboradorDashboard from "./pages/portal-colaborador/ColaboradorDashboard";
import HoleritePage from "./pages/portal-colaborador/HoleritePage";
import FeriasPage from "./pages/portal-colaborador/FeriasPage";
import ComprovantesPage from "./pages/portal-colaborador/ComprovantesPage";
import BancoHorasPage from "./pages/portal-colaborador/BancoHorasPage";
import AtestadosPage from "./pages/portal-colaborador/AtestadosPage";
import RegistroPontoPage from "./pages/portal-colaborador/RegistroPontoPage";
import CorrecaoPontoPage from "./pages/portal-colaborador/CorrecaoPontoPage";
import ExamesPage from "./pages/portal-colaborador/ExamesPage";
import ReembolsosPage from "./pages/portal-colaborador/ReembolsosPage";

// Portal do Gestor
import PortalGestorLayout from "./components/layout/PortalGestorLayout";
import GestorDashboard from "./pages/portal-gestor/GestorDashboard";
import CentralAprovacoes from "./pages/portal-gestor/CentralAprovacoes";
import AprovacaoFerias from "./pages/portal-gestor/AprovacaoFerias";
import AprovacaoCompensacoes from "./pages/portal-gestor/AprovacaoCompensacoes";
import AprovacaoReembolsos from "./pages/portal-gestor/AprovacaoReembolsos";
import AprovacaoEquipamentos from "./pages/portal-gestor/AprovacaoEquipamentos";
import AprovacaoAtestados from "./pages/portal-gestor/AprovacaoAtestados";
import AprovacaoCorrecoesPonto from "./pages/portal-gestor/AprovacaoCorrecoesPonto";
import AcompanhamentoPonto from "./pages/portal-gestor/AcompanhamentoPonto";
import AcompanhamentoExames from "./pages/portal-gestor/AcompanhamentoExames";

const queryClient = new QueryClient();

// ID do perfil de acesso "Técnico"
const TECNICO_PROFILE_ID = '38a5d358-75d6-4ae6-a109-1456a7dba714';

// Componente para redirecionar baseado no perfil
const ProfileBasedRedirect = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const location = useLocation();
  // Por enquanto, não redirecionamos baseado em perfil
  // TODO: Implementar lógica de redirecionamento baseada no novo sistema de permissões

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

  return user ? <Navigate to="/rh" replace /> : <>{children}</>;
};

const AppRoutes = () => {
  console.log('🚀 [APP] Iniciando AppRoutes...');
  
  // Inicializar sistema offline
  console.log('🔍 [APP] Chamando useOfflineInit...');
  const { isInitialized } = useOfflineInit();
  console.log('🔍 [APP] useOfflineInit resultado:', { isInitialized });
  
  // Notificações de sincronização
  console.log('🔍 [APP] Chamando useSyncNotifications...');
  useSyncNotifications();

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-fiber-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <div className="w-8 h-8 bg-primary rounded-full"></div>
          </div>
          <p className="text-white">Inicializando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/rh" replace />} />
      <Route path="/auth" element={
        <PublicRoute>
          <Auth />
        </PublicRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/settings/companies" element={
        <ProtectedRoute>
          <RequirePermission moduleName="core" action="read">
            <CompaniesManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/settings/profiles" element={
        <ProtectedRoute>
          <RequirePermission moduleName="core" action="read">
            <ProfilesManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/settings/cost-centers" element={
        <ProtectedRoute>
          <RequirePermission moduleName="core" action="read">
            <CostCentersManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/settings/departments" element={
        <ProtectedRoute>
          <RequirePermission moduleName="core" action="read">
            <DepartmentsManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/settings/projects" element={
        <ProtectedRoute>
          <RequirePermission moduleName="core" action="read">
            <ProjectsManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/settings/module-permissions" element={
        <ProtectedRoute>
          <RequirePermission moduleName="core" action="read">
            <ModulePermissionsManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/settings/entity-permissions" element={
        <ProtectedRoute>
          <RequirePermission moduleName="core" action="read">
            <EntityPermissionsManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute>
          <RequirePermission moduleName="core" action="read">
            <UserManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      
      {/* Rotas RH */}
      <Route path="/rh" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <RHDashboard />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/employees" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <EmployeeManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />

      <Route path="/rh/time-records" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <TimeRecordManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/convenios" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <ConveniosPage />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/beneficios-unificados" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <UnifiedBenefitsPage />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/acoes-disciplinares" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <DisciplinaryActionsPage />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/elegibilidade" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <ElegibilidadePage />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/rateios" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <RateiosPage />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/pagamentos" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <PaymentManagementPage />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/payroll" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <AdvancedPayrollManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/payroll-advanced" element={
        <ProtectedRoute>
          <AdvancedPayrollManagement />
        </ProtectedRoute>
      } />
      <Route path="/rh/event-consolidation" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <EventConsolidationPage />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/payroll-calculation" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <PayrollCalculationPage />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/esocial-integration" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <ESocialIntegrationPage />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/financial-integration" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <FinancialIntegrationPage />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/analytics" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <PayrollAnalyticsPage />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/financeiro/bradesco-integration" element={
        <ProtectedRoute>
          <RequirePermission moduleName="financeiro" action="read">
            <BradescoIntegrationPage />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/vacations" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <VacationsManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/medical-certificates" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <MedicalCertificateManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/esocial" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <ESocialManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/recruitment" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <RecruitmentManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/training" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <TrainingManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/positions" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <PositionManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/time-bank" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <TimeBankManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/compensation-requests" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <CompensationRequestManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/periodic-exams" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <PeriodicExamManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/unions" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <UnionManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/work-shifts" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <WorkShiftManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/employment-contracts" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <EmploymentContractManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/employee-shifts" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <EmployeeShiftManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/holidays" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <HolidaysManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/schedule-planning" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <SchedulePlanningPage />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/payroll-config" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <PayrollConfigManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      
      {/* Cadastros Avançados */}
      <Route path="/rh/rubricas" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <RubricasManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/units" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <UnitsManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      
      {/* PCD e Dependentes */}
      <Route path="/rh/deficiency-types" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <DeficiencyTypesManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      
      {/* Motivos de Atraso e CID */}
      <Route path="/rh/delay-reasons" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <DelayReasonsManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/cid-codes" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <CidCodesManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      
      {/* Afastamentos e Adicionais */}
      <Route path="/rh/absence-types" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <AbsenceTypesManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/allowance-types" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <AllowanceTypesManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      
      {/* Impostos */}
      <Route path="/rh/inss-brackets" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <InssBracketsManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/irrf-brackets" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <IrrfBracketsManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/rh/fgts-config" element={
        <ProtectedRoute>
          <RequirePermission moduleName="rh" action="read">
            <FgtsConfigManagement />
          </RequirePermission>
        </ProtectedRoute>
      } />
      
      {/* Rotas Financeiro */}
      <Route path="/financeiro" element={
        <ProtectedRoute>
          <RequirePermission moduleName="financeiro" action="read">
            <FinancialDashboard />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/financeiro/contas-pagar" element={
        <ProtectedRoute>
          <RequirePermission moduleName="financeiro" action="read">
            <AccountsPayable />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/financeiro/contas-receber" element={
        <ProtectedRoute>
          <RequirePermission moduleName="financeiro" action="read">
            <AccountsReceivable />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/financeiro/tesouraria" element={
        <ProtectedRoute>
          <RequirePermission moduleName="financeiro" action="read">
            <Treasury />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/financeiro/integracao-fiscal" element={
        <ProtectedRoute>
          <RequirePermission moduleName="financeiro" action="read">
            <FiscalIntegration />
          </RequirePermission>
        </ProtectedRoute>
      } />
      <Route path="/financeiro/contabilidade" element={
        <ProtectedRoute>
          <RequirePermission moduleName="financeiro" action="read">
            <Accounting />
          </RequirePermission>
        </ProtectedRoute>
      } />
      
      {/* Portal do Colaborador */}
      <Route path="/portal-colaborador" element={
        <ProtectedRoute>
          <PortalColaboradorLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/portal-colaborador/dashboard" replace />} />
        <Route path="dashboard" element={<ColaboradorDashboard />} />
        <Route path="holerite" element={<HoleritePage />} />
        <Route path="ferias" element={<FeriasPage />} />
        <Route path="comprovantes" element={<ComprovantesPage />} />
        <Route path="banco-horas" element={<BancoHorasPage />} />
        <Route path="atestados" element={<AtestadosPage />} />
        <Route path="registro-ponto" element={<RegistroPontoPage />} />
        <Route path="correcao-ponto" element={<CorrecaoPontoPage />} />
        <Route path="exames" element={<ExamesPage />} />
        <Route path="reembolsos" element={<ReembolsosPage />} />
      </Route>

      {/* Portal do Gestor */}
      <Route path="/portal-gestor" element={
        <ProtectedRoute>
          <PortalGestorLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/portal-gestor/dashboard" replace />} />
      <Route path="dashboard" element={<GestorDashboard />} />
      <Route path="aprovacoes" element={<CentralAprovacoes />} />
      <Route path="aprovacoes/ferias" element={<AprovacaoFerias />} />
      <Route path="aprovacoes/compensacoes" element={<AprovacaoCompensacoes />} />
      <Route path="aprovacoes/reembolsos" element={<AprovacaoReembolsos />} />
      <Route path="aprovacoes/equipamentos" element={<AprovacaoEquipamentos />} />
      <Route path="aprovacoes/atestados" element={<AprovacaoAtestados />} />
      <Route path="aprovacoes/correcoes-ponto" element={<AprovacaoCorrecoesPonto />} />
      <Route path="acompanhamento/ponto" element={<AcompanhamentoPonto />} />
      <Route path="acompanhamento/exames" element={<AcompanhamentoExames />} />
      <Route path="escalas" element={<SchedulePlanningPage />} />
      </Route>
      
      <Route path="/change-password" element={
        <ProtectedRoute>
          <ChangePassword />
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
        <ActiveCompanyProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </ActiveCompanyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
