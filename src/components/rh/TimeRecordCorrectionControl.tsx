import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Lock, Unlock, AlertCircle, CheckCircle } from 'lucide-react';
import { useTimeRecordCorrectionControl } from '@/hooks/rh/useTimeRecordCorrectionControl';
import { useToast } from '@/hooks/use-toast';

interface TimeRecordCorrectionControlProps {
  companyId: string;
}

export function TimeRecordCorrectionControl({ companyId }: TimeRecordCorrectionControlProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const { toast } = useToast();

  const {
    correctionStatuses,
    isLoading,
    getCorrectionStatus,
    setCorrectionStatus
  } = useTimeRecordCorrectionControl(companyId);

  const currentStatus = getCorrectionStatus(selectedYear, selectedMonth);

  const handleToggleCorrection = async (enabled: boolean) => {
    try {
      await setCorrectionStatus.mutateAsync({
        companyId,
        year: selectedYear,
        month: selectedMonth,
        enabled
      });

      toast({
        title: enabled ? "Correção Liberada" : "Correção Bloqueada",
        description: `A correção do ponto para ${getMonthName(selectedMonth)}/${selectedYear} foi ${enabled ? 'liberada' : 'bloqueada'} com sucesso.`,
        variant: enabled ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status da correção. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  const getStatusBadge = (enabled: boolean) => {
    if (enabled) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <Unlock className="h-3 w-3 mr-1" />
          Liberada
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200">
        <Lock className="h-3 w-3 mr-1" />
        Bloqueada
      </Badge>
    );
  };

  const getStatusIcon = (enabled: boolean) => {
    if (enabled) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <AlertCircle className="h-5 w-5 text-red-600" />;
  };

  const getStatusMessage = (enabled: boolean) => {
    if (enabled) {
      return "Os funcionários podem editar seus registros de ponto no Portal do Funcionário.";
    }
    return "Os funcionários NÃO podem editar seus registros de ponto no Portal do Funcionário.";
  };

  // Gerar lista de anos (últimos 3 anos + próximos 2 anos)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 3 + i);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando configurações...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Controle de Correção do Ponto</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seletor de Ano e Mês */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year-select">Ano</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="month-select">Mês</Label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar mês" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <SelectItem key={month} value={month.toString()}>
                      {getMonthName(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status Atual */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon(currentStatus)}
                <span className="font-medium">
                  Status para {getMonthName(selectedMonth)}/{selectedYear}
                </span>
              </div>
              {getStatusBadge(currentStatus)}
            </div>
            <p className="text-sm text-gray-600">
              {getStatusMessage(currentStatus)}
            </p>
          </div>

          {/* Controle de Liberação */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="correction-toggle" className="text-base font-medium">
                Liberar Correção do Ponto
              </Label>
              <p className="text-sm text-gray-600">
                Ative para permitir que funcionários editem seus registros de ponto
              </p>
            </div>
            <Switch
              id="correction-toggle"
              checked={currentStatus}
              onCheckedChange={handleToggleCorrection}
              disabled={setCorrectionStatus.isPending}
            />
          </div>

          {/* Botões de Ação Rápida */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => handleToggleCorrection(true)}
              disabled={currentStatus || setCorrectionStatus.isPending}
              className="flex items-center space-x-2"
            >
              <Unlock className="h-4 w-4" />
              <span>Liberar</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleToggleCorrection(false)}
              disabled={!currentStatus || setCorrectionStatus.isPending}
              className="flex items-center space-x-2"
            >
              <Lock className="h-4 w-4" />
              <span>Bloquear</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Configurações */}
      {correctionStatuses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Configurações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {correctionStatuses.slice(0, 10).map((status) => (
                <div
                  key={status.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(status.correction_enabled)}
                    <div>
                      <p className="font-medium">
                        {getMonthName(status.month)}/{status.year}
                      </p>
                      <p className="text-sm text-gray-500">
                        Atualizado em {new Date(status.updated_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(status.correction_enabled)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
