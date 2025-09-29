import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Briefcase, 
  Users, 
  Calendar, 
  Search, 
  Filter, 
  Eye, 
  Pause, 
  Play,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JobOpening {
  id: string;
  position_name: string;
  department_name: string;
  status: string;
  open_date: string;
  close_date?: string;
  applications_count: number;
  created_by_name: string;
}

interface JobOpeningsTabProps {
  companyId: string;
}

const JobOpeningsTab: React.FC<JobOpeningsTabProps> = ({ companyId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'aberta' | 'pausada' | 'fechada' | 'preenchida'>('all');
  
  const { toast } = useToast();

  // Mock data - substituir por dados reais do banco
  const mockOpenings: JobOpening[] = [
    {
      id: '1',
      position_name: 'Desenvolvedor Frontend',
      department_name: 'Tecnologia',
      status: 'aberta',
      open_date: '2024-01-15',
      close_date: '2024-02-15',
      applications_count: 15,
      created_by_name: 'João Silva'
    },
    {
      id: '2',
      position_name: 'Analista de RH',
      department_name: 'Recursos Humanos',
      status: 'pausada',
      open_date: '2024-01-10',
      applications_count: 8,
      created_by_name: 'Maria Santos'
    },
    {
      id: '3',
      position_name: 'Gerente de Projetos',
      department_name: 'Operações',
      status: 'fechada',
      open_date: '2024-01-05',
      close_date: '2024-01-25',
      applications_count: 22,
      created_by_name: 'Pedro Costa'
    }
  ];

  const filteredOpenings = mockOpenings.filter(opening => {
    const matchesSearch = opening.position_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opening.department_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || opening.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aberta':
        return <Badge className="bg-green-100 text-green-800">Aberta</Badge>;
      case 'pausada':
        return <Badge className="bg-yellow-100 text-yellow-800">Pausada</Badge>;
      case 'fechada':
        return <Badge className="bg-gray-100 text-gray-800">Fechada</Badge>;
      case 'preenchida':
        return <Badge className="bg-blue-100 text-blue-800">Preenchida</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Desconhecido</Badge>;
    }
  };

  const handleStatusChange = (openingId: string, newStatus: string) => {
    toast({
      title: "Status Atualizado",
      description: `Vaga ${newStatus} com sucesso`,
      variant: "default"
    });
  };

  const handleViewApplications = (openingId: string) => {
    toast({
      title: "Visualizando Candidatos",
      description: "Redirecionando para lista de candidatos",
      variant: "default"
    });
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por cargo ou departamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="aberta">Abertas</SelectItem>
                  <SelectItem value="pausada">Pausadas</SelectItem>
                  <SelectItem value="fechada">Fechadas</SelectItem>
                  <SelectItem value="preenchida">Preenchidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Vagas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Vagas Abertas ({filteredOpenings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOpenings.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma vaga encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOpenings.map((opening) => (
                <Card key={opening.id} className="border-l-4 border-l-green-400">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{opening.position_name}</h3>
                          {getStatusBadge(opening.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            <span>Departamento: {opening.department_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>Candidatos: {opening.applications_count}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Aberta em: {new Date(opening.open_date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          {opening.close_date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Fecha em: {new Date(opening.close_date).toLocaleDateString('pt-BR')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewApplications(opening.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Candidatos
                        </Button>
                        {opening.status === 'aberta' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(opening.id, 'pausada')}
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Pausar
                          </Button>
                        ) : opening.status === 'pausada' ? (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(opening.id, 'aberta')}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Reativar
                          </Button>
                        ) : null}
                        {opening.status === 'aberta' || opening.status === 'pausada' ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusChange(opening.id, 'fechada')}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Fechar
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JobOpeningsTab;
