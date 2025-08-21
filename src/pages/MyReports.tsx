
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Eye, Calendar, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import ReportFormModal from '@/components/reports/ReportFormModal';
import ReportViewModal from "@/components/reports/ReportViewModal";
import { usePagination } from "@/hooks/usePagination";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const MyReports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Buscar perfil do usuário
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_class:user_classes(*),
          access_profile:access_profiles(*)
        `)
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Buscar perfil de acesso e permissões
  const permissions = userProfile?.access_profile?.permissions || [];
  let permissionsArr = permissions;
  if (typeof permissionsArr === 'string') {
    try {
      permissionsArr = JSON.parse(permissionsArr);
    } catch {
      permissionsArr = [];
    }
  }
  if (!Array.isArray(permissionsArr)) {
    permissionsArr = [];
  }

  // Buscar templates disponíveis baseado na classe do usuário
  const { data: availableTemplates = [] } = useQuery({
    queryKey: ['available-templates', userProfile?.user_class_id],
    queryFn: async () => {
      if (!userProfile) return [];
      let query = supabase
        .from('report_templates')
        .select('*')
        .eq('is_active', true);
      // Se o usuário não tem permissão de admin/gestor, filtrar apenas templates da sua classe ou sem classe definida
      if (!permissionsArr.includes('admin') && !permissionsArr.includes('gestor')) {
        if (userProfile.user_class_id) {
          query = query.or(`user_class_id.eq.${userProfile.user_class_id},user_class_id.is.null`);
        } else {
          query = query.is('user_class_id', null);
        }
      }
      const { data, error } = await query.order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile
  });

  // Buscar relatórios do usuário (tabela correta: reports)
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['my-reports', user?.id, filters],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = supabase
        .from('reports')
        .select(`*, technician:profiles!technician_id(name)`);
      // Admins e gestores veem todos os relatórios
      if (!permissionsArr.includes('admin') && !permissionsArr.includes('gestor')) {
        query = query.eq('technician_id', user.id);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate + 'T23:59:59');
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!userProfile
  });

  // Contadores por status (remover pois não há status na nova tabela)
  // const statusCounts = {
  //   approved: reports.filter(r => r.status === 'validado').length,
  //   pending: reports.filter(r => r.status === 'pendente').length,
  //   rejected: reports.filter(r => r.status === 'rejeitado').length,
  // };

  // const getStatusColor = (status: string) => {
  //   const colors = {
  //     'pendente': 'bg-orange-100 text-orange-800',
  //     'concluido': 'bg-green-100 text-green-800',
  //     'cancelado': 'bg-gray-200 text-gray-600',
  //   };
  //   return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  // };

  // const getStatusLabel = (status: string) => {
  //   const labels = {
  //     'pendente': 'Pendente',
  //     'concluido': 'Concluído',
  //     'cancelado': 'Cancelado',
  //   };
  //   return labels[status as keyof typeof labels] || status;
  // };

  const handleCreateReport = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setIsModalOpen(true);
  };

  const handleViewReport = (reportId: string) => {
    // Aqui seria implementada a visualização completa do relatório
    toast({
      title: "Visualizar Relatório",
      description: "Funcionalidade em desenvolvimento",
    });
  };

  // Numeração sequencial global dos relatórios (mais antigo = 1) - Fallback para relatórios antigos
  const reportSequenceMap = useMemo(() => {
    const sorted = [...reports].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const map: Record<string, number> = {};
    sorted.forEach((report, idx) => {
      map[report.id] = idx + 1;
    });
    return map;
  }, [reports]);

  // Função para obter o número do relatório com prefixo REL-
  const getReportNumber = (report: any) => {
    if (report.report_number) {
      return `REL-${report.report_number}`;
    }
    // Fallback para relatórios antigos que não têm report_number
    return `REL-${reportSequenceMap[report.id] || 'N/A'}`;
  };

  const {
    visibleItems: paginatedReports,
    hasMore: hasMoreReports,
    showMore: showMoreReports,
    reset: resetReports
  } = usePagination(reports, 10, 10);

  if (isLoading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <Tabs defaultValue="new-report" className="w-full">
        <TabsList>
          <TabsTrigger value="new-report">+ Novo Relatório</TabsTrigger>
          <TabsTrigger value="field-reports">Relatórios de Campo</TabsTrigger>
        </TabsList>
        <TabsContent value="new-report">
          {/* Templates Disponíveis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Novo Relatório</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableTemplates.map((template) => (
                    <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                        <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                        <Button 
                          onClick={() => handleCreateReport(template.id)}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Criar Relatório
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Nenhum template disponível</h3>
                  <p className="text-sm">
                    Não há templates de relatório disponíveis para sua classe de usuário.
                    {permissionsArr.includes('admin') || permissionsArr.includes('gestor') ? 
                      ' Crie novos templates na seção de Configurações.' : 
                      ' Entre em contato com o administrador.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="field-reports">
          {/* Relatórios Enviados */}
          <Card>
            <CardHeader>
              <CardTitle>Relatórios de Campo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Número do Serviço</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Técnico</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedReports.length > 0 ? (
                      paginatedReports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell className="font-mono font-medium text-primary">
                              {getReportNumber(report)}
                            </TableCell>
                            <TableCell>{report.title}</TableCell>
                            <TableCell>{report.status}</TableCell>
                            <TableCell>{report.numero_servico || '-'}</TableCell>
                            <TableCell>{new Date(report.created_at).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>{report.technician?.name || '-'}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full md:w-auto"
                                onClick={() => {
                                  setSelectedReport(report);
                                  setIsViewModalOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Visualizar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Nenhum relatório encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {hasMoreReports && (
                <div className="flex justify-center mt-4">
                  <Button onClick={showMoreReports} variant="outline">Ver mais</Button>
                </div>
              )}
              <div className="text-xs text-gray-500 text-center mt-2">
                Mostrando {paginatedReports.length} de {reports.length} relatórios
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ReportFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        templateId={selectedTemplateId}
      />
      <ReportViewModal
        report={selectedReport}
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
      />
    </div>
  );
};

export default MyReports;
