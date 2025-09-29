import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Briefcase, 
  FileText, 
  UserPlus, 
  ClipboardList, 
  Search,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useToast } from '@/hooks/use-toast';

// Componentes das abas
import JobRequestsTab from '@/components/recruitment/JobRequestsTab';
import JobOpeningsTab from '@/components/recruitment/JobOpeningsTab';
import CandidatesTab from '@/components/recruitment/CandidatesTab';
import SelectionProcessTab from '@/components/recruitment/SelectionProcessTab';
import TalentPoolTab from '@/components/recruitment/TalentPoolTab';
import DocumentUploadTab from '@/components/recruitment/DocumentUploadTab';

const RecruitmentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('job-requests');
  const { activeCompanyId } = useActiveCompany();
  const { toast } = useToast();

  if (!activeCompanyId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Empresa não selecionada</h3>
              <p className="text-muted-foreground mb-4">
                Para acessar o sistema de recrutamento, você precisa selecionar uma empresa no cabeçalho da página.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs = [
    {
      id: 'job-requests',
      label: 'Solicitações de Vagas',
      icon: <FileText className="h-4 w-4" />,
      description: 'Solicitar e aprovar novas vagas'
    },
    {
      id: 'job-openings',
      label: 'Vagas Abertas',
      icon: <Briefcase className="h-4 w-4" />,
      description: 'Gerenciar vagas aprovadas'
    },
    {
      id: 'candidates',
      label: 'Candidatos',
      icon: <Users className="h-4 w-4" />,
      description: 'Cadastro de candidatos'
    },
    {
      id: 'selection-process',
      label: 'Processo Seletivo',
      icon: <ClipboardList className="h-4 w-4" />,
      description: 'Etapas e avaliações'
    },
    {
      id: 'talent-pool',
      label: 'Banco de Talentos',
      icon: <UserPlus className="h-4 w-4" />,
      description: 'Talentos disponíveis'
    },
    {
      id: 'document-upload',
      label: 'Documentos',
      icon: <FileText className="h-4 w-4" />,
      description: 'Upload e validação'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recrutamento e Seleção</h1>
          <p className="text-muted-foreground">
            Gerencie todo o processo de recrutamento e seleção da sua empresa
          </p>
        </div>
        <Button onClick={() => toast({ title: "Funcionalidade em desenvolvimento" })}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Solicitação
        </Button>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Solicitações Pendentes</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Vagas Abertas</p>
                <p className="text-2xl font-bold">7</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Candidatos Ativos</p>
                <p className="text-2xl font-bold">24</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Processos Ativos</p>
                <p className="text-2xl font-bold">5</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              {tab.icon}
              <span className="hidden md:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="job-requests" className="mt-6">
          <JobRequestsTab companyId={activeCompanyId} />
        </TabsContent>

        <TabsContent value="job-openings" className="mt-6">
          <JobOpeningsTab companyId={activeCompanyId} />
        </TabsContent>

        <TabsContent value="candidates" className="mt-6">
          <CandidatesTab companyId={activeCompanyId} />
        </TabsContent>

        <TabsContent value="selection-process" className="mt-6">
          <SelectionProcessTab companyId={activeCompanyId} />
        </TabsContent>

        <TabsContent value="talent-pool" className="mt-6">
          <TalentPoolTab companyId={activeCompanyId} />
        </TabsContent>

        <TabsContent value="document-upload" className="mt-6">
          <DocumentUploadTab companyId={activeCompanyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RecruitmentManagement;