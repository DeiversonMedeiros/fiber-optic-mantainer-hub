import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Stethoscope, 
  Calendar, 
  ArrowLeft,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  FileText,
  Eye,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AcompanhamentoExames: React.FC = () => {
  const navigate = useNavigate();
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [examType, setExamType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Dados mockados - serão substituídos por dados reais
  const employees = [
    {
      id: '1',
      name: 'João Silva',
      position: 'Desenvolvedor',
      department: 'TI',
      lastExam: '2024-01-15',
      nextExam: '2024-07-15',
      status: 'up_to_date'
    },
    {
      id: '2',
      name: 'Maria Santos',
      position: 'Analista',
      department: 'RH',
      lastExam: '2023-12-10',
      nextExam: '2024-06-10',
      status: 'up_to_date'
    },
    {
      id: '3',
      name: 'Pedro Costa',
      position: 'Técnico',
      department: 'Produção',
      lastExam: '2023-08-20',
      nextExam: '2024-02-20',
      status: 'overdue'
    }
  ];

  const exams = [
    {
      id: 1,
      employeeId: '1',
      employeeName: 'João Silva',
      type: 'Periódico',
      scheduledDate: '2024-07-15',
      completedDate: null,
      status: 'scheduled',
      result: null,
      attachmentUrl: null
    },
    {
      id: 2,
      employeeId: '2',
      employeeName: 'Maria Santos',
      type: 'Admissional',
      scheduledDate: '2024-06-10',
      completedDate: null,
      status: 'scheduled',
      result: null,
      attachmentUrl: null
    },
    {
      id: 3,
      employeeId: '3',
      employeeName: 'Pedro Costa',
      type: 'Periódico',
      scheduledDate: '2024-02-20',
      completedDate: null,
      status: 'overdue',
      result: null,
      attachmentUrl: null
    },
    {
      id: 4,
      employeeId: '1',
      employeeName: 'João Silva',
      type: 'Periódico',
      scheduledDate: '2024-01-15',
      completedDate: '2024-01-15',
      status: 'completed',
      result: 'Apto',
      attachmentUrl: '/exams/exam_001.pdf'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'completed': return 'Realizado';
      case 'overdue': return 'Vencido';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconhecido';
    }
  };

  const getEmployeeStatusColor = (status: string) => {
    switch (status) {
      case 'up_to_date': return 'text-green-600';
      case 'overdue': return 'text-red-600';
      case 'due_soon': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getEmployeeStatusLabel = (status: string) => {
    switch (status) {
      case 'up_to_date': return 'Em dia';
      case 'overdue': return 'Vencido';
      case 'due_soon': return 'Vencendo em breve';
      default: return 'Desconhecido';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getDaysUntilDue = (dateString: string) => {
    const today = new Date();
    const dueDate = new Date(dateString);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredExams = exams.filter(exam => {
    const matchesEmployee = selectedEmployee === "all" || selectedEmployee === "" || exam.employeeId === selectedEmployee;
    const matchesType = examType === "all" || examType === "" || exam.type.toLowerCase() === examType.toLowerCase();
    return matchesEmployee && matchesType;
  });

  const overdueExams = exams.filter(exam => exam.status === 'overdue').length;
  const scheduledExams = exams.filter(exam => exam.status === 'scheduled').length;
  const completedExams = exams.filter(exam => exam.status === 'completed').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/portal-gestor')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Acompanhamento de Exames</h1>
            <p className="text-muted-foreground">
              Monitore os exames médicos e de saúde ocupacional da sua equipe
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar funcionário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Funcionário específico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os funcionários</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de exame" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="admissional">Admissional</SelectItem>
                <SelectItem value="periódico">Periódico</SelectItem>
                <SelectItem value="demissional">Demissional</SelectItem>
                <SelectItem value="mudança de função">Mudança de Função</SelectItem>
                <SelectItem value="retorno ao trabalho">Retorno ao Trabalho</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              Aplicar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Exames</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exams.length}</div>
            <p className="text-xs text-muted-foreground">
              Todos os exames
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{scheduledExams}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando realização
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Realizados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedExams}</div>
            <p className="text-xs text-muted-foreground">
              Completos este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueExams}</div>
            <p className="text-xs text-muted-foreground">
              Necessitam atenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status dos Funcionários */}
      <Card>
        <CardHeader>
          <CardTitle>Status dos Funcionários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEmployees.map((employee) => {
              const daysUntilNext = getDaysUntilDue(employee.nextExam);
              return (
                <div key={employee.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-medium">{employee.name}</h3>
                        <p className="text-sm text-muted-foreground">{employee.position} • {employee.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Último Exame</p>
                        <p className="font-bold">{formatDate(employee.lastExam)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Próximo Exame</p>
                        <p className="font-bold">{formatDate(employee.nextExam)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className={`font-bold ${getEmployeeStatusColor(employee.status)}`}>
                          {getEmployeeStatusLabel(employee.status)}
                        </p>
                      </div>
                      {daysUntilNext <= 30 && daysUntilNext > 0 && (
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Dias Restantes</p>
                          <p className="font-bold text-yellow-600">{daysUntilNext}</p>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedEmployee(employee.id)}
                      >
                        Ver Exames
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Exames */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Exames</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Funcionário</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Data Agendada</th>
                  <th className="text-left p-2">Data Realizada</th>
                  <th className="text-left p-2">Resultado</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredExams.map((exam) => (
                  <tr key={exam.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{exam.employeeName}</td>
                    <td className="p-2">{exam.type}</td>
                    <td className="p-2">{formatDate(exam.scheduledDate)}</td>
                    <td className="p-2">{exam.completedDate ? formatDate(exam.completedDate) : '--'}</td>
                    <td className="p-2">{exam.result || '--'}</td>
                    <td className="p-2">
                      <Badge className={getStatusColor(exam.status)}>
                        {getStatusLabel(exam.status)}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        {exam.attachmentUrl && (
                          <>
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3 mr-1" />
                              Ver
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-3 w-3 mr-1" />
                              Baixar
                            </Button>
                          </>
                        )}
                        {exam.status === 'scheduled' && (
                          <Button size="sm" variant="outline">
                            Reagendar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Alertas e Observações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {overdueExams > 0 && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span>{overdueExams} funcionário(s) com exames vencidos - ação necessária</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <CheckCircle className="h-4 w-4" />
              <span>{scheduledExams} exame(s) agendado(s) para este mês</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>{completedExams} exame(s) realizado(s) com sucesso</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcompanhamentoExames;
