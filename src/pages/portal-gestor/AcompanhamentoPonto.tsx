import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  Calendar, 
  Users, 
  ArrowLeft,
  Search,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AcompanhamentoPonto: React.FC = () => {
  const navigate = useNavigate();
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Dados mockados - serão substituídos por dados reais
  const employees = [
    {
      id: '1',
      name: 'João Silva',
      position: 'Desenvolvedor',
      department: 'TI',
      totalHours: 176,
      expectedHours: 176,
      overtime: 8,
      missingHours: 0,
      attendanceRate: 100
    },
    {
      id: '2',
      name: 'Maria Santos',
      position: 'Analista',
      department: 'RH',
      totalHours: 168,
      expectedHours: 176,
      overtime: 0,
      missingHours: 8,
      attendanceRate: 95
    },
    {
      id: '3',
      name: 'Pedro Costa',
      position: 'Gerente',
      department: 'Operações',
      totalHours: 184,
      expectedHours: 176,
      overtime: 8,
      missingHours: 0,
      attendanceRate: 100
    }
  ];

  const timeRecords = [
    {
      id: 1,
      employeeId: '1',
      date: '2024-03-15',
      clockIn: '08:00',
      clockOut: '17:00',
      breakStart: '12:00',
      breakEnd: '13:00',
      totalHours: 8,
      status: 'normal'
    },
    {
      id: 2,
      employeeId: '1',
      date: '2024-03-14',
      clockIn: '08:15',
      clockOut: '17:30',
      breakStart: '12:00',
      breakEnd: '13:00',
      totalHours: 8.25,
      status: 'late'
    },
    {
      id: 3,
      employeeId: '2',
      date: '2024-03-15',
      clockIn: '09:00',
      clockOut: '18:00',
      breakStart: '12:00',
      breakEnd: '13:00',
      totalHours: 8,
      status: 'late'
    },
    {
      id: 4,
      employeeId: '2',
      date: '2024-03-14',
      clockIn: null,
      clockOut: null,
      breakStart: null,
      breakEnd: null,
      totalHours: 0,
      status: 'absent'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-100 text-green-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'overtime': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'normal': return 'Normal';
      case 'late': return 'Atraso';
      case 'absent': return 'Falta';
      case 'overtime': return 'Hora Extra';
      default: return 'Desconhecido';
    }
  };

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString: string | null) => {
    return timeString || '--:--';
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRecords = timeRecords.filter(record => 
    selectedEmployee === "all" || selectedEmployee === "" || record.employeeId === selectedEmployee
  );

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
            <h1 className="text-3xl font-bold mb-2">Acompanhamento de Registros de Ponto</h1>
            <p className="text-muted-foreground">
              Monitore os registros de ponto e frequência da sua equipe
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
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Março 2024</SelectItem>
                <SelectItem value="2">Fevereiro 2024</SelectItem>
                <SelectItem value="1">Janeiro 2024</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Aplicar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo da Equipe */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">
              Equipe ativa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Frequência</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(employees.reduce((sum, emp) => sum + emp.attendanceRate, 0) / employees.length).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Taxa de presença
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Extras</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {employees.reduce((sum, emp) => sum + emp.overtime, 0)}h
            </div>
            <p className="text-xs text-muted-foreground">
              Total do mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faltas</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {employees.reduce((sum, emp) => sum + emp.missingHours, 0)}h
            </div>
            <p className="text-xs text-muted-foreground">
              Horas não trabalhadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Funcionários */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo por Funcionário</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEmployees.map((employee) => (
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
                      <p className="text-sm text-muted-foreground">Frequência</p>
                      <p className={`font-bold ${getAttendanceRateColor(employee.attendanceRate)}`}>
                        {employee.attendanceRate}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Horas Trabalhadas</p>
                      <p className="font-bold">{employee.totalHours}h</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Horas Extras</p>
                      <p className="font-bold text-blue-600">{employee.overtime}h</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Faltas</p>
                      <p className="font-bold text-red-600">{employee.missingHours}h</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEmployee(employee.id)}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Registros de Ponto */}
      {selectedEmployee && (
        <Card>
          <CardHeader>
            <CardTitle>Registros de Ponto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Data</th>
                    <th className="text-left p-2">Entrada</th>
                    <th className="text-left p-2">Saída</th>
                    <th className="text-left p-2">Intervalo</th>
                    <th className="text-left p-2">Total</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{formatDate(record.date)}</td>
                      <td className="p-2">{formatTime(record.clockIn)}</td>
                      <td className="p-2">{formatTime(record.clockOut)}</td>
                      <td className="p-2">
                        {record.breakStart && record.breakEnd 
                          ? `${record.breakStart} - ${record.breakEnd}`
                          : '--'
                        }
                      </td>
                      <td className="p-2 font-medium">{record.totalHours}h</td>
                      <td className="p-2">
                        <Badge className={getStatusColor(record.status)}>
                          {getStatusLabel(record.status)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

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
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              <span>Maria Santos tem 95% de frequência - abaixo da meta de 98%</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <CheckCircle className="h-4 w-4" />
              <span>João Silva e Pedro Costa com horas extras registradas</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span>Maria Santos com falta registrada em 14/03/2024</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcompanhamentoPonto;
