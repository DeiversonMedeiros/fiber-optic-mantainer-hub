import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle, XCircle, Edit, AlertTriangle, DollarSign, Trash2, ChevronDown, ChevronRight, Filter, FileText, ZoomIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const ReportValidation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [filters, setFilters] = useState({
    technician: 'all',
    status: 'all',
    serviceType: 'all',
    serviceNumber: '',
    userClass: 'all',
    startDate: '',
    endDate: '',
  });

  // Buscar relatórios para validação
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['validation-reports', filters],
    queryFn: async () => {
      let query = supabase
        .from('reports')
        .select(`
          *,
          technician:profiles!technician_id(name, user_class:user_classes(name)),
          service_order:service_orders(number, title, maintenance_type)
        `);

      if (filters.technician !== 'all') {
        query = query.eq('technician_id', filters.technician);
      }

      if (filters.status !== 'all') {
        const validStatuses = ['pendente', 'validado', 'rejeitado'];
        if (validStatuses.includes(filters.status)) {
          query = query.eq('status', filters.status as 'pendente' | 'validado' | 'rejeitado');
        }
      }

      if (filters.serviceNumber) {
        query = query.eq('service_order.number', filters.serviceNumber);
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
    }
  });

  // Buscar técnicos para filtro
  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'tecnico')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Buscar classes de usuário
  const { data: userClasses = [] } = useQuery({
    queryKey: ['user-classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_classes')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Mutações para ações nos relatórios
  const updateStatusMutation = useMutation({
    mutationFn: async ({ reportId, status, observations }: { reportId: string, status: 'pendente' | 'validado' | 'rejeitado', observations?: string }) => {
      const { error } = await supabase
        .from('reports')
        .update({ 
          status,
          validated_by: user?.id,
          validated_at: new Date().toISOString()
        })
        .eq('id', reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validation-reports'] });
      toast({
        title: "Status atualizado",
        description: "O status do relatório foi atualizado com sucesso.",
      });
    }
  });

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

  const toggleCardExpansion = (reportId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId);
    } else {
      newExpanded.add(reportId);
    }
    setExpandedCards(newExpanded);
  };

  const handleStatusUpdate = (reportId: string, status: 'pendente' | 'validado' | 'rejeitado') => {
    updateStatusMutation.mutate({ reportId, status });
  };

  const handleAssignAdjustment = () => {
    if (!selectedTechnician) {
      toast({
        title: "Erro",
        description: "Selecione um técnico para direcionar a adequação.",
        variant: "destructive",
      });
      return;
    }
    
    // Aqui seria implementada a lógica de direcionamento de adequação
    toast({
      title: "Adequação direcionada",
      description: "A adequação foi direcionada com sucesso.",
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
                <h1 className="text-2xl font-bold text-gray-900">Validação de Relatórios Técnicos</h1>
                <p className="text-sm text-gray-600">Valide e gerencie relatórios enviados pelos técnicos</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filtros</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Técnico</label>
                <Select 
                  value={filters.technician} 
                  onValueChange={(value) => setFilters(prev => ({...prev, technician: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Técnico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {technicians.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                <Select 
                  value={filters.status} 
                  onValueChange={(value) => setFilters(prev => ({...prev, status: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
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
                <label className="text-sm font-medium text-gray-700 mb-2 block">Número do Serviço</label>
                <Input
                  placeholder="Número"
                  value={filters.serviceNumber}
                  onChange={(e) => setFilters(prev => ({...prev, serviceNumber: e.target.value}))}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Classe</label>
                <Select 
                  value={filters.userClass} 
                  onValueChange={(value) => setFilters(prev => ({...prev, userClass: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Classe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {userClasses.map((userClass) => (
                      <SelectItem key={userClass.id} value={userClass.id}>
                        {userClass.name}
                      </SelectItem>
                    ))}
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

        {/* Lista de Relatórios */}
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="shadow-sm">
              <Collapsible open={expandedCards.has(report.id)} onOpenChange={() => toggleCardExpansion(report.id)}>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-left">
                        <div className="text-lg font-semibold text-gray-900">
                          Serviço {report.service_order?.number || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(report.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-sm text-gray-600">
                          {report.technician?.user_class?.name || 'Classe N/A'}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {report.technician?.name}
                        </div>
                        <Badge className={getStatusColor(report.status)}>
                          {getStatusLabel(report.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        {expandedCards.has(report.id) ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-6">
                      {/* Informações do Relatório */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Informações Gerais</h4>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-medium">Título:</span> {report.title}</div>
                            <div><span className="font-medium">Descrição:</span> {report.description}</div>
                            <div><span className="font-medium">Tipo de Manutenção:</span> {report.service_order?.maintenance_type || 'N/A'}</div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Datas</h4>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-medium">Criado em:</span> {new Date(report.created_at).toLocaleString('pt-BR')}</div>
                            <div><span className="font-medium">Atualizado em:</span> {new Date(report.updated_at).toLocaleString('pt-BR')}</div>
                            {report.validated_at && (
                              <div><span className="font-medium">Validado em:</span> {new Date(report.validated_at).toLocaleString('pt-BR')}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Anexos/Fotos */}
                      {report.attachments && Array.isArray(report.attachments) && report.attachments.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Anexos</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {report.attachments.map((attachment: any, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={attachment?.url || ''} 
                            alt={`Anexo ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80"
                          />
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="absolute top-1 right-1"
                              >
                                <ZoomIn className="w-3 h-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>Anexo {index + 1}</DialogTitle>
                              </DialogHeader>
                              <img 
                                src={attachment?.url || ''} 
                                alt={`Anexo ${index + 1}`}
                                className="w-full h-auto max-h-[80vh] object-contain"
                              />
                            </DialogContent>
                          </Dialog>
                        </div>
                      ))}
                          </div>
                        </div>
                      )}

                      {/* Campo de Observações */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Observações
                        </label>
                        <Textarea 
                          placeholder="Adicione suas observações..."
                          className="w-full"
                        />
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex flex-wrap gap-2 pt-4 border-t">
                        <Button
                          onClick={() => handleStatusUpdate(report.id, 'validado')}
                          className="bg-green-500 hover:bg-green-600 text-white"
                          disabled={updateStatusMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aprovar
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="bg-pink-500 hover:bg-pink-600 text-white">
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Adequar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Direcionar para Adequação</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Selecione o Técnico
                                </label>
                                <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um técnico" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {technicians.map((tech) => (
                                      <SelectItem key={tech.id} value={tech.id}>
                                        {tech.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button onClick={handleAssignAdjustment} className="w-full">
                                Direcionar Adequação
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="outline"
                          className="border-purple-500 text-purple-500 hover:bg-purple-50"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>

                        <Button
                          onClick={() => handleStatusUpdate(report.id, 'rejeitado')}
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                          disabled={updateStatusMutation.isPending}
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Rejeitar
                        </Button>

                        <Button
                          variant="destructive"
                          className="ml-auto"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Deletar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}

          {reports.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">Nenhum relatório encontrado</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ReportValidation;