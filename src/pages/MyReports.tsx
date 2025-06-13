import React, { useState } from 'react';
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

const MyReports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: '',
  });

  // Buscar perfil do usuário
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*, user_class:user_classes(*), access_profile:access_profiles(*)')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Buscar templates disponíveis baseado na classe do usuário
  const { data: availableTemplates = [] } = useQuery({
    queryKey: ['available-templates', userProfile?.user_class_id],
    queryFn: async () => {
      let query = supabase
        .from('report_templates')
        .select('*')
        .eq('is_active', true);

      // Admins e gestores veem todos os templates
      if (userProfile?.role !== 'admin' && userProfile?.role !== 'gestor') {
        query = query.or(`user_class_id.eq.${userProfile?.user_class_id},user_class_id.is.null`);
      }

      const { data, error } = await query.order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!userProfile
  });

  // Buscar relatórios do usuário
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['my-reports', user?.id, filters],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('reports')
        .select(`
          *,
          technician:profiles!technician_id(name),
          service_order:service_orders(number, title)
        `);

      // Admins e gestores veem todos os relatórios
      if (userProfile?.role !== 'admin' && userProfile?.role !== 'gestor') {
        query = query.eq('technician_id', user.id);
      }

      if (filters.status !== 'all') {
        const validStatuses = ['pendente', 'validado', 'rejeitado'];
        if (validStatuses.includes(filters.status)) {
          query = query.eq('status', filters.status as 'pendente' | 'validado' | 'rejeitado');
        }
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

  // Contadores por status
  const statusCounts = {
    approved: reports.filter(r => r.status === 'validado').length,
    pending: reports.filter(r => r.status === 'pendente').length,
    rejected: reports.filter(r => r.status === 'rejeitado').length,
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pendente': 'bg-orange-100 text-orange-800',
      'validado': 'bg-green-100 text-green-800',
      'rejeitado': 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'pendente': 'Pendente',
      'validado': 'Validado',
      'rejeitado': 'Rejeitado',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const handleCreateReport = (templateId: string) => {
    // Aqui seria implementada a navegação para o formulário de criação de relatório
    toast({
      title: "Criar Relatório",
      description: "Funcionalidade em desenvolvimento",
    });
  };

  const handleViewReport = (reportId: string) => {
    // Aqui seria implementada a visualização completa do relatório
    toast({
      title: "Visualizar Relatório",
      description: "Funcionalidade em desenvolvimento",
    });
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Meus Relatórios</h1>
                <p className="text-sm text-gray-600">Visualize e gerencie seus relatórios técnicos</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Templates Disponíveis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Novo Relatório</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Indicadores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <div className="w-8 h-8 bg-green-500 rounded"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Aprovados</p>
                  <p className="text-2xl font-bold text-green-600">{statusCounts.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <div className="w-8 h-8 bg-yellow-500 rounded"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <div className="w-8 h-8 bg-red-500 rounded"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejeitados</p>
                  <p className="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filtros</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                <Select 
                  value={filters.status} 
                  onValueChange={(value) => setFilters(prev => ({...prev, status: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="validado">Validado</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Data Inicial</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({...prev, startDate: e.target.value}))}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Data Final</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({...prev, endDate: e.target.value}))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Relatórios */}
        <Card>
          <CardHeader>
            <CardTitle>Relatórios Enviados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número do Serviço</TableHead>
                  <TableHead>Técnico Responsável</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {report.service_order?.number || 'N/A'}
                    </TableCell>
                    <TableCell>{report.technician?.name}</TableCell>
                    <TableCell>
                      {new Date(report.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(report.status)}>
                        {getStatusLabel(report.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewReport(report.id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {reports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Nenhum relatório encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MyReports;