import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, User, Building, Briefcase, DollarSign, Clock, MapPin, Download, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEmployeeHistory, useEmployeeHistoryStats } from '@/hooks/rh/useEmployeeHistory';
import { EmployeeHistoryWithDetails } from '@/integrations/supabase/rh-history-types';
import { EmployeeHistoryEntry } from './EmployeeHistoryEntry';
import { EmployeeHistoryAddModal } from './EmployeeHistoryAddModal';

interface EmployeeHistoryProps {
  employeeId: string;
  employeeName: string;
  companyId: string;
  className?: string;
}

export function EmployeeHistory({ employeeId, employeeName, companyId, className }: EmployeeHistoryProps) {
  const [selectedEntry, setSelectedEntry] = useState<EmployeeHistoryWithDetails | null>(null);
  const [showAddEntry, setShowAddEntry] = useState(false);

  const { data: history = [], isLoading: historyLoading } = useEmployeeHistory(employeeId);
  const { data: stats, isLoading: statsLoading } = useEmployeeHistoryStats(employeeId);

  const getMovementIcon = (codigo: string) => {
    switch (codigo) {
      case 'ADMISSAO':
        return <User className="h-4 w-4" />;
      case 'PROMOCAO':
        return <Briefcase className="h-4 w-4" />;
      case 'MUDANCA_FUNCAO':
        return <Briefcase className="h-4 w-4" />;
      case 'MUDANCA_CC':
        return <Building className="h-4 w-4" />;
      case 'MUDANCA_PROJETO':
        return <MapPin className="h-4 w-4" />;
      case 'MUDANCA_DEPARTAMENTO':
        return <Building className="h-4 w-4" />;
      case 'MUDANCA_SALARIO':
        return <DollarSign className="h-4 w-4" />;
      case 'MUDANCA_TURNO':
        return <Clock className="h-4 w-4" />;
      case 'FERIAS':
        return <Calendar className="h-4 w-4" />;
      case 'LICENCA':
        return <Calendar className="h-4 w-4" />;
      case 'DEMISSAO':
        return <User className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getMovementBadgeVariant = (codigo: string) => {
    switch (codigo) {
      case 'ADMISSAO':
        return 'default';
      case 'PROMOCAO':
        return 'default';
      case 'REBAIXAMENTO':
        return 'destructive';
      case 'MUDANCA_SALARIO':
        return 'secondary';
      case 'FERIAS':
        return 'outline';
      case 'LICENCA':
        return 'outline';
      case 'DEMISSAO':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (historyLoading || statsLoading) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">Carregando histórico...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Estatísticas */}
      {stats && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Estatísticas do Histórico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.totalMovements}</div>
                <div className="text-sm text-muted-foreground">Total de Movimentações</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.lastMovementDate ? format(new Date(stats.lastMovementDate), 'dd/MM/yyyy', { locale: ptBR }) : '--'}
                </div>
                <div className="text-sm text-muted-foreground">Última Movimentação</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.averageDaysBetweenMovements ? `${stats.averageDaysBetweenMovements} dias` : '--'}
                </div>
                <div className="text-sm text-muted-foreground">Média entre Movimentações</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.movementsByType.length}</div>
                <div className="text-sm text-muted-foreground">Tipos de Movimentação</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cabeçalho com botão de adicionar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Histórico de Movimentações - {employeeName}
            </CardTitle>
            <Button onClick={() => setShowAddEntry(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Movimentação
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma movimentação registrada</h3>
              <p className="text-muted-foreground mb-4">
                Este funcionário ainda não possui movimentações registradas no sistema.
              </p>
              <Button onClick={() => setShowAddEntry(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Primeira Movimentação
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <Card 
                  key={entry.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {getMovementIcon(entry.movement_type_codigo)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{entry.movement_type_nome}</h4>
                            <Badge variant={getMovementBadgeVariant(entry.movement_type_codigo)}>
                              {entry.movement_type_codigo}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {entry.description || 'Movimentação registrada no sistema'}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(entry.effective_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                            {entry.created_by_name && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {entry.created_by_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {entry.attachment_url && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para visualizar detalhes */}
      {selectedEntry && (
        <EmployeeHistoryEntry
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}

      {/* Modal para adicionar movimentação */}
      <EmployeeHistoryAddModal
        isOpen={showAddEntry}
        onClose={() => setShowAddEntry(false)}
        employeeId={employeeId}
        companyId={companyId}
      />
    </div>
  );
}
