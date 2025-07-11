import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CheckCircle, Filter, FileText, History, ZoomIn, Clock } from 'lucide-react';
import { ThumbnailImage, FullImage } from '@/components/ui/OptimizedImage';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import ReportFormModal from '@/components/reports/ReportFormModal';

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
  const [assignedNames, setAssignedNames] = useState<Record<string, string>>({});
  const [openFormModal, setOpenFormModal] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<any | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Buscar adequações atribuídas ao usuário
  const { data: adjustments = [], isLoading } = useQuery({
    queryKey: ['my-adjustments', user?.id, filters],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = supabase
        .from('reports')
        .select('*')
        .eq('status', 'em_adequacao' as any)
        .eq('assigned_to', user.id);
      if (filters.serviceNumber) {
        query = query.eq('service_order_id', filters.serviceNumber);
      }
      if (filters.technician !== 'all') {
        query = query.eq('assigned_to', filters.technician);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate + 'T23:59:59');
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      console.log('Query de adequações:', { userId: user.id, filters, data });
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
        .eq('access_profile_id', '38a5d358-75d6-4ae6-a109-1456a7dba714')
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

  // Buscar perfil do usuário logado
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*, user_class:user_classes(*)')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Buscar o template da classe do usuário logado
  const userTemplate = reportTemplates.find(
    t => userProfile && (t.user_class_id === userProfile.user_class_id || t.user_class_id === null)
  );

  const getTemplateForAdjustment = (adjustment: any) => reportTemplates.find(t => t.id === adjustment.template_id);

  // Mutação para concluir adequação
  const completeAdjustmentMutation = useMutation({
    mutationFn: async ({ adjustmentId, templateId }: { adjustmentId: string, templateId: string }) => {
      // Aqui seria implementada a lógica de conclusão de adequação
      // Por enquanto, apenas atualizando o status
      const { error } = await supabase
        .from('reports')
        .update({ 
          status: 'nao_validado' as const,
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

  useEffect(() => {
    const fetchNames = async () => {
      const ids = Array.from(new Set(adjustments.map((a: any) => a.assigned_to).filter(Boolean)));
      if (ids.length === 0) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', ids);
      if (!error && data) {
        const map: Record<string, string> = {};
        data.forEach((p: any) => { map[p.id] = p.name; });
        setAssignedNames(map);
      }
    };
    fetchNames();
  }, [adjustments]);

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
          {adjustments.map((adjustment) => {
            const template = getTemplateForAdjustment(adjustment);
            return (
              <Card key={adjustment.id} className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Serviço {adjustment.numero_servico || 'N/A'}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {/* Não há título disponível, pois service_order_id é string */}
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
                      <span className="font-medium">Técnico Original:</span> {assignedNames[adjustment.assigned_to] || adjustment.assigned_to}
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

                  {adjustment.form_data && Array.isArray(template?.fields) && template.fields.length > 0 && (
                    <div className="mt-2">
                      <h4 className="font-semibold text-gray-900 mb-2">Campos do Formulário</h4>
                      <div className="space-y-1 text-sm">
                        {template.fields.map((field: any, idx: number) => {
                          const value = adjustment.form_data[field.id || field.name];
                          let displayValue = '-';
                          if (Array.isArray(value)) {
                            displayValue = value.map(v => (typeof v === 'string' || typeof v === 'number' ? String(v) : '-')).join(', ');
                          } else if (typeof value === 'string' || typeof value === 'number') {
                            displayValue = String(value);
                          }
                          return (
                            <div key={idx}>
                              <span className="font-medium">{field.label || field.name}:</span> {displayValue}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Anexos/Fotos */}
                  {adjustment.attachments && Array.isArray(adjustment.attachments) && adjustment.attachments.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Fotos do Relatório</h4>
                      <div className="grid grid-cols-3 gap-2">
                      {adjustment.attachments.slice(0, 3).map((attachment: any, index) => (
                        <div key={index} className="relative">
                          <ThumbnailImage
                            src={attachment?.url || ''} 
                            alt={`Foto ${index + 1}`}
                            className="w-full h-20 rounded-lg"
                            onClick={() => {
                              // Abrir modal com imagem completa
                              const dialog = document.createElement('dialog');
                              dialog.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
                              dialog.innerHTML = `
                                <div class="max-w-4xl max-h-[90vh] overflow-auto bg-white rounded-lg p-4">
                                  <div class="flex justify-between items-center mb-4">
                                    <h3 class="text-lg font-semibold">Foto ${index + 1}</h3>
                                    <button onclick="this.closest('dialog').close()" class="text-gray-500 hover:text-gray-700">
                                      ✕
                                    </button>
                                  </div>
                                  <img src="${attachment?.url || ''}" alt="Foto ${index + 1}" class="w-full h-auto object-contain" />
                                </div>
                              `;
                              document.body.appendChild(dialog);
                              dialog.showModal();
                              dialog.addEventListener('click', (e) => {
                                if (e.target === dialog) dialog.close();
                              });
                              dialog.addEventListener('close', () => {
                                document.body.removeChild(dialog);
                              });
                            }}
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                            onClick={() => {
                              // Abrir modal com imagem completa
                              const dialog = document.createElement('dialog');
                              dialog.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
                              dialog.innerHTML = `
                                <div class="max-w-4xl max-h-[90vh] overflow-auto bg-white rounded-lg p-4">
                                  <div class="flex justify-between items-center mb-4">
                                    <h3 class="text-lg font-semibold">Foto ${index + 1}</h3>
                                    <button onclick="this.closest('dialog').close()" class="text-gray-500 hover:text-gray-700">
                                      ✕
                                    </button>
                                  </div>
                                  <img src="${attachment?.url || ''}" alt="Foto ${index + 1}" class="w-full h-auto object-contain" />
                                </div>
                              `;
                              document.body.appendChild(dialog);
                              dialog.showModal();
                              dialog.addEventListener('click', (e) => {
                                if (e.target === dialog) dialog.close();
                              });
                              dialog.addEventListener('close', () => {
                                document.body.removeChild(dialog);
                              });
                            }}
                          >
                            <ZoomIn className="w-3 h-3" />
                          </Button>
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
                    <Button
                      className="bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => {
                        setSelectedAdjustment(adjustment);
                        setSelectedTemplateId(userTemplate?.id || null);
                        setOpenFormModal(true);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Concluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

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

      {/* Modal de formulário de conclusão */}
      {openFormModal && selectedTemplateId && selectedAdjustment && (
        <ReportFormModal
          isOpen={openFormModal}
          onClose={() => setOpenFormModal(false)}
          templateId={selectedTemplateId}
          scheduleId={null}
          parentReportId={selectedAdjustment?.id} // <-- passar parentReportId
          onSuccess={async () => {
            console.log('Vai atualizar status do relatório:', selectedAdjustment.id);
            const { error, data } = await supabase
              .from('reports')
              .update({ status: 'adequado' as any, updated_at: new Date().toISOString() })
              .eq('id', selectedAdjustment.id)
              .select();
            console.log('Resultado do update:', { error, data });
            await queryClient.invalidateQueries({ queryKey: ['my-adjustments'] });
            setOpenFormModal(false);
            setSelectedAdjustment(null);
            setSelectedTemplateId(null);
          }}
        />
      )}
    </div>
  );
};

export default MyAdjustments;