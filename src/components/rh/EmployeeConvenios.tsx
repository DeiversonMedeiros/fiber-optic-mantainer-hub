// @ts-nocheck
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Users, Calendar, DollarSign } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { FuncionarioConvenio, ConvenioPlano, EmployeeDependent } from '@/integrations/supabase/rh-types';

interface EmployeeConveniosProps {
  employeeId: string;
  companyId: string;
  className?: string;
}

export function EmployeeConvenios({ employeeId, companyId, className = '' }: EmployeeConveniosProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedConvenio, setSelectedConvenio] = useState<FuncionarioConvenio | null>(null);
  const [formData, setFormData] = useState({
    convenio_plano_id: '',
    data_inicio: '',
    data_fim: '',
    valor_titular: 0,
    valor_dependentes: 0,
    observacoes: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar convênios do funcionário
  const { data: convenios = [], isLoading: conveniosLoading } = useQuery({
    queryKey: ['employee-convenios', employeeId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('rh.funcionario_convenios')
        .select(`
          *,
          convenio_plano:convenios_planos(
            *,
            convenio_empresa:convenios_empresas(*)
          )
        `)
        .eq('employee_id', employeeId)
        .order('data_inicio', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Buscar planos de convênio disponíveis
  const { data: conveniosPlanos = [] } = useQuery({
    queryKey: ['convenios-planos', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('rh.convenios_planos')
        .select(`
          *,
          convenio_empresa:convenios_empresas(*)
        `)
        .eq('is_active', true)
        .order('nome');

      if (error) throw error;
      return data;
    }
  });

  // Buscar dependentes do funcionário
  const { data: dependents = [] } = useQuery({
    queryKey: ['employee-dependents', employeeId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('rh.employee_dependents')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  // Criar convênio
  const createConvenio = useMutation({
    mutationFn: async (data: typeof formData) => {
      const convenioData = {
        employee_id: employeeId,
        convenio_plano_id: data.convenio_plano_id,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim || null,
        valor_titular: data.valor_titular,
        valor_dependentes: data.valor_dependentes,
        valor_total: data.valor_titular + data.valor_dependentes,
        observacoes: data.observacoes || null,
        status: 'ativo' as const
      };

      const { data: result, error } = await rhSupabase
        .from('rh.funcionario_convenios')
        .insert(convenioData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-convenios', employeeId] });
      setIsFormOpen(false);
      setFormData({
        convenio_plano_id: '',
        data_inicio: '',
        data_fim: '',
        valor_titular: 0,
        valor_dependentes: 0,
        observacoes: ''
      });
      toast({
        title: 'Sucesso',
        description: 'Convênio adicionado com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar convênio: ' + error.message,
        variant: 'destructive',
      });
    }
  });

  // Atualizar convênio
  const updateConvenio = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & typeof formData) => {
      const convenioData = {
        convenio_plano_id: data.convenio_plano_id,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim || null,
        valor_titular: data.valor_titular,
        valor_dependentes: data.valor_dependentes,
        valor_total: data.valor_titular + data.valor_dependentes,
        observacoes: data.observacoes || null
      };

      const { data: result, error } = await rhSupabase
        .from('rh.funcionario_convenios')
        .update(convenioData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-convenios', employeeId] });
      setIsFormOpen(false);
      setSelectedConvenio(null);
      toast({
        title: 'Sucesso',
        description: 'Convênio atualizado com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar convênio: ' + error.message,
        variant: 'destructive',
      });
    }
  });

  // Deletar convênio
  const deleteConvenio = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('rh.funcionario_convenios')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-convenios', employeeId] });
      toast({
        title: 'Sucesso',
        description: 'Convênio removido com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao remover convênio: ' + error.message,
        variant: 'destructive',
      });
    }
  });

  const handleEdit = (convenio: FuncionarioConvenio) => {
    setSelectedConvenio(convenio);
    setFormData({
      convenio_plano_id: convenio.convenio_plano_id,
      data_inicio: convenio.data_inicio,
      data_fim: convenio.data_fim || '',
      valor_titular: convenio.valor_titular,
      valor_dependentes: convenio.valor_dependentes,
      observacoes: convenio.observacoes || ''
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedConvenio) {
      updateConvenio.mutate({ id: selectedConvenio.id, ...formData });
    } else {
      createConvenio.mutate(formData);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'suspenso': return 'bg-yellow-100 text-yellow-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Convênios e Dependentes
            </CardTitle>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Convênio
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedConvenio ? 'Editar Convênio' : 'Novo Convênio'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure o convênio médico/odontológico do funcionário
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="convenio_plano_id">Plano de Convênio</Label>
                      <Select
                        value={formData.convenio_plano_id}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, convenio_plano_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um plano" />
                        </SelectTrigger>
                        <SelectContent>
                          {conveniosPlanos.map((plano) => (
                            <SelectItem key={plano.id} value={plano.id}>
                              {plano.convenio_empresa?.nome} - {plano.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="data_inicio">Data de Início</Label>
                      <Input
                        id="data_inicio"
                        type="date"
                        value={formData.data_inicio}
                        onChange={(e) => setFormData(prev => ({ ...prev, data_inicio: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="data_fim">Data de Fim (opcional)</Label>
                      <Input
                        id="data_fim"
                        type="date"
                        value={formData.data_fim}
                        onChange={(e) => setFormData(prev => ({ ...prev, data_fim: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor_titular">Valor Titular (R$)</Label>
                      <Input
                        id="valor_titular"
                        type="number"
                        step="0.01"
                        value={formData.valor_titular}
                        onChange={(e) => setFormData(prev => ({ ...prev, valor_titular: parseFloat(e.target.value) || 0 }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="valor_dependentes">Valor Dependentes (R$)</Label>
                      <Input
                        id="valor_dependentes"
                        type="number"
                        step="0.01"
                        value={formData.valor_dependentes}
                        onChange={(e) => setFormData(prev => ({ ...prev, valor_dependentes: parseFloat(e.target.value) || 0 }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total (R$)</Label>
                      <Input
                        value={formatCurrency(formData.valor_titular + formData.valor_dependentes)}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Input
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                      placeholder="Observações adicionais..."
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsFormOpen(false);
                        setSelectedConvenio(null);
                        setFormData({
                          convenio_plano_id: '',
                          data_inicio: '',
                          data_fim: '',
                          valor_titular: 0,
                          valor_dependentes: 0,
                          observacoes: ''
                        });
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createConvenio.isPending || updateConvenio.isPending}
                    >
                      {createConvenio.isPending || updateConvenio.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {conveniosLoading ? (
            <div className="text-center py-4">Carregando convênios...</div>
          ) : convenios.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum convênio cadastrado
            </div>
          ) : (
            <div className="space-y-4">
              {convenios.map((convenio) => (
                <Card key={convenio.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">
                          {convenio.convenio_plano?.convenio_empresa?.nome} - {convenio.convenio_plano?.nome}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {convenio.convenio_plano?.tipo_plano} • {convenio.convenio_plano?.convenio_empresa?.tipo}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(convenio.status || 'ativo')}>
                          {convenio.status || 'ativo'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(convenio)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteConvenio.mutate(convenio.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Período</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(convenio.data_inicio)} - {convenio.data_fim ? formatDate(convenio.data_fim) : 'Ativo'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Valor Total</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(convenio.valor_total)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Dependentes</p>
                          <p className="text-sm text-muted-foreground">
                            {dependents.length} cadastrado(s)
                          </p>
                        </div>
                      </div>
                    </div>

                    {convenio.observacoes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm">
                          <strong>Observações:</strong> {convenio.observacoes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}






















