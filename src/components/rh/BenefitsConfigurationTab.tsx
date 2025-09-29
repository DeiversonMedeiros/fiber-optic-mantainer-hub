// @ts-nocheck
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Filter
} from 'lucide-react';
import { useBenefitConfigurations } from '@/hooks/rh/useUnifiedBenefits';
import { BenefitConfiguration, BenefitType, BENEFIT_TYPE_LABELS } from '@/integrations/supabase/rh-benefits-unified-types';
import { BenefitConfigurationForm } from './BenefitConfigurationForm';
import { FormModal } from './FormModal';

interface BenefitsConfigurationTabProps {
  companyId: string;
}

export function BenefitsConfigurationTab({ companyId }: BenefitsConfigurationTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBenefitType, setSelectedBenefitType] = useState<BenefitType | 'all'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<BenefitConfiguration | null>(null);
  const [viewingConfig, setViewingConfig] = useState<BenefitConfiguration | null>(null);

  const { 
    configurations, 
    isLoading, 
    deleteConfiguration 
  } = useBenefitConfigurations(companyId);

  // Filtrar configurações
  const filteredConfigurations = configurations?.filter(config => {
    const matchesSearch = config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         config.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedBenefitType === 'all' || config.benefit_type === selectedBenefitType;
    return matchesSearch && matchesType;
  }) || [];

  const handleEdit = (config: BenefitConfiguration) => {
    setEditingConfig(config);
    setIsFormOpen(true);
  };

  const handleView = (config: BenefitConfiguration) => {
    setViewingConfig(config);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta configuração?')) {
      await deleteConfiguration.mutateAsync(id);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingConfig(null);
    setViewingConfig(null);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Carregando configurações...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configurações de Benefícios</CardTitle>
              <CardDescription>
                Gerencie as configurações de todos os tipos de benefícios
              </CardDescription>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Configuração
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar configurações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  {selectedBenefitType === 'all' ? 'Todos os Tipos' : BENEFIT_TYPE_LABELS[selectedBenefitType]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Tipo de Benefício</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedBenefitType('all')}>
                  Todos os Tipos
                </DropdownMenuItem>
                {Object.entries(BENEFIT_TYPE_LABELS).map(([type, label]) => (
                  <DropdownMenuItem 
                    key={type} 
                    onClick={() => setSelectedBenefitType(type as BenefitType)}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Tabela */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cálculo</TableHead>
                  <TableHead>Valor Base</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado</TableHead>
                  <TableHead className="w-[70px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConfigurations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm || selectedBenefitType !== 'all' 
                          ? 'Nenhuma configuração encontrada com os filtros aplicados.'
                          : 'Nenhuma configuração cadastrada.'
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredConfigurations.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{config.name}</div>
                          {config.description && (
                            <div className="text-sm text-muted-foreground">
                              {config.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {BENEFIT_TYPE_LABELS[config.benefit_type as BenefitType]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {config.calculation_type === 'fixed_value' && 'Valor Fixo'}
                        {config.calculation_type === 'daily_value' && 'Valor por Dia'}
                        {config.calculation_type === 'percentage' && 'Percentual'}
                        {config.calculation_type === 'production_based' && 'Por Produção'}
                        {config.calculation_type === 'goal_based' && 'Por Meta'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {config.base_value && (
                          <span>R$ {config.base_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        )}
                        {config.percentage_value && (
                          <span>{config.percentage_value}%</span>
                        )}
                        {!config.base_value && !config.percentage_value && (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(config.is_active)}>
                          {config.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(config.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleView(config)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(config)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(config.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Formulário */}
      <FormModal
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        title={editingConfig ? 'Editar Configuração' : 'Nova Configuração'}
        description={
          editingConfig 
            ? 'Edite as informações da configuração de benefício'
            : 'Crie uma nova configuração de benefício'
        }
      >
        <BenefitConfigurationForm
          companyId={companyId}
          config={editingConfig}
          onSuccess={handleCloseForm}
          onCancel={handleCloseForm}
        />
      </FormModal>

      {/* Modal de Visualização */}
      <FormModal
        open={!!viewingConfig}
        onOpenChange={() => setViewingConfig(null)}
        title="Visualizar Configuração"
        description="Detalhes da configuração de benefício"
      >
        {viewingConfig && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <div className="text-sm text-muted-foreground">{viewingConfig.name}</div>
              </div>
              <div>
                <label className="text-sm font-medium">Tipo</label>
                <div className="text-sm text-muted-foreground">
                  <Badge variant="outline">
                    {BENEFIT_TYPE_LABELS[viewingConfig.benefit_type as BenefitType]}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Tipo de Cálculo</label>
                <div className="text-sm text-muted-foreground">
                  {viewingConfig.calculation_type === 'fixed_value' && 'Valor Fixo'}
                  {viewingConfig.calculation_type === 'daily_value' && 'Valor por Dia'}
                  {viewingConfig.calculation_type === 'percentage' && 'Percentual'}
                  {viewingConfig.calculation_type === 'production_based' && 'Por Produção'}
                  {viewingConfig.calculation_type === 'goal_based' && 'Por Meta'}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <div className="text-sm text-muted-foreground">
                  <Badge className={getStatusColor(viewingConfig.is_active)}>
                    {viewingConfig.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
              {viewingConfig.base_value && (
                <div>
                  <label className="text-sm font-medium">Valor Base</label>
                  <div className="text-sm text-muted-foreground">
                    R$ {viewingConfig.base_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              )}
              {viewingConfig.percentage_value && (
                <div>
                  <label className="text-sm font-medium">Percentual</label>
                  <div className="text-sm text-muted-foreground">
                    {viewingConfig.percentage_value}%
                  </div>
                </div>
              )}
              {viewingConfig.description && (
                <div className="col-span-2">
                  <label className="text-sm font-medium">Descrição</label>
                  <div className="text-sm text-muted-foreground">{viewingConfig.description}</div>
                </div>
              )}
              
              {/* Seção de Descontos */}
              <div className="col-span-2">
                <label className="text-sm font-medium">Configurações de Desconto</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${viewingConfig.apply_absence_discount ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm">Ausência</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${viewingConfig.apply_holiday_discount ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm">Feriados</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${viewingConfig.apply_vacation_discount ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm">Férias</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${viewingConfig.apply_sick_leave_discount ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm">Licença Médica</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${viewingConfig.apply_suspension_discount ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm">Suspensão</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </FormModal>
    </div>
  );
}
