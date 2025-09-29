import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Calendar, 
  FileText, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Stethoscope
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { rhSupabase, coreSupabase, financeiroSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const ColaboradorDashboard = () => {
  const { user } = useAuth();

  // Buscar dados do colaborador (sem embeds entre schemas)
  const { data: employee } = useQuery({
    queryKey: ['employee-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      // 1) Busca o empregado básico
      const { data: emp, error: empError } = await rhSupabase
        .from('rh.employees')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (empError) throw empError;

      // 2) Busca nomes relacionados em paralelo (positions: rh, departments: core, work_schedules: rh)
      const [pos, dep, ws] = await Promise.all([
        emp?.position_id
          ? rhSupabase.from('rh.positions').select('nome').eq('id', emp.position_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        emp?.department_id
          ? coreSupabase.from('rh.departments').select('nome').eq('id', emp.department_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        emp?.work_schedule_id
          ? rhSupabase.from('rh.work_schedules').select('nome, descricao').eq('id', emp.work_schedule_id).maybeSingle()
          : Promise.resolve({ data: null, error: null })
      ]);

      return {
        ...emp,
        positions: pos.data ? { nome: (pos.data as any).nome } : null,
        departments: dep.data ? { nome: (dep.data as any).nome } : null,
        work_schedules: ws.data ? { nome: (ws.data as any).nome, descricao: (ws.data as any).descricao } : null
      } as any;
    },
    enabled: !!user?.id
  });

  // Buscar saldo do banco de horas
  const { data: timeBankBalance } = useQuery({
    queryKey: ['time-bank-balance', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await rhSupabase
        .from('rh.time_bank')
        .select('*')
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Calcular saldo
      const saldo = data?.reduce((acc, item) => {
        return acc + (item.tipo === 'credito' ? item.quantidade : -item.quantidade);
      }, 0) || 0;
      
      return { saldo, movimentacoes: data || [] };
    },
    enabled: !!user?.id
  });

  // Buscar férias agendadas
  const { data: proximasFerias } = useQuery({
    queryKey: ['proximas-ferias', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await rhSupabase
        .from('rh.vacations')
        .select('*')
        .eq('employee_id', user.id)
        .eq('status', 'aprovado')
        .gte('data_inicio', new Date().toISOString().split('T')[0])
        .order('data_inicio', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Buscar exames pendentes
  const { data: examesPendentes } = useQuery({
    queryKey: ['exames-pendentes', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await rhSupabase
        .from('rh.periodic_exams')
        .select('*')
        .eq('employee_id', user.id)
        .eq('status', 'agendado')
        .order('data_agendada', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Buscar solicitações pendentes
  const { data: solicitacoesPendentes } = useQuery({
    queryKey: ['solicitacoes-pendentes', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const [ferias, compensacoes, reembolsos] = await Promise.all([
        rhSupabase
          .from('rh.vacations')
          .select('id, data_inicio, dias_ferias, status')
          .eq('employee_id', user.id)
          .eq('status', 'solicitado'),
        
        rhSupabase
          .from('rh.compensation_requests')
          .select('id, data_solicitacao, quantidade_horas, status')
          .eq('employee_id', user.id)
          .eq('status', 'pendente'),
        
        // Buscar reembolsos pendentes do colaborador
        (async () => {
          const { data, error } = await financeiroSupabase
            .from('financeiro.reimbursement_requests')
            .select('id, data_despesa, valor, status')
            .eq('employee_id', user.id)
            .eq('status', 'pendente');
          
          if (error && (error as any).code === 'PGRST116') return { data: [] };
          if (error && (error as any).status === 404) return { data: [] } as any;
          if (error) throw error;
          return { data } as any;
        })()
      ]);

      return {
        ferias: ferias.data || [],
        compensacoes: compensacoes.data || [],
        reembolsos: reembolsos.data || []
      };
    },
    enabled: !!user?.id
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'pendente':
      case 'solicitado':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'rejeitado':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bem-vindo, {employee.nome}!
        </h1>
        <p className="text-gray-600">
          {employee.positions?.nome} • {employee.departments?.nome}
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Banco de Horas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banco de Horas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {timeBankBalance?.saldo ? `${timeBankBalance.saldo.toFixed(2)}h` : '0h'}
            </div>
            <p className="text-xs text-muted-foreground">
              {timeBankBalance?.saldo && timeBankBalance.saldo > 0 ? 'Saldo positivo' : 'Sem saldo'}
            </p>
          </CardContent>
        </Card>

        {/* Próximas Férias */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas Férias</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {proximasFerias ? proximasFerias.dias_ferias : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {proximasFerias 
                ? `${proximasFerias.dias_ferias} dias em ${new Date(proximasFerias.data_inicio).toLocaleDateString()}`
                : 'Nenhuma férias agendada'
              }
            </p>
          </CardContent>
        </Card>

        {/* Exames Pendentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exames Pendentes</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {examesPendentes?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {examesPendentes?.length ? 'Exames agendados' : 'Nenhum exame pendente'}
            </p>
          </CardContent>
        </Card>

        {/* Solicitações Pendentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitações</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(solicitacoesPendentes?.ferias?.length || 0) + 
               (solicitacoesPendentes?.compensacoes?.length || 0) + 
               (solicitacoesPendentes?.reembolsos?.length || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seções Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exames Próximos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Stethoscope className="h-5 w-5" />
              <span>Próximos Exames</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {examesPendentes && examesPendentes.length > 0 ? (
              <div className="space-y-3">
                {examesPendentes.slice(0, 3).map((exame) => (
                  <div key={exame.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{exame.tipo_exame}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(exame.data_agendada).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">Agendado</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum exame agendado</p>
            )}
          </CardContent>
        </Card>

        {/* Solicitações Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Solicitações Recentes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {solicitacoesPendentes?.ferias?.slice(0, 2).map((ferias) => (
                <div key={ferias.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Solicitação de Férias</p>
                    <p className="text-sm text-gray-600">
                      {ferias.dias_ferias} dias em {new Date(ferias.data_inicio).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(ferias.status)}
                </div>
              ))}
              
              {solicitacoesPendentes?.compensacoes?.slice(0, 2).map((compensacao) => (
                <div key={compensacao.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Compensação de Horas</p>
                    <p className="text-sm text-gray-600">
                      {compensacao.quantidade_horas}h em {new Date(compensacao.data_solicitacao).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(compensacao.status)}
                </div>
              ))}
              
              {solicitacoesPendentes?.reembolsos?.slice(0, 2).map((reembolso) => (
                <div key={reembolso.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Solicitação de Reembolso</p>
                    <p className="text-sm text-gray-600">
                      R$ {reembolso.valor.toFixed(2)} em {new Date(reembolso.data_despesa).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(reembolso.status)}
                </div>
              ))}
              
              {(!solicitacoesPendentes?.ferias?.length && 
                !solicitacoesPendentes?.compensacoes?.length && 
                !solicitacoesPendentes?.reembolsos?.length) && (
                <p className="text-gray-500 text-center py-4">Nenhuma solicitação pendente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <Clock className="h-6 w-6" />
              <span>Registrar Ponto</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <Calendar className="h-6 w-6" />
              <span>Solicitar Férias</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <DollarSign className="h-6 w-6" />
              <span>Solicitar Reembolso</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <FileText className="h-6 w-6" />
              <span>Ver Holerite</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ColaboradorDashboard;
