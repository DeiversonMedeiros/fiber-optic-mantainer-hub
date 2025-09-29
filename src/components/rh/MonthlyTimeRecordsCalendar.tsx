import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Edit, Plus, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useMonthlyTimeRecords } from '@/hooks/rh/useMonthlyTimeRecords';
import { useEmployeeCorrectionStatus } from '@/hooks/rh/useEmployeeCorrectionStatus';
import { TimeRecordEditModal } from './TimeRecordEditModal';

interface MonthlyTimeRecordsCalendarProps {
  year: number;
  month: number;
  correctionEnabled: boolean;
}

export function MonthlyTimeRecordsCalendar({ year, month, correctionEnabled }: MonthlyTimeRecordsCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const { recordsByDate, delayReasons, isLoading } = useMonthlyTimeRecords(year, month);
  const { correctionEnabled: monthCorrectionEnabled } = useEmployeeCorrectionStatus(year, month);

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const getRecordStatus = (record: any) => {
    if (!record) return 'empty';
    
    if (record.hora_entrada && record.hora_saida) {
      return 'complete';
    } else if (record.hora_entrada) {
      return 'partial';
    }
    return 'incomplete';
  };

  const getStatusBadge = (record: any) => {
    const status = getRecordStatus(record);
    
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-100 text-green-800 text-xs">Completo</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Parcial</Badge>;
      case 'incomplete':
        return <Badge className="bg-red-100 text-red-800 text-xs">Incompleto</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 text-xs">Sem registro</Badge>;
    }
  };

  const getStatusIcon = (record: any) => {
    const status = getRecordStatus(record);
    
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'incomplete':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleEditRecord = (date: string, record: any) => {
    setSelectedDate(date);
    setEditingRecord(record);
    setIsEditModalOpen(true);
  };

  const handleCreateRecord = (date: string) => {
    setSelectedDate(date);
    setEditingRecord(null);
    setIsEditModalOpen(true);
  };

  const formatTime = (time: string | null) => {
    if (!time) return '--:--';
    return time.substring(0, 5);
  };

  const calculateWorkHours = (record: any) => {
    if (!record?.hora_entrada) return '0h 0min';
    
    const entrada = new Date(`2000-01-01T${record.hora_entrada}`);
    let saida = new Date();
    
    if (record.hora_saida) {
      saida = new Date(`2000-01-01T${record.hora_saida}`);
    }
    
    // Subtrair intervalo se existir
    let intervaloMinutos = 0;
    if (record.intervalo_inicio && record.intervalo_fim) {
      const inicioIntervalo = new Date(`2000-01-01T${record.intervalo_inicio}`);
      const fimIntervalo = new Date(`2000-01-01T${record.intervalo_fim}`);
      intervaloMinutos = (fimIntervalo.getTime() - inicioIntervalo.getTime()) / (1000 * 60);
    }
    
    const totalMinutos = (saida.getTime() - entrada.getTime()) / (1000 * 60) - intervaloMinutos;
    const horas = Math.floor(totalMinutos / 60);
    const minutos = Math.floor(totalMinutos % 60);
    
    return `${horas}h ${minutos}min`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando registros do mês...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const days = [];

  // Adicionar dias vazios para alinhar o calendário
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Adicionar dias do mês
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dateString = date.toISOString().split('T')[0];
    const record = recordsByDate[dateString];
    
    days.push({
      day,
      date: dateString,
      record,
      isToday: dateString === new Date().toISOString().split('T')[0],
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Registros de Ponto - {getMonthName(month)}/{year}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="text-center font-medium text-gray-600 p-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {days.map((dayData, index) => {
              if (!dayData) {
                return <div key={index} className="h-24"></div>;
              }

              const { day, date, record, isToday, isWeekend } = dayData;
              const status = getRecordStatus(record);

              return (
                <Card
                  key={date}
                  className={`h-24 p-2 cursor-pointer transition-all hover:shadow-md ${
                    isToday ? 'ring-2 ring-blue-500' : ''
                  } ${isWeekend ? 'bg-gray-50' : 'bg-white'}`}
                  onClick={() => {
                    if (monthCorrectionEnabled) {
                      if (record) {
                        handleEditRecord(date, record);
                      } else {
                        handleCreateRecord(date);
                      }
                    }
                  }}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${
                        isToday ? 'text-blue-600' : isWeekend ? 'text-gray-500' : 'text-gray-900'
                      }`}>
                        {day}
                      </span>
                      {monthCorrectionEnabled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (record) {
                              handleEditRecord(date, record);
                            } else {
                              handleCreateRecord(date);
                            }
                          }}
                        >
                          {record ? <Edit className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center">
                      {record ? (
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(record)}
                            {getStatusBadge(record)}
                          </div>
                          <div className="text-xs space-y-0.5">
                            <div className="font-mono">
                              E: {formatTime(record.hora_entrada)}
                            </div>
                            <div className="font-mono">
                              S: {formatTime(record.hora_saida)}
                            </div>
                            <div className="text-blue-600 font-medium">
                              {calculateWorkHours(record)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Clock className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <TimeRecordEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDate(null);
          setEditingRecord(null);
        }}
        date={selectedDate}
        record={editingRecord}
        delayReasons={delayReasons}
        correctionEnabled={monthCorrectionEnabled}
      />
    </div>
  );
}
