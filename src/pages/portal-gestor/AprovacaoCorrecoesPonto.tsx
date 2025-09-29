import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { usePendingAttendanceCorrections, useAttendanceCorrectionStats, useAttendanceCorrectionApproval } from '@/hooks/rh/useAttendanceCorrections';

interface AttendanceCorrection {
  id: string;
  employee_id: string;
  employee_name: string;
  data_original: string;
  hora_entrada_original?: string;
  hora_saida_original?: string;
  hora_entrada_corrigida?: string;
  hora_saida_corrigida?: string;
  justificativa: string;
  status: 'pendente' | 'aprovado' | 'reprovado';
  horario_correcao: string;
  created_at: string;
  aprovado_por?: string;
  data_aprovacao?: string;
}

const AprovacaoCorrecoesPonto: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendente' | 'aprovado' | 'reprovado'>('all');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedCorrection, setSelectedCorrection] = useState<string | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeCompanyId } = useActiveCompany();

  // Hooks para dados
  const { data: pendingCorrections, isLoading: loadingPending, refetch: refetchPending } = usePendingAttendanceCorrections(activeCompanyId || '');
  const { data: stats, isLoading: loadingStats } = useAttendanceCorrectionStats(activeCompanyId || '');
  const approvalMutation = useAttendanceCorrectionApproval();

  const handleApprove = async (correctionId: string) => {
    if (!user || !activeCompanyId) return;

    try {
      await approvalMutation.mutateAsync({
        correctionId,
        status: 'aprovado',
        approvedBy: user.id
      });

      toast({
        title: "Aprovado",
        description: "Correção de ponto aprovada com sucesso",
        variant: "default"
      });

      refetchPending();
    } catch (error) {
      console.error('Erro ao aprovar correção:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar a correção",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (correctionId: string) => {
    if (!user || !activeCompanyId || !rejectionReason.trim()) {
      toast({
        title: "Atenção",
        description: "Por favor, informe o motivo da rejeição",
        variant: "destructive"
      });
      return;
    }

    try {
      await approvalMutation.mutateAsync({
        correctionId,
        status: 'reprovado',
        approvedBy: user.id,
        rejectionReason: rejectionReason.trim()
      });

      toast({
        title: "Rejeitado",
        description: "Correção de ponto rejeitada",
        variant: "destructive"
      });

      setRejectionReason('');
      setShowRejectionModal(false);
      setSelectedCorrection(null);
      refetchPending();
    } catch (error) {
      console.error('Erro ao rejeitar correção:', error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar a correção",
        variant: "destructive"
      });
    }
  };

  const openRejectionModal = (correctionId: string) => {
    setSelectedCorrection(correctionId);
    setShowRejectionModal(true);
  };

  const formatTime = (time?: string) => {
    return time ? time.substring(0, 5) : '--:--';
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'aprovado':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'reprovado':
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Desconhecido</Badge>;
    }
  };

  const filteredCorrections = pendingCorrections?.filter(correction => {
    const matchesSearch = correction.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         correction.justificativa.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || correction.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  if (!activeCompanyId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Empresa não selecionada</h3>
              <p className="text-muted-foreground mb-4">
                Para visualizar as correções de ponto, você precisa selecionar uma empresa no seletor localizado no cabeçalho da página.
              </p>
              <p className="text-sm text-muted-foreground">
                A seleção será salva automaticamente para suas próximas sessões.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Aprovação de Correções de Ponto</h1>
          <p className="text-muted-foreground">
            Gerencie as solicitações de correção de ponto da sua equipe
          </p>
        </div>
        <Button onClick={() => refetchPending()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      {!loadingStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Pendentes</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Aprovadas</p>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Rejeitadas</p>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por funcionário ou justificativa..."
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
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="aprovado">Aprovadas</SelectItem>
                  <SelectItem value="reprovado">Rejeitadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Correções */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Correções de Ponto ({filteredCorrections.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPending ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando correções...</p>
              </div>
            </div>
          ) : filteredCorrections.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma correção encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCorrections.map((correction) => (
                <Card key={correction.id} className="border-l-4 border-l-yellow-400">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-gray-500" />
                        <div>
                          <h3 className="font-medium">{correction.employee_name}</h3>
                          <p className="text-sm text-gray-500">
                            Data: {new Date(correction.data_original).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Corrigido em: {formatDateTime(correction.horario_correcao)}
                        </p>
                        {getStatusBadge(correction.status)}
                      </div>
                    </div>

                    {/* Horários Originais vs Corrigidos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          Horários Originais
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p>Entrada: {formatTime(correction.hora_entrada_original)}</p>
                          <p>Saída: {formatTime(correction.hora_saida_original)}</p>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 p-3 rounded-lg">
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Horários Corrigidos
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p>Entrada: {formatTime(correction.hora_entrada_corrigida)}</p>
                          <p>Saída: {formatTime(correction.hora_saida_corrigida)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Justificativa */}
                    <div className="mb-4">
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Justificativa
                      </h4>
                      <p className="text-sm bg-gray-50 p-3 rounded-lg">
                        {correction.justificativa}
                      </p>
                    </div>

                    {/* Ações */}
                    {correction.status === 'pendente' && (
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRejectionModal(correction.id)}
                          disabled={approvalMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Rejeitar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(correction.id)}
                          disabled={approvalMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Rejeição */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle>Motivo da Rejeição</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Por favor, informe o motivo da rejeição:</label>
                <textarea
                  placeholder="Informe o motivo da rejeição..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full mt-2 p-3 border rounded-lg resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectionModal(false);
                    setSelectedCorrection(null);
                    setRejectionReason('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => selectedCorrection && handleReject(selectedCorrection)}
                  disabled={!rejectionReason.trim() || approvalMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Rejeitar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AprovacaoCorrecoesPonto;
