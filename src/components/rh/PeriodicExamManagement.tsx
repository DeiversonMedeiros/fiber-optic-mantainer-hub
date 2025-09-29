import React, { useState, useEffect } from 'react';
import { usePeriodicExams } from '@/hooks/rh/usePeriodicExams';
import { usePeriodicExamScheduling } from '@/hooks/rh/usePeriodicExamScheduling';
import { useExamNotifications } from '@/hooks/rh/useExamNotifications';
import { useSimpleFileUpload } from '@/hooks/useSimpleFileUpload';
import { useCompany } from '@/hooks/useCompany';
import { periodicExamValidationSchema, periodicExamBusinessRules } from '@/lib/validations/rh-validations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SimpleFileUpload } from '@/components/ui/simple-file-upload';
import { Plus, Stethoscope, CheckCircle, XCircle, AlertCircle, Calendar, Users, Activity, Bell, Clock, Upload, FileText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface PeriodicExamFormData {
  employee_id: string;
  tipo_exame: string;
  data_exame: string;
  data_agendamento?: string;
  resultado?: string;
  medico_responsavel?: string;
  observacoes?: string;
  arquivo_anexo?: string;
}

export function PeriodicExamManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('exams');
  const [formData, setFormData] = useState<PeriodicExamFormData>({
    employee_id: '',
    tipo_exame: '',
    data_exame: '',
    data_agendamento: '',
    resultado: '',
    medico_responsavel: '',
    observacoes: '',
    arquivo_anexo: ''
  });

  const { company } = useCompany();
  const {
    periodicExams,
    isLoading,
    error,
    createPeriodicExam,
    updatePeriodicExam,
    deletePeriodicExam,
    getPeriodicExamsByType,
    getPeriodicExamsByStatus
  } = usePeriodicExams(company?.id);

  // Novos hooks para funcionalidades avançadas
  const { scheduleAutomaticExams, scheduleNextAnnualExam } = usePeriodicExamScheduling();
  const { 
    getExamsNeedingNotification, 
    getOverdueExams, 
    getNotificationStats,
    sendNotification,
    rescheduleOverdueExam
  } = useExamNotifications();

  // Hook para upload de arquivos
  const fileUpload = useSimpleFileUpload({
    bucket: 'exam-results',
    folder: 'periodic-exams',
    maxSize: 10,
    allowedTypes: ['application/pdf']
  });

  // Carregar dados de notificações quando o componente monta
  useEffect(() => {
    if (company?.id) {
      getExamsNeedingNotification.refetch();
      getOverdueExams.refetch();
      getNotificationStats.refetch();
    }
  }, [company?.id]);

  const resetForm = () => {
    setFormData({
      employee_id: '',
      tipo_exame: '',
      data_exame: '',
      data_agendamento: '',
      resultado: '',
      medico_responsavel: '',
      observacoes: '',
      arquivo_anexo: ''
    });
    setSelectedExam(null);
    fileUpload.reset();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!company?.id) {
      toast.error('Empresa não identificada');
      return;
    }

    // Se há um arquivo selecionado, fazer upload primeiro
    let uploadedFileUrl = formData.arquivo_anexo;
    if (fileUpload.uploadState.file && !fileUpload.uploadState.uploadedUrl) {
      const url = await fileUpload.uploadFile(fileUpload.uploadState.file);
      if (!url) {
        toast.error('Erro ao fazer upload do arquivo');
        return;
      }
      uploadedFileUrl = url;
    }

    const examData = {
      company_id: company.id,
      employee_id: formData.employee_id,
      tipo_exame: formData.tipo_exame,
      data_agendada: formData.data_exame,
      data_realizacao: formData.resultado ? formData.data_exame : null,
      resultado: formData.resultado || null,
      arquivo_anexo: uploadedFileUrl || null,
      status: formData.resultado ? 'realizado' : 'agendado'
    };

    // Validar dados usando schema
    try {
      periodicExamValidationSchema.parse(examData);
    } catch (error: any) {
      const firstError = error.errors?.[0];
      toast.error(firstError?.message || 'Dados inválidos');
      return;
    }

    // Validar se resultado requer ação específica
    if (formData.resultado && periodicExamBusinessRules.requiresAction(formData.resultado)) {
      if (!formData.observacoes) {
        toast.error('Observações são obrigatórias para resultados que requerem ação específica');
        return;
      }
    }

    // Validar se médico é obrigatório para exames realizados
    if (formData.resultado && !formData.medico_responsavel) {
      toast.error('Médico responsável é obrigatório para exames realizados');
      return;
    }

    if (selectedExam) {
      updatePeriodicExam.mutate({
        id: selectedExam.id,
        ...examData
      });
    } else {
      createPeriodicExam.mutate(examData);
    }
  };

  const handleEdit = (exam: any) => {
    setSelectedExam(exam);
    setFormData({
      employee_id: exam.employee_id,
      tipo_exame: exam.tipo_exame,
      data_exame: exam.data_agendada,
      data_agendamento: exam.data_agendada || '',
      resultado: exam.resultado || '',
      medico_responsavel: exam.medico_responsavel || '',
      observacoes: exam.observacoes || '',
      arquivo_anexo: exam.arquivo_anexo || ''
    });
    
    // Configurar estado do upload se há arquivo existente
    if (exam.arquivo_anexo) {
      fileUpload.setUploadState({
        file: null,
        isUploading: false,
        progress: 100,
        uploadedUrl: exam.arquivo_anexo,
        error: null
      });
    }
    
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este exame?')) {
      deletePeriodicExam.mutate(id);
    }
  };

  // Funções para agendamento automático
  const handleAutoSchedule = async () => {
    if (!company?.id) {
      toast.error('Empresa não identificada');
      return;
    }

    await scheduleAutomaticExams.mutateAsync({
      companyId: company.id,
      examTypes: ['periodico'],
      daysBeforeNotification: 30
    });
  };

  const handleScheduleNextAnnual = async (employeeId: string) => {
    if (!company?.id) {
      toast.error('Empresa não identificada');
      return;
    }

    await scheduleNextAnnualExam.mutateAsync({
      employeeId,
      companyId: company.id,
      examType: 'periodico',
      daysBeforeNotification: 30
    });
  };

  // Funções para notificações
  const handleSendNotification = async (notification: any) => {
    await sendNotification(notification, 'system');
  };

  const handleRescheduleOverdue = async (examId: string) => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 30);
    const newDateStr = newDate.toISOString().split('T')[0];
    
    await rescheduleOverdueExam.mutateAsync({
      examId,
      newDate: newDateStr,
      reason: 'Reagendamento automático - exame vencido'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'realizado':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Realizado
          </Badge>
        );
      case 'cancelado':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Calendar className="w-3 h-3 mr-1" />
            Agendado
          </Badge>
        );
    }
  };

  const getResultBadge = (resultado: string) => {
    if (!resultado) return <span className="text-gray-400">-</span>;
    
    switch (resultado.toLowerCase()) {
      case 'apto':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Apto
          </Badge>
        );
      case 'inapto':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Inapto
          </Badge>
        );
      case 'apto com restrições':
      case 'apto com restricoes':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Apto c/ Restrições
          </Badge>
        );
      default:
        return <span className="text-sm">{resultado}</span>;
    }
  };

  const calculateStats = () => {
    if (!periodicExams) return { total: 0, scheduled: 0, completed: 0, cancelled: 0 };
    
    return {
      total: periodicExams.length,
      scheduled: periodicExams.filter(e => e.status === 'agendado').length,
      completed: periodicExams.filter(e => e.status === 'realizado').length,
      cancelled: periodicExams.filter(e => e.status === 'cancelado').length
    };
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Stethoscope className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Carregando exames periódicos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>Erro ao carregar exames: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Exames Periódicos</h1>
          <p className="text-gray-600">Gerencie os exames periódicos dos funcionários</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleAutoSchedule}
            disabled={scheduleAutomaticExams.isPending}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${scheduleAutomaticExams.isPending ? 'animate-spin' : ''}`} />
            Agendar Automaticamente
          </Button>
          <Dialog open={isModalOpen} onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Exame
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedExam ? 'Editar Exame' : 'Novo Exame'} Periódico
                </DialogTitle>
                <DialogDescription>
                  {selectedExam 
                    ? 'Edite os dados do exame periódico.'
                    : 'Agende um novo exame periódico para um funcionário.'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
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
                    <Label htmlFor="tipo_exame">Tipo de Exame *</Label>
                    <Select value={formData.tipo_exame} onValueChange={(value) => setFormData({...formData, tipo_exame: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de exame" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admissional">Admissional</SelectItem>
                        <SelectItem value="periodico">Periódico</SelectItem>
                        <SelectItem value="retorno_ao_trabalho">Retorno ao Trabalho</SelectItem>
                        <SelectItem value="mudanca_de_funcao">Mudança de Função</SelectItem>
                        <SelectItem value="demissional">Demissional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="data_agendamento">Data Agendamento</Label>
                      <Input
                        id="data_agendamento"
                        type="date"
                        value={formData.data_agendamento}
                        onChange={(e) => setFormData({...formData, data_agendamento: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="data_exame">Data do Exame *</Label>
                      <Input
                        id="data_exame"
                        type="date"
                        value={formData.data_exame}
                        onChange={(e) => setFormData({...formData, data_exame: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="medico_responsavel">Médico Responsável</Label>
                    <Input
                      id="medico_responsavel"
                      value={formData.medico_responsavel}
                      onChange={(e) => setFormData({...formData, medico_responsavel: e.target.value})}
                      placeholder="Nome do médico responsável"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="resultado">Resultado</Label>
                    <Select value={formData.resultado} onValueChange={(value) => setFormData({...formData, resultado: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o resultado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apto">Apto</SelectItem>
                        <SelectItem value="inapto">Inapto</SelectItem>
                        <SelectItem value="apto com restrições">Apto com Restrições</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                      placeholder="Observações sobre o exame..."
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="arquivo_anexo">Resultado do Exame (PDF)</Label>
                    <SimpleFileUpload
                      onFileSelect={(file) => {
                        // Armazenar o arquivo para processamento no submit
                        setFormData({...formData, arquivo_anexo: file.name});
                      }}
                      onFileRemove={() => {
                        fileUpload.removeFile(formData.arquivo_anexo);
                        setFormData({...formData, arquivo_anexo: ''});
                      }}
                      selectedFile={fileUpload.uploadState.file}
                      uploadedUrl={fileUpload.uploadState.uploadedUrl}
                      isUploading={fileUpload.uploadState.isUploading}
                      uploadProgress={fileUpload.uploadState.progress}
                      error={fileUpload.uploadState.error}
                      disabled={createPeriodicExam.isPending || updatePeriodicExam.isPending}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createPeriodicExam.isPending || updatePeriodicExam.isPending || fileUpload.uploadState.isUploading}
                  >
                    {(createPeriodicExam.isPending || updatePeriodicExam.isPending || fileUpload.uploadState.isUploading) ? 'Salvando...' : 'Salvar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendados</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Realizados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notificações</CardTitle>
            <Bell className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {getNotificationStats.data?.totalNotifications || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {getNotificationStats.data?.overdueCount || 0} vencidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="exams">Exames</TabsTrigger>
          <TabsTrigger value="notifications">
            Notificações
            {getNotificationStats.data?.totalNotifications > 0 && (
              <Badge variant="destructive" className="ml-2">
                {getNotificationStats.data.totalNotifications}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Vencidos
            {getNotificationStats.data?.overdueCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {getNotificationStats.data.overdueCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="space-y-4">
          {/* Exames Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                Exames Periódicos
              </CardTitle>
              <CardDescription>
                Lista de todos os exames periódicos agendados e realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!periodicExams || periodicExams.length === 0 ? (
                <div className="text-center py-8">
                  <Stethoscope className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Nenhum exame periódico encontrado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data Exame</TableHead>
                      <TableHead>Médico</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Arquivo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {periodicExams.map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">
                          {exam.employee?.nome || 'N/A'}
                        </TableCell>
                        <TableCell className="capitalize">
                          {exam.tipo_exame.replace('_', ' ')}
                        </TableCell>
                        <TableCell>
                          {new Date(exam.data_agendada).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>{exam.medico_responsavel || '-'}</TableCell>
                        <TableCell>{getResultBadge(exam.resultado)}</TableCell>
                        <TableCell>
                          {exam.arquivo_anexo ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(exam.arquivo_anexo, '_blank')}
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(exam.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(exam)}
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(exam.id)}
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
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notificações Pendentes
              </CardTitle>
              <CardDescription>
                Exames que precisam de notificação (próximos 30 dias)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getExamsNeedingNotification.isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-gray-500 mt-2">Carregando notificações...</p>
                </div>
              ) : !getExamsNeedingNotification.data || getExamsNeedingNotification.data.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Nenhuma notificação pendente</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data Exame</TableHead>
                      <TableHead>Dias Restantes</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getExamsNeedingNotification.data.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell className="font-medium">
                          {notification.employeeName}
                        </TableCell>
                        <TableCell className="capitalize">
                          {notification.examType.replace('_', ' ')}
                        </TableCell>
                        <TableCell>
                          {new Date(notification.scheduledDate).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={notification.daysUntilExpiry <= 7 ? "destructive" : "secondary"}>
                            {notification.daysUntilExpiry} dias
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendNotification(notification)}
                          >
                            <Bell className="w-4 h-4 mr-1" />
                            Enviar Notificação
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Exames Vencidos
              </CardTitle>
              <CardDescription>
                Exames que passaram da data agendada
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getOverdueExams.isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-gray-500 mt-2">Carregando exames vencidos...</p>
                </div>
              ) : !getOverdueExams.data || getOverdueExams.data.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-4" />
                  <p className="text-gray-500">Nenhum exame vencido</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data Exame</TableHead>
                      <TableHead>Dias Vencido</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getOverdueExams.data.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell className="font-medium">
                          {notification.employeeName}
                        </TableCell>
                        <TableCell className="capitalize">
                          {notification.examType.replace('_', ' ')}
                        </TableCell>
                        <TableCell>
                          {new Date(notification.scheduledDate).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            {Math.abs(notification.daysUntilExpiry)} dias
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRescheduleOverdue(notification.id)}
                            >
                              <Calendar className="w-4 h-4 mr-1" />
                              Reagendar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendNotification(notification)}
                            >
                              <Bell className="w-4 h-4 mr-1" />
                              Notificar
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
