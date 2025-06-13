import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CheckCircle, Filter, FileText, History, ZoomIn, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const MyAdjustments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    serviceNumber: '',
    technician: 'all',
    startDate: '',
    endDate: '',
  });

  // Buscar adequações atribuídas ao usuário
  const { data: adjustments = [], isLoading } = useQuery({
    queryKey: ['my-adjustments', user?.id, filters],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Aqui seria implementada a busca por adequações atribuídas
      // Por enquanto, usando a tabela de reports como base
      let query = supabase
        .from('reports')
        .select(`
          *,
          technician:profiles!technician_id(name),
          service_order:service_orders(number, title),
          original_report:reports(id, title, description)
        `)
        .eq('status', 'rejeitado');

      if (filters.serviceNumber) {
        query = query.eq('service_order.number', filters.serviceNumber);
      }

      if (filters.technician !== 'all') {
        query = query.eq('technician_id', filters.technician);
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
    enabled: !!user?.id
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

  // Buscar templates de relatório para adequação
  const { data: reportTemplates = [] } = useQuery({
    queryKey: ['report-templates-adjustment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Mutação para concluir adequação
  const completeAdjustmentMutation = useMutation({
    mutationFn: async ({ adjustmentId, templateId }: { adjustmentId: string, templateId: string }) => {
      // Aqui seria implementada a lógica de conclusão de adequação
      // Por enquanto, apenas atualizando o status
      const { error } = await supabase
        .from('reports')
        .update({ 
          status: 'pendente' as const,
          updated_at: new Date().toISOString()
        })
        .eq('id', adjustmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-adjustments'] });
      toast({
        title: "Adequação concluída",
        description: "A adequação foi marcada como concluída.",
      });
    }
  });

  const handleCompleteAdjustment = (adjustmentId: string, templateId: string) => {
    completeAdjustmentMutation.mutate({ adjustmentId, templateId });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
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
                <h1 className="text-2xl font-bold text-gray-900">Minhas Adequações</h1>
                <p className="text-sm text-gray-600">Visualize e execute adequações atribuídas a você</p>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Número do Serviço</label>
                <Input
                  placeholder="Número"
                  value={filters.serviceNumber}
                  onChange={(e) => setFilters(prev => ({...prev, serviceNumber: e.target.value}))}
                />
              </div>

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

        {/* Lista de Adequações */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {adjustments.map((adjustment) => (
            <Card key={adjustment.id} className="shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Serviço {adjustment.service_order?.number || 'N/A'}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {adjustment.service_order?.title}
                    </p>
                  </div>
                  <Badge className="bg-pink-100 text-pink-800">
                    Adequação
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Informações Básicas */}
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Técnico Original:</span> {adjustment.technician?.name}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Data de Criação:</span> {formatDate(adjustment.created_at)}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Última Atualização:</span> {formatDate(adjustment.updated_at)}
                  </div>
                </div>

                {/* Descrição do Relatório */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Descrição do Relatório Original</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {adjustment.description}
                  </p>
                </div>

                {/* Anexos/Fotos */}
                {adjustment.attachments && Array.isArray(adjustment.attachments) && adjustment.attachments.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Fotos do Relatório</h4>
                    <div className="grid grid-cols-3 gap-2">
                    {adjustment.attachments.slice(0, 3).map((attachment: any, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={attachment?.url || ''} 
                          alt={`Foto ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80"
                        />
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="absolute top-1 right-1 h-6 w-6 p-0"
                            >
                              <ZoomIn className="w-3 h-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Foto {index + 1}</DialogTitle>
                            </DialogHeader>
                            <img 
                              src={attachment?.url || ''} 
                              alt={`Foto ${index + 1}`}
                              className="w-full h-auto max-h-[80vh] object-contain"
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    ))}
                      {adjustment.attachments.length > 3 && (
                        <div className="h-20 bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-600">
                          +{adjustment.attachments.length - 3} fotos
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline">
                        <History className="w-4 h-4 mr-2" />
                        Histórico
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Histórico da Adequação</SheetTitle>
                      </SheetHeader>
                      <div className="space-y-4 mt-6">
                        <div className="border-l-2 border-blue-200 pl-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium">Adequação solicitada</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatDate(adjustment.created_at)}
                          </p>
                        </div>
                        
                        <div className="border-l-2 border-orange-200 pl-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium">Relatório original enviado</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Por {adjustment.technician?.name}
                          </p>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-green-500 hover:bg-green-600 text-white">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Concluir
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Concluir Adequação</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                          Selecione o template de relatório para concluir esta adequação:
                        </p>
                        
                        <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                          {reportTemplates.map((template) => (
                            <Card 
                              key={template.id} 
                              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary"
                              onClick={() => handleCompleteAdjustment(adjustment.id, template.id)}
                            >
                              <CardContent className="p-4">
                                <h4 className="font-semibold text-sm">{template.name}</h4>
                                <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}

          {adjustments.length === 0 && (
            <div className="col-span-full">
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma adequação encontrada</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Adequações atribuídas a você aparecerão aqui
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyAdjustments;