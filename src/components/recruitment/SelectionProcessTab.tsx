import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ClipboardList, 
  Users, 
  Search, 
  Filter, 
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  UserCheck,
  UserX
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SelectionProcess {
  id: string;
  name: string;
  job_opening_name: string;
  status: string;
  candidates_count: number;
  stages_count: number;
  start_date: string;
  end_date?: string;
  created_by_name: string;
}

interface SelectionStage {
  id: string;
  name: string;
  stage_type: string;
  order_index: number;
  is_final_stage: boolean;
  candidates_passed: number;
  total_candidates: number;
}

interface SelectionProcessTabProps {
  companyId: string;
}

const SelectionProcessTab: React.FC<SelectionProcessTabProps> = ({ companyId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'pausado' | 'finalizado' | 'cancelado'>('all');
  const [selectedProcess, setSelectedProcess] = useState<SelectionProcess | null>(null);
  const [showStages, setShowStages] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { toast } = useToast();

  // Mock data - substituir por dados reais do banco
  const mockProcesses: SelectionProcess[] = [
    {
      id: '1',
      name: 'Seleção Desenvolvedor Frontend',
      job_opening_name: 'Desenvolvedor Frontend',
      status: 'ativo',
      candidates_count: 15,
      stages_count: 4,
      start_date: '2024-01-15',
      end_date: '2024-02-15',
      created_by_name: 'João Silva'
    },
    {
      id: '2',
      name: 'Seleção Analista de RH',
      job_opening_name: 'Analista de RH',
      status: 'pausado',
      candidates_count: 8,
      stages_count: 3,
      start_date: '2024-01-10',
      created_by_name: 'Maria Santos'
    },
    {
      id: '3',
      name: 'Seleção Gerente de Projetos',
      job_opening_name: 'Gerente de Projetos',
      status: 'finalizado',
      candidates_count: 22,
      stages_count: 5,
      start_date: '2024-01-05',
      end_date: '2024-01-25',
      created_by_name: 'Pedro Costa'
    }
  ];

  const mockStages: SelectionStage[] = [
    {
      id: '1',
      name: 'Triagem de Currículos',
      stage_type: 'triagem',
      order_index: 1,
      is_final_stage: false,
      candidates_passed: 12,
      total_candidates: 15
    },
    {
      id: '2',
      name: 'Entrevista Inicial',
      stage_type: 'entrevista',
      order_index: 2,
      is_final_stage: false,
      candidates_passed: 8,
      total_candidates: 12
    },
    {
      id: '3',
      name: 'Prova Técnica',
      stage_type: 'prova_tecnica',
      order_index: 3,
      is_final_stage: false,
      candidates_passed: 5,
      total_candidates: 8
    },
    {
      id: '4',
      name: 'Entrevista Final',
      stage_type: 'entrevista_final',
      order_index: 4,
      is_final_stage: true,
      candidates_passed: 2,
      total_candidates: 5
    }
  ];

  const filteredProcesses = mockProcesses.filter(process => {
    const matchesSearch = process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         process.job_opening_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || process.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'pausado':
        return <Badge className="bg-yellow-100 text-yellow-800">Pausado</Badge>;
      case 'finalizado':
        return <Badge className="bg-blue-100 text-blue-800">Finalizado</Badge>;
      case 'cancelado':
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Desconhecido</Badge>;
    }
  };

  const getStageTypeIcon = (stageType: string) => {
    switch (stageType) {
      case 'triagem':
        return <ClipboardList className="h-4 w-4" />;
      case 'entrevista':
      case 'entrevista_final':
        return <Users className="h-4 w-4" />;
      case 'prova_tecnica':
        return <CheckCircle className="h-4 w-4" />;
      case 'dinamica':
        return <Users className="h-4 w-4" />;
      default:
        return <ClipboardList className="h-4 w-4" />;
    }
  };

  const handleViewProcess = (process: SelectionProcess) => {
    setSelectedProcess(process);
    setShowStages(true);
  };

  const handleAdvanceCandidate = (stageId: string, candidateId: string) => {
    toast({
      title: "Candidato Aprovado",
      description: "Candidato avançou para a próxima etapa",
      variant: "default"
    });
  };

  const handleRejectCandidate = (stageId: string, candidateId: string) => {
    toast({
      title: "Candidato Reprovado",
      description: "Candidato foi reprovado nesta etapa",
      variant: "destructive"
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por processo ou vaga..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="pausado">Pausados</SelectItem>
                  <SelectItem value="finalizado">Finalizados</SelectItem>
                  <SelectItem value="cancelado">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Processo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Processos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Processos Seletivos ({filteredProcesses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProcesses.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum processo encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProcesses.map((process) => (
                <Card key={process.id} className="border-l-4 border-l-blue-400">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{process.name}</h3>
                          {getStatusBadge(process.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4" />
                            <span>Vaga: {process.job_opening_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>Candidatos: {process.candidates_count}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4" />
                            <span>Etapas: {process.stages_count}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Início: {formatDate(process.start_date)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProcess(process)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Etapas
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Etapas */}
      {showStages && selectedProcess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Etapas do Processo: {selectedProcess.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockStages.map((stage, index) => (
                  <div key={stage.id} className="relative">
                    <Card className={`${stage.is_final_stage ? 'border-green-400' : 'border-gray-200'}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                stage.is_final_stage ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                              }`}>
                                {getStageTypeIcon(stage.stage_type)}
                              </div>
                              {index < mockStages.length - 1 && (
                                <div className="w-0.5 h-8 bg-gray-300 mt-2"></div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">{stage.name}</h3>
                                {stage.is_final_stage && (
                                  <Badge className="bg-green-100 text-green-800">Etapa Final</Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <UserCheck className="h-4 w-4" />
                                  <span>Aprovados: {stage.candidates_passed}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  <span>Total: {stage.total_candidates}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Taxa: {Math.round((stage.candidates_passed / stage.total_candidates) * 100)}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toast({ title: "Visualizando candidatos desta etapa" })}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Candidatos
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <Button variant="outline" onClick={() => setShowStages(false)}>
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Criação de Processo */}
      {showCreateModal && (
        <CreateSelectionProcessModal
          companyId={companyId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            toast({
              title: "Processo Criado",
              description: "O processo seletivo foi criado com sucesso",
              variant: "default"
            });
          }}
        />
      )}
    </div>
  );
};

// Modal de Criação de Processo Seletivo
const CreateSelectionProcessModal: React.FC<{
  companyId: string;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    job_opening_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    stages: [
      { name: 'Triagem de Currículos', stage_type: 'triagem', order_index: 1, is_final_stage: false },
      { name: 'Entrevista Inicial', stage_type: 'entrevista', order_index: 2, is_final_stage: false },
      { name: 'Entrevista Final', stage_type: 'entrevista_final', order_index: 3, is_final_stage: true }
    ]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data para vagas disponíveis
  const mockJobOpenings = [
    { id: '1', name: 'Desenvolvedor Frontend' },
    { id: '2', name: 'Analista de RH' },
    { id: '3', name: 'Gerente de Projetos' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Aqui você implementaria a chamada para a API
      // await createSelectionProcess({ ...formData, company_id: companyId });
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess();
    } catch (error) {
      console.error('Erro ao criar processo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addStage = () => {
    const newOrderIndex = formData.stages.length + 1;
    setFormData({
      ...formData,
      stages: [
        ...formData.stages,
        { 
          name: '', 
          stage_type: 'triagem', 
          order_index: newOrderIndex, 
          is_final_stage: false 
        }
      ]
    });
  };

  const removeStage = (index: number) => {
    if (formData.stages.length > 1) {
      const updatedStages = formData.stages.filter((_, i) => i !== index);
      setFormData({ ...formData, stages: updatedStages });
    }
  };

  const updateStage = (index: number, field: string, value: any) => {
    const updatedStages = [...formData.stages];
    updatedStages[index] = { ...updatedStages[index], [field]: value };
    setFormData({ ...formData, stages: updatedStages });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Novo Processo Seletivo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome do Processo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="job_opening_id">Vaga *</Label>
                <Select value={formData.job_opening_id} onValueChange={(value) => setFormData({ ...formData, job_opening_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma vaga" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockJobOpenings.map((opening) => (
                      <SelectItem key={opening.id} value={opening.id}>
                        {opening.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Data de Início *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_date">Data de Término</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-semibold">Etapas do Processo</Label>
                <Button type="button" onClick={addStage} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Etapa
                </Button>
              </div>
              
              <div className="space-y-4">
                {formData.stages.map((stage, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div>
                        <Label>Nome da Etapa</Label>
                        <Input
                          value={stage.name}
                          onChange={(e) => updateStage(index, 'name', e.target.value)}
                          placeholder="Ex: Entrevista Técnica"
                        />
                      </div>
                      <div>
                        <Label>Tipo</Label>
                        <Select value={stage.stage_type} onValueChange={(value) => updateStage(index, 'stage_type', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="triagem">Triagem</SelectItem>
                            <SelectItem value="entrevista">Entrevista</SelectItem>
                            <SelectItem value="prova_tecnica">Prova Técnica</SelectItem>
                            <SelectItem value="dinamica">Dinâmica</SelectItem>
                            <SelectItem value="entrevista_final">Entrevista Final</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`final-${index}`}
                          checked={stage.is_final_stage}
                          onChange={(e) => updateStage(index, 'is_final_stage', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor={`final-${index}`} className="text-sm">Etapa Final</Label>
                      </div>
                      <div>
                        <Button
                          type="button"
                          onClick={() => removeStage(index)}
                          variant="destructive"
                          size="sm"
                          disabled={formData.stages.length === 1}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Criando..." : "Criar Processo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelectionProcessTab;
