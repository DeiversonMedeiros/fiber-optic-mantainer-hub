import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  CalendarIcon, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  Users,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMonthlyBenefitProcessing } from '@/hooks/rh/useUnifiedBenefits';
import { useBenefitStatistics } from '@/hooks/rh/useUnifiedBenefits';
import { MonthlyBenefitProcessing, ProcessingStatus } from '@/integrations/supabase/rh-benefits-unified-types';
import { useToast } from '@/hooks/use-toast';

interface BenefitsProcessingTabProps {
  companyId: string;
}

export function BenefitsProcessingTab({ companyId }: BenefitsProcessingTabProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const { 
    data: processing, 
    isLoading, 
    error, 
    processMonthlyBenefits,
    validateMonthlyBenefits,
    deleteProcessing,
    updateProcessing
  } = useMonthlyBenefitProcessing(companyId, selectedMonth, selectedYear);

  // Estado local para forçar re-render
  const [localProcessing, setLocalProcessing] = useState<MonthlyBenefitProcessing[] | undefined>(undefined);
  
  // Estado do modal de edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MonthlyBenefitProcessing | null>(null);
  const [editForm, setEditForm] = useState({
    base_value: 0,
    work_days: 0,
    absence_days: 0,
    discount_value: 0,
    final_value: 0,
    status: 'calculated' as string
  });

  // Log quando os dados mudam
  useEffect(() => {
    console.log('🔄 Processing data changed:', processing);
    setLocalProcessing(processing);
  }, [processing]);

  // Usar dados locais se disponíveis
  const displayData = localProcessing || processing;

  // Debug logs
  console.log('🔍 BenefitsProcessingTab Debug:');
  console.log('📊 processing data:', processing);
  console.log('📊 processing length:', processing?.length);
  console.log('📊 localProcessing data:', localProcessing);
  console.log('📊 localProcessing length:', localProcessing?.length);
  console.log('📊 displayData:', displayData);
  console.log('📊 displayData length:', displayData?.length);
  console.log('⏳ isLoading:', isLoading);
  console.log('❌ error:', error);
  console.log('📅 selectedMonth:', selectedMonth);
  console.log('📅 selectedYear:', selectedYear);
  console.log('🏢 companyId:', companyId);
  console.log('🔍 Component instance ID:', Math.random().toString(36).substr(2, 9));

  const { data: statistics } = useBenefitStatistics(companyId, selectedMonth, selectedYear);

  const handleProcessBenefits = async () => {
    setIsProcessing(true);
    try {
      await processMonthlyBenefits.mutateAsync({
        companyId,
        month: selectedMonth,
        year: selectedYear
      });
      toast({ title: 'Sucesso', description: 'Processamento iniciado com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao processar benefícios', variant: 'destructive' });
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditItem = (item: MonthlyBenefitProcessing) => {
    setEditingItem(item);
    setEditForm({
      base_value: item.base_value || 0,
      work_days: item.work_days || 0,
      absence_days: item.absence_days || 0,
      discount_value: item.discount_value || 0,
      final_value: item.final_value || 0,
      status: item.status || 'calculated'
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    try {
      await updateProcessing.mutateAsync({
        id: editingItem.id,
        ...editForm
      });
      toast({ title: 'Sucesso', description: 'Benefício atualizado com sucesso!' });
      setIsEditModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao atualizar benefício', variant: 'destructive' });
      console.error(error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingItem(null);
    setEditForm({
      base_value: 0,
      work_days: 0,
      absence_days: 0,
      discount_value: 0,
      final_value: 0,
      status: 'calculated'
    });
  };

  const handleDeleteItem = async (item: MonthlyBenefitProcessing) => {
    if (window.confirm(`Tem certeza que deseja excluir o benefício de ${item.employee_name}?`)) {
      try {
        await deleteProcessing.mutateAsync(item.id);
        toast({ title: 'Sucesso', description: 'Item excluído com sucesso!' });
      } catch (error) {
        toast({ title: 'Erro', description: 'Erro ao excluir item', variant: 'destructive' });
        console.error(error);
      }
    }
  };

  const handleValidateBenefits = async () => {
    try {
      await validateMonthlyBenefits.mutateAsync({
        companyId,
        month: selectedMonth,
        year: selectedYear
      });
      toast({ title: 'Sucesso', description: 'Benefícios validados com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao validar benefícios', variant: 'destructive' });
      console.error(error);
    }
  };

  const getStatusBadge = (status: ProcessingStatus) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'outline' as const, icon: Clock },
      calculated: { label: 'Calculado', variant: 'secondary' as const, icon: TrendingUp },
      validated: { label: 'Validado', variant: 'default' as const, icon: CheckCircle },
      paid: { label: 'Pago', variant: 'default' as const, icon: DollarSign },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const, icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getBenefitTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'vr_va': 'VR/VA',
      'transporte': 'Transporte',
      'equipment_rental': 'Locação de Equipamentos',
      'premiacao': 'Premiação'
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Carregando processamentos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Erro ao carregar processamentos: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Processamento Mensal</h3>
          <p className="text-sm text-muted-foreground">
            Processe e valide os benefícios mensais dos funcionários
          </p>
        </div>
      </div>

      {/* Filtros de Período */}
      <Card>
        <CardHeader>
          <CardTitle>Período de Processamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div>
              <Label htmlFor="month">Mês</Label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {format(new Date(2024, month - 1), 'MMM', { locale: ptBR })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="year">Ano</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleProcessBenefits} disabled={isProcessing}>
              <Play className="h-4 w-4 mr-2" />
              {isProcessing ? 'Processando...' : 'Processar Benefícios'}
            </Button>

            {processing && processing.length > 0 && (
              <Button 
                variant="outline" 
                onClick={handleValidateBenefits}
                disabled={validateMonthlyBenefits.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Validar Benefícios
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium leading-none">Funcionários</p>
                  <p className="text-2xl font-bold">{statistics.total_employees || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium leading-none">Processados</p>
                  <p className="text-2xl font-bold">{statistics.total_processed || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium leading-none">Validados</p>
                  <p className="text-2xl font-bold">{statistics.total_validated || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium leading-none">Valor Total</p>
                  <p className="text-2xl font-bold">
                    R$ {(statistics.total_value || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de Processamentos */}
      <Card>
        <CardHeader>
          <CardTitle>
            Processamentos - {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy', { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            console.log('🔍 Table render condition:');
            console.log('📊 displayData exists:', !!displayData);
            console.log('📊 displayData length:', displayData?.length);
            console.log('📊 condition result:', displayData && displayData.length > 0);
            return displayData && displayData.length > 0;
          })() ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Tipo de Benefício</TableHead>
                  <TableHead>Valor Base</TableHead>
                  <TableHead>Descontos</TableHead>
                  <TableHead>Valor Final</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Mês/Ano</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.employee_name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {item.employee_matricula || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {getBenefitTypeLabel(item.benefit_type)}
                    </TableCell>
                    <TableCell>
                      R$ {(item.base_value || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      R$ {(item.discount_value || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        R$ {(item.final_value || 0).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{item.work_days || 0} dias úteis</div>
                        <div className="text-muted-foreground">
                          {item.absence_days || 0} ausências
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {item.month_reference}/{item.year_reference}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditItem(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteItem(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum processamento encontrado para este período. 
                Clique em "Processar Benefícios" para iniciar o cálculo.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo de Status */}
      {processing && processing.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {['pending', 'calculated', 'validated', 'paid', 'cancelled'].map((status) => {
                const count = processing.filter(item => item.status === status).length;
                const config = {
                  pending: { label: 'Pendente', color: 'text-gray-500' },
                  calculated: { label: 'Calculado', color: 'text-blue-500' },
                  validated: { label: 'Validado', color: 'text-green-500' },
                  paid: { label: 'Pago', color: 'text-green-600' },
                  cancelled: { label: 'Cancelado', color: 'text-red-500' },
                }[status as ProcessingStatus];

                return (
                  <div key={status} className="text-center">
                    <div className={`text-2xl font-bold ${config.color}`}>
                      {count}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {config.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Benefício</DialogTitle>
            <DialogDescription>
              Edite os dados do benefício de {editingItem?.employee_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_value">Valor Base</Label>
                <Input
                  id="base_value"
                  type="number"
                  step="0.01"
                  value={editForm.base_value}
                  onChange={(e) => setEditForm(prev => ({ ...prev, base_value: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="work_days">Dias Trabalhados</Label>
                <Input
                  id="work_days"
                  type="number"
                  value={editForm.work_days}
                  onChange={(e) => setEditForm(prev => ({ ...prev, work_days: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="absence_days">Dias de Ausência</Label>
                <Input
                  id="absence_days"
                  type="number"
                  value={editForm.absence_days}
                  onChange={(e) => setEditForm(prev => ({ ...prev, absence_days: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_value">Valor Desconto</Label>
                <Input
                  id="discount_value"
                  type="number"
                  step="0.01"
                  value={editForm.discount_value}
                  onChange={(e) => setEditForm(prev => ({ ...prev, discount_value: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="final_value">Valor Final</Label>
                <Input
                  id="final_value"
                  type="number"
                  step="0.01"
                  value={editForm.final_value}
                  onChange={(e) => setEditForm(prev => ({ ...prev, final_value: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="calculated">Calculado</SelectItem>
                    <SelectItem value="validated">Validado</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateProcessing.isPending}>
              {updateProcessing.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}