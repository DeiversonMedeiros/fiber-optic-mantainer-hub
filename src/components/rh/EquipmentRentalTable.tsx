import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  DollarSign,
  Car,
  Laptop,
  Smartphone,
  Package,
  Search,
  Filter,
  Plus
} from 'lucide-react';
import { EquipmentRentalWithEmployee, EquipmentRentalFilters } from '@/integrations/supabase/rh-equipment-rental-types';
// Função local para formatação de moeda
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

interface EquipmentRentalTableProps {
  equipments: EquipmentRentalWithEmployee[];
  loading?: boolean;
  onView?: (equipment: EquipmentRentalWithEmployee) => void;
  onEdit?: (equipment: EquipmentRentalWithEmployee) => void;
  onDelete?: (equipment: EquipmentRentalWithEmployee) => void;
  onViewPayments?: (equipment: EquipmentRentalWithEmployee) => void;
  onAdd?: () => void;
  onFilter?: (filters: EquipmentRentalFilters) => void;
}

const equipmentTypeIcons = {
  vehicle: Car,
  computer: Laptop,
  phone: Smartphone,
  other: Package
};

const equipmentTypeLabels = {
  vehicle: 'Veículo',
  computer: 'Computador',
  phone: 'Celular',
  other: 'Outros'
};

const statusLabels = {
  active: 'Ativo',
  inactive: 'Inativo',
  terminated: 'Encerrado'
};

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-yellow-100 text-yellow-800',
  terminated: 'bg-red-100 text-red-800'
};

export function EquipmentRentalTable({
  equipments,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onViewPayments,
  onAdd,
  onFilter
}: EquipmentRentalTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const handleFilter = () => {
    if (onFilter) {
      onFilter({
        equipment_type: typeFilter === 'all' ? undefined : (typeFilter as any),
        status: statusFilter === 'all' ? undefined : (statusFilter as any)
      });
    }
  };

  const filteredEquipments = equipments.filter(equipment => {
    const matchesSearch = 
      equipment.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.model?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !typeFilter || typeFilter === 'all' || equipment.equipment_type === typeFilter;
    const matchesStatus = !statusFilter || statusFilter === 'all' || equipment.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getEquipmentIcon = (type: keyof typeof equipmentTypeIcons) => {
    const IconComponent = equipmentTypeIcons[type];
    return <IconComponent className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Equipamentos Locados
          </CardTitle>
          <Button onClick={onAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Equipamento
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por equipamento, funcionário, marca ou modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Tipo de equipamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="vehicle">Veículo</SelectItem>
              <SelectItem value="computer">Computador</SelectItem>
              <SelectItem value="phone">Celular</SelectItem>
              <SelectItem value="other">Outros</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="terminated">Encerrado</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleFilter} variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
        </div>

        {/* Tabela */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipamento</TableHead>
                <TableHead>Funcionário</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor Mensal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Período</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum equipamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredEquipments.map((equipment) => (
                  <TableRow key={equipment.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getEquipmentIcon(equipment.equipment_type)}
                        <div>
                          <div className="font-medium">{equipment.equipment_name}</div>
                          {equipment.brand && equipment.model && (
                            <div className="text-sm text-muted-foreground">
                              {equipment.brand} {equipment.model}
                            </div>
                          )}
                          {equipment.license_plate && (
                            <div className="text-sm text-muted-foreground">
                              Placa: {equipment.license_plate}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{equipment.employee.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {equipment.employee.cpf}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {equipmentTypeLabels[equipment.equipment_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatCurrency(equipment.monthly_value)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[equipment.status]}>
                        {statusLabels[equipment.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Início: {new Date(equipment.start_date).toLocaleDateString('pt-BR')}</div>
                        {equipment.end_date && (
                          <div>Fim: {new Date(equipment.end_date).toLocaleDateString('pt-BR')}</div>
                        )}
                      </div>
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
                          <DropdownMenuSeparator />
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(equipment)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                          )}
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(equipment)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          {onViewPayments && (
                            <DropdownMenuItem onClick={() => onViewPayments(equipment)}>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Pagamentos
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem 
                              onClick={() => onDelete(equipment)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Resumo */}
        {filteredEquipments.length > 0 && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Total de equipamentos:</span> {filteredEquipments.length}
              </div>
              <div>
                <span className="font-medium">Valor total mensal:</span>{' '}
                {formatCurrency(
                  filteredEquipments
                    .filter(e => e.status === 'active')
                    .reduce((sum, e) => sum + e.monthly_value, 0)
                )}
              </div>
              <div>
                <span className="font-medium">Equipamentos ativos:</span>{' '}
                {filteredEquipments.filter(e => e.status === 'active').length}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
