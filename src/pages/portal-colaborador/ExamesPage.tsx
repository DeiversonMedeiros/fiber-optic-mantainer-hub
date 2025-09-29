import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stethoscope, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const ExamesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filtroStatus, setFiltroStatus] = useState('todos');

  // Buscar exames do colaborador
  const { data: exames, isLoading } = useQuery({
    queryKey: ['exames', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await rhSupabase
        .from('periodic_exams')
        .select('*')
        .eq('employee_id', user.id)
        .order('data_agendada', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Mutation para marcar exame como realizado
  const marcarExameMutation = useMutation({
    mutationFn: async (exameId: string) => {
      const { error } = await rhSupabase
        .from('periodic_exams')
        .update({
          data_realizacao: new Date().toISOString().split('T')[0],
          status: 'realizado'
        })
        .eq('id', exameId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Exame marcado como realizado!",
        description: "O exame foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['exames', user?.id] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar exame",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const getStatusBadge = (status: string, dataAgendada: string) => {
    const hoje = new Date().toISOString().split('T')[0];
    const dataExame = new Date(dataAgendada).toISOString().split('T')[0];
    
    switch (status) {
      case 'realizado':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Realizado</Badge>;
      case 'agendado':
        if (dataExame < hoje) {
          return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Vencido</Badge>;
        } else if (dataExame === hoje) {
          return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Hoje</Badge>;
        }
        return <Badge className="bg-blue-100 text-blue-800"><Calendar className="w-3 h-3 mr-1" />Agendado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTipoExameColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'admissional':
        return 'bg-green-100 text-green-800';
      case 'demissional':
        return 'bg-red-100 text-red-800';
      case 'periódico':
        return 'bg-blue-100 text-blue-800';
      case 'mudança de função':
        return 'bg-purple-100 text-purple-800';
      case 'retorno ao trabalho':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filtrar exames
  const examesFiltrados = exames?.filter(exame => {
    if (filtroStatus === 'todos') return true;
    if (filtroStatus === 'pendentes') return exame.status === 'agendado';
    if (filtroStatus === 'realizados') return exame.status === 'realizado';
    return true;
  }) || [];

  // Estatísticas
  const estatisticas = {
    total: exames?.length || 0,
    agendados: exames?.filter(e => e.status === 'agendado').length || 0,
    realizados: exames?.filter(e => e.status === 'realizado').length || 0,
    vencidos: exames?.filter(e => {
      if (e.status !== 'agendado') return false;
      const hoje = new Date().toISOString().split('T')[0];
      const dataExame = new Date(e.data_agendada).toISOString().split('T')[0];
      return dataExame < hoje;
    }).length || 0
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando exames...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Exames Periódicos</h1>
        <p className="text-gray-600">Acompanhe seus exames médicos agendados</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.total}</div>
            <p className="text-xs text-muted-foreground">
              Exames cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendados</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{estatisticas.agendados}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando realização
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Realizados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estatisticas.realizados}</div>
            <p className="text-xs text-muted-foreground">
              Concluídos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{estatisticas.vencidos}</div>
            <p className="text-xs text-muted-foreground">
              Necessitam atenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Filtros</span>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os exames</SelectItem>
                <SelectItem value="pendentes">Pendentes</SelectItem>
                <SelectItem value="realizados">Realizados</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Lista de Exames */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Exames Agendados</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {examesFiltrados.length > 0 ? (
            <div className="space-y-4">
              {examesFiltrados.map((exame) => (
                <div key={exame.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Stethoscope className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="font-medium">{exame.tipo_exame}</h3>
                        <p className="text-sm text-gray-600">
                          Agendado para {new Date(exame.data_agendada).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(exame.status, exame.data_agendada)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Tipo de Exame</p>
                      <p className="font-medium">
                        <Badge className={getTipoExameColor(exame.tipo_exame)}>
                          {exame.tipo_exame}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Data Agendada</p>
                      <p className="font-medium">
                        {new Date(exame.data_agendada).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Data Realizada</p>
                      <p className="font-medium">
                        {exame.data_realizacao 
                          ? new Date(exame.data_realizacao).toLocaleDateString('pt-BR')
                          : '--/--/----'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Resultado</p>
                      <p className="font-medium">
                        {exame.resultado || 'Não informado'}
                      </p>
                    </div>
                  </div>
                  
                  {exame.status === 'agendado' && (
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={() => marcarExameMutation.mutate(exame.id)}
                        disabled={marcarExameMutation.isPending}
                        className="flex items-center space-x-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Marcar como Realizado</span>
                      </Button>
                    </div>
                  )}
                  
                  {exame.arquivo_anexo && (
                    <div className="mt-3 text-sm">
                      <p className="text-gray-600">
                        <strong>Anexo:</strong>{' '}
                        <a 
                          href={exame.arquivo_anexo} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Visualizar arquivo
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filtroStatus === 'todos' 
                  ? 'Nenhum exame encontrado'
                  : `Nenhum exame ${filtroStatus} encontrado`
                }
              </h3>
              <p className="text-gray-600">
                {filtroStatus === 'todos'
                  ? 'Você ainda não possui exames agendados.'
                  : `Não há exames ${filtroStatus} no momento.`
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações Importantes */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Informações Importantes</h3>
              <ul className="text-sm text-blue-800 mt-1 space-y-1">
                <li>• Exames são agendados pela equipe de RH conforme a legislação trabalhista</li>
                <li>• Marque como realizado após comparecer ao exame</li>
                <li>• Exames vencidos devem ser reagendados com urgência</li>
                <li>• Em caso de dúvidas, entre em contato com o RH</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamesPage;
