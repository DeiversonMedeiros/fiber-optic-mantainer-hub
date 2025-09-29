import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Building, Briefcase, DollarSign, Clock, MapPin, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EmployeeHistoryWithDetails } from '@/integrations/supabase/rh-history-types';

interface EmployeeHistoryEntryProps {
  entry: EmployeeHistoryWithDetails;
  onClose: () => void;
}

export function EmployeeHistoryEntry({ entry, onClose }: EmployeeHistoryEntryProps) {
  const getMovementIcon = (codigo: string) => {
    switch (codigo) {
      case 'ADMISSAO':
        return <User className="h-5 w-5" />;
      case 'PROMOCAO':
        return <Briefcase className="h-5 w-5" />;
      case 'MUDANCA_FUNCAO':
        return <Briefcase className="h-5 w-5" />;
      case 'MUDANCA_CC':
        return <Building className="h-5 w-5" />;
      case 'MUDANCA_PROJETO':
        return <MapPin className="h-5 w-5" />;
      case 'MUDANCA_DEPARTAMENTO':
        return <Building className="h-5 w-5" />;
      case 'MUDANCA_SALARIO':
        return <DollarSign className="h-5 w-5" />;
      case 'MUDANCA_TURNO':
        return <Clock className="h-5 w-5" />;
      case 'FERIAS':
        return <Calendar className="h-5 w-5" />;
      case 'LICENCA':
        return <Calendar className="h-5 w-5" />;
      case 'DEMISSAO':
        return <User className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
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

  const formatCurrency = (value: number | null) => {
    if (!value) return '--';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const hasChanges = (field: string) => {
    return entry.previous_data[field as keyof typeof entry.previous_data] !== 
           entry.new_data[field as keyof typeof entry.new_data];
  };

  const renderFieldChange = (label: string, field: string, icon: React.ReactNode, formatter?: (value: any) => string) => {
    if (!hasChanges(field)) return null;

    const previousValue = entry.previous_data[field as keyof typeof entry.previous_data];
    const newValue = entry.new_data[field as keyof typeof entry.new_data];

    return (
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{label}:</span>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">
            {formatter ? formatter(previousValue) : previousValue || '--'}
          </div>
          <div className="text-sm font-medium">
            {formatter ? formatter(newValue) : newValue || '--'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getMovementIcon(entry.movement_type_codigo)}
            {entry.movement_type_nome}
            <Badge variant={getMovementBadgeVariant(entry.movement_type_codigo)}>
              {entry.movement_type_codigo}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações básicas */}
          <div className="space-y-3">
            <h3 className="font-medium text-lg">Informações da Movimentação</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>Data de Efetivação:</strong>{' '}
                  {format(new Date(entry.effective_date), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
              
              {entry.created_by_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Registrado por:</strong> {entry.created_by_name}
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>Data do Registro:</strong>{' '}
                  {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </span>
              </div>
            </div>

            {entry.reason && (
              <div>
                <strong className="text-sm">Motivo:</strong>
                <p className="text-sm text-muted-foreground mt-1">{entry.reason}</p>
              </div>
            )}

            {entry.description && (
              <div>
                <strong className="text-sm">Descrição:</strong>
                <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
              </div>
            )}
          </div>

          {/* Mudanças realizadas */}
          <div className="space-y-3">
            <h3 className="font-medium text-lg">Mudanças Realizadas</h3>
            
            <div className="space-y-2">
              {renderFieldChange('Salário Base', 'salario_base', <DollarSign className="h-4 w-4" />, formatCurrency)}
              {renderFieldChange('Status', 'status', <User className="h-4 w-4" />)}
              {renderFieldChange('Cargo', 'position_id', <Briefcase className="h-4 w-4" />)}
              {renderFieldChange('Centro de Custo', 'cost_center_id', <Building className="h-4 w-4" />)}
              {renderFieldChange('Projeto', 'project_id', <MapPin className="h-4 w-4" />)}
              {renderFieldChange('Departamento', 'department_id', <Building className="h-4 w-4" />)}
              {renderFieldChange('Turno', 'work_shift_id', <Clock className="h-4 w-4" />)}
              {renderFieldChange('Gestor', 'manager_id', <User className="h-4 w-4" />)}
            </div>

            {!Object.keys(entry.previous_data).some(field => hasChanges(field)) && (
              <div className="text-center py-4 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <p>Nenhuma mudança específica registrada para este tipo de movimentação.</p>
              </div>
            )}
          </div>

          {/* Anexo */}
          {entry.attachment_url && (
            <div className="space-y-3">
              <h3 className="font-medium text-lg">Documento Anexo</h3>
              <Button 
                variant="outline" 
                onClick={() => window.open(entry.attachment_url!, '_blank')}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Documento
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
