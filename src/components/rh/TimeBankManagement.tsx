import React, { useState } from 'react';
import { useTimeBank } from '@/hooks/rh/useTimeBank';
import { useCompany } from '@/hooks/useCompany';
import { timeBankValidationSchema, timeBankBusinessRules } from '@/lib/validations/rh-validations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Clock, CheckCircle, XCircle, AlertCircle, Calculator, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface TimeBankFormData {
  employee_id: string;
  tipo: 'credito' | 'debito';
  quantidade: string;
  data_registro: string;
  justificativa: string;
  time_record_id?: string;
}

export function TimeBankManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTimeBank, setSelectedTimeBank] = useState<any>(null);
  const [formData, setFormData] = useState<TimeBankFormData>({
    employee_id: '',
    tipo: 'credito',
    quantidade: '',
    data_registro: '',
    justificativa: ''
  });

  const { company } = useCompany();
  const {
    timeBanks,
    isLoading,
    error,
    createTimeBank,
    updateTimeBank,
    deleteTimeBank,
    getTimeBankBalance,
    getTimeBankSummary
  } = useTimeBank(company?.id);

  const resetForm = () => {
    setFormData({
      employee_id: '',
      tipo: 'credito',
      quantidade: '',
      data_registro: '',
      justificativa: ''
    });
    setSelectedTimeBank(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!company?.id) {
      toast.error('Empresa não identificada');
      return;
    }

    const timeBankData = {
      company_id: company.id,
      employee_id: formData.employee_id,
      tipo: formData.tipo,
      quantidade: parseFloat(formData.quantidade),
      data_registro: formData.data_registro,
      justificativa: formData.justificativa,
      time_record_id: formData.time_record_id || null
    };

    // Validar dados usando schema
    try {
      timeBankValidationSchema.parse(timeBankData);
    } catch (error: any) {
      const firstError = error.errors?.[0];
      toast.error(firstError?.message || 'Dados inválidos');
      return;
    }

    // Validar regras de negócio
    if (timeBanks) {
      const currentBalance = timeBankBusinessRules.calculateBalance(timeBanks);
      const quantidade = parseFloat(formData.quantidade);
      
      if (formData.tipo === 'debito') {
        if (!timeBankBusinessRules.canHaveDebit(currentBalance, quantidade)) {
          toast.error('Débito excederia o limite máximo permitido no banco de horas');
          return;
        }
      } else {
        if (!timeBankBusinessRules.canHaveCredit(currentBalance, quantidade)) {
          toast.error('Crédito excederia o limite máximo permitido no banco de horas');
          return;
        }
      }
    }

    if (selectedTimeBank) {
      updateTimeBank.mutate({
        id: selectedTimeBank.id,
        ...timeBankData
      });
    } else {
      createTimeBank.mutate(timeBankData);
    }
  };

  const handleEdit = (timeBank: any) => {
    setSelectedTimeBank(timeBank);
    setFormData({
      employee_id: timeBank.employee_id,
      tipo: timeBank.tipo,
      quantidade: timeBank.quantidade.toString(),
      data_registro: timeBank.data_registro,
      justificativa: timeBank.justificativa || '',
      time_record_id: timeBank.time_record_id || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro de banco de horas?')) {
      deleteTimeBank.mutate(id);
    }
  };

  const getTypeBadge = (tipo: string) => {
    return tipo === 'credito' ? (
      <Badge className="bg-green-100 text-green-800">
        <TrendingUp className="w-3 h-3 mr-1" />
        Crédito
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <Calculator className="w-3 h-3 mr-1" />
        Débito
      </Badge>
    );
  };

  const calculateTotalBalance = () => {
    if (!timeBanks) return { credits: 0, debits: 0, balance: 0 };
    
    const credits = timeBanks
      .filter(tb => tb.tipo === 'credito')
      .reduce((sum, tb) => sum + (tb.quantidade || 0), 0);
    
    const debits = timeBanks
      .filter(tb => tb.tipo === 'debito')
      .reduce((sum, tb) => sum + (tb.quantidade || 0), 0);
    
    return {
      credits,
      debits,
      balance: credits - debits
    };
  };

  const stats = calculateTotalBalance();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Carregando banco de horas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>Erro ao carregar banco de horas: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Banco de Horas</h1>
          <p className="text-gray-600">Gerencie os registros de banco de horas dos funcionários</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedTimeBank ? 'Editar Registro' : 'Novo Registro'} de Banco de Horas
              </DialogTitle>
              <DialogDescription>
                {selectedTimeBank 
                  ? 'Edite os dados do registro de banco de horas.'
                  : 'Adicione um novo registro de banco de horas para um funcionário.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="employee_id">Funcionário *</Label>
                  <Input
                    id="employee_id"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                    placeholder="ID do funcionário"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(value: 'credito' | 'debito') => setFormData({...formData, tipo: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credito">Crédito</SelectItem>
                      <SelectItem value="debito">Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantidade">Quantidade (horas) *</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.quantidade}
                    onChange={(e) => setFormData({...formData, quantidade: e.target.value})}
                    placeholder="Ex: 8.5"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="data_registro">Data do Registro *</Label>
                  <Input
                    id="data_registro"
                    type="date"
                    value={formData.data_registro}
                    onChange={(e) => setFormData({...formData, data_registro: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="justificativa">Justificativa</Label>
                  <Textarea
                    id="justificativa"
                    value={formData.justificativa}
                    onChange={(e) => setFormData({...formData, justificativa: e.target.value})}
                    placeholder="Descreva a justificativa para o registro..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTimeBank.isPending || updateTimeBank.isPending}
                >
                  {(createTimeBank.isPending || updateTimeBank.isPending) ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timeBanks?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Créditos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.credits.toFixed(1)}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Débitos</CardTitle>
            <Calculator className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.debits.toFixed(1)}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.balance.toFixed(1)}h
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Bank Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Registros de Banco de Horas
          </CardTitle>
          <CardDescription>
            Lista de todos os registros de banco de horas dos funcionários
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!timeBanks || timeBanks.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum registro de banco de horas encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Justificativa</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeBanks.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.employee?.nome || 'N/A'}
                    </TableCell>
                    <TableCell>{getTypeBadge(record.tipo)}</TableCell>
                    <TableCell>{record.quantidade}h</TableCell>
                    <TableCell>
                      {new Date(record.data_registro).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {record.justificativa || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(record)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(record.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
