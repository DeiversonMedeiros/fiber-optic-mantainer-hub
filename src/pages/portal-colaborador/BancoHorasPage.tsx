import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Clock, Plus, TrendingUp, TrendingDown, Calendar, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const BancoHorasPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Estados do formulário
  const [formData, setFormData] = useState({
    dataSolicitacao: '',
    dataCompensacao: '',
    quantidadeHoras: 0,
    justificativa: ''
  });

  // Buscar saldo e movimentações do banco de horas
  const { data: bancoHoras, isLoading } = useQuery({
    queryKey: ['banco-horas', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const [movimentacoes, compensacoes] = await Promise.all([
        rhSupabase
          .from('time_bank')
          .select('*')
          .eq('employee_id', user.id)
          .order('created_at', { ascending: false }),
        
        rhSupabase
          .from('compensation_requests')
          .select('*')
          .eq('employee_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (movimentacoes.error) throw movimentacoes.error;
      if (compensacoes.error) throw compensacoes.error;

      // Calcular saldo atual
      const saldo = movimentacoes.data?.reduce((acc, item) => {
        return acc + (item.tipo === 'credito' ? item.quantidade : -item.quantidade);
      }, 0) || 0;

      return {
        saldo,
        movimentacoes: movimentacoes.data || [],
        compensacoes: compensacoes.data || []
      };
    },
    enabled: !!user?.id
  });

  // Mutation para criar nova solicitação de compensação
  const createCompensationMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await rhSupabase
        .from('compensation_requests')
        .insert([{
          company_id: user?.id, // Assumindo que o company_id é o mesmo do user
          employee_id: user?.id,
          data_solicitacao: data.dataSolicitacao,
          data_compensacao: data.dataCompensacao,
          quantidade_horas: data.quantidadeHoras,
          justificativa: data.justificativa,
          status: 'pendente'
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Solicitação enviada!",
        description: "Sua solicitação de compensação foi enviada para aprovação.",
      });
      queryClient.invalidateQueries({ queryKey: ['banco-horas', user?.id] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      dataSolicitacao: '',
      dataCompensacao: '',
      quantidadeHoras: 0,
      justificativa: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.dataSolicitacao || !formData.dataCompensacao || formData.quantidadeHoras <= 0) {
      toast({
        title: "Dados inválidos",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (formData.quantidadeHoras > (bancoHoras?.saldo || 0)) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não possui saldo suficiente para esta compensação.",
        variant: "destructive",
      });
      return;
    }

    createCompensationMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'rejeitado':
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTipoIcon = (tipo: string) => {
    return tipo === 'credito' ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getTipoColor = (tipo: string) => {
    return tipo === 'credito' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banco de Horas</h1>
          <p className="text-gray-600">Gerencie seu saldo de horas e solicite compensações</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2" disabled={!bancoHoras?.saldo || bancoHoras.saldo <= 0}>
              <Plus className="h-4 w-4" />
              <span>Solicitar Compensação</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Nova Solicitação de Compensação</span>
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Saldo Disponível</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      Você possui {bancoHoras?.saldo?.toFixed(2) || '0'} horas disponíveis para compensação.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataSolicitacao">Data da Solicitação</Label>
                  <Input
                    id="dataSolicitacao"
                    type="date"
                    value={formData.dataSolicitacao}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataSolicitacao: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="dataCompensacao">Data para Compensação</Label>
                  <Input
                    id="dataCompensacao"
                    type="date"
                    value={formData.dataCompensacao}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataCompensacao: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="quantidadeHoras">Quantidade de Horas</Label>
                <Input
                  id="quantidadeHoras"
                  type="number"
                  min="0.5"
                  max={bancoHoras?.saldo || 0}
                  step="0.5"
                  value={formData.quantidadeHoras}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantidadeHoras: parseFloat(e.target.value) || 0 }))}
                  required
                />
                <p className="text-sm text-gray-600 mt-1">
                  Máximo: {bancoHoras?.saldo?.toFixed(2) || '0'} horas
                </p>
              </div>

              <div>
                <Label htmlFor="justificativa">Justificativa</Label>
                <Textarea
                  id="justificativa"
                  placeholder="Explique o motivo da compensação..."
                  value={formData.justificativa}
                  onChange={(e) => setFormData(prev => ({ ...prev, justificativa: e.target.value }))}
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createCompensationMutation.isPending}>
                  {createCompensationMutation.isPending ? 'Enviando...' : 'Enviar Solicitação'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bancoHoras?.saldo ? `${bancoHoras.saldo.toFixed(2)}h` : '0h'}
            </div>
            <p className="text-xs text-muted-foreground">
              {bancoHoras?.saldo && bancoHoras.saldo > 0 ? 'Disponível para compensação' : 'Sem saldo'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Extras</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {bancoHoras?.movimentacoes
                .filter(m => m.tipo === 'credito')
                .reduce((acc, m) => acc + m.quantidade, 0)
                .toFixed(2) || '0'}h
            </div>
            <p className="text-xs text-muted-foreground">
              Total acumulado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compensações</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {bancoHoras?.movimentacoes
                .filter(m => m.tipo === 'debito')
                .reduce((acc, m) => acc + m.quantidade, 0)
                .toFixed(2) || '0'}h
            </div>
            <p className="text-xs text-muted-foreground">
              Total compensado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Solicitações Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Solicitações de Compensação</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando solicitações...</p>
            </div>
          ) : bancoHoras?.compensacoes && bancoHoras.compensacoes.length > 0 ? (
            <div className="space-y-4">
              {bancoHoras.compensacoes.map((compensacao) => (
                <div key={compensacao.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="font-medium">
                          {compensacao.quantidade_horas}h - {new Date(compensacao.data_solicitacao).toLocaleDateString()}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Para compensar em: {new Date(compensacao.data_compensacao).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(compensacao.status)}
                  </div>
                  
                  {compensacao.justificativa && (
                    <div className="text-sm text-gray-600">
                      <p><strong>Justificativa:</strong> {compensacao.justificativa}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma solicitação encontrada
              </h3>
              <p className="text-gray-600">
                Você ainda não fez nenhuma solicitação de compensação.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Movimentações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          {bancoHoras?.movimentacoes && bancoHoras.movimentacoes.length > 0 ? (
            <div className="space-y-3">
              {bancoHoras.movimentacoes.map((movimentacao) => (
                <div key={movimentacao.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTipoIcon(movimentacao.tipo)}
                    <div>
                      <p className="font-medium capitalize">
                        {movimentacao.tipo === 'credito' ? 'Horas Extras' : 'Compensação'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(movimentacao.data_registro).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${getTipoColor(movimentacao.tipo)}`}>
                      {movimentacao.tipo === 'credito' ? '+' : '-'}{movimentacao.quantidade}h
                    </p>
                    {movimentacao.justificativa && (
                      <p className="text-sm text-gray-600">
                        {movimentacao.justificativa}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma movimentação encontrada
              </h3>
              <p className="text-gray-600">
                Não há movimentações registradas no seu banco de horas.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BancoHorasPage;
