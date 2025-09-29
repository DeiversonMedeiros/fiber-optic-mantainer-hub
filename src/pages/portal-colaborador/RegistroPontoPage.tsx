import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Pause, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useOfflineTimeRecords } from '@/hooks/useOfflineTimeRecords';
import { ConnectivityStatus } from '@/components/ConnectivityStatus';
import { OfflineInstructions } from '@/components/OfflineInstructions';
import { useTimeReminders } from '@/hooks/useTimeReminders';
import { NotificationSettingsModal } from '@/components/NotificationSettingsModal';
import { Bell, BellOff } from 'lucide-react';

const RegistroPontoPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Sistema de lembretes
  const { 
    settings: reminderSettings, 
    permission, 
    canNotify,
    requestPermission,
    testNotification 
  } = useTimeReminders();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Usar o hook offline
  const {
    record: registroAtual,
    isLoading,
    isOfflineMode,
    isSyncing,
    pendingSyncCount,
    registerTimeRecord,
    syncPendingRecords,
    canRegisterEntrada,
    canRegisterSaida,
    canRegisterIntervaloInicio,
    canRegisterIntervaloFim
  } = useOfflineTimeRecords(selectedDate);

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRegisterPonto = async (tipo: 'entrada' | 'saida' | 'intervalo_inicio' | 'intervalo_fim' | 'hora_adicional_inicio' | 'hora_adicional_fim') => {
    try {
      const result = await registerTimeRecord(tipo, currentTime);
      
      if (result.offline) {
        toast({
          title: "Ponto registrado (Offline)",
          description: "Seu ponto foi salvo localmente e será sincronizado quando a conexão for restabelecida.",
        });
      } else {
        toast({
          title: "Ponto registrado!",
          description: "Seu ponto foi registrado com sucesso.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao registrar ponto",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };


  const getStatusBadge = () => {
    if (!registroAtual) {
      return <Badge className="bg-gray-100 text-gray-800">Não registrado</Badge>;
    }

    if (registroAtual.hora_entrada && !registroAtual.hora_saida) {
      if (registroAtual.intervalo_inicio && !registroAtual.intervalo_fim) {
        return <Badge className="bg-yellow-100 text-yellow-800">Em intervalo</Badge>;
      }
      return <Badge className="bg-green-100 text-green-800">Trabalhando</Badge>;
    }

    if (registroAtual.hora_saida) {
      return <Badge className="bg-blue-100 text-blue-800">Finalizado</Badge>;
    }

    return <Badge className="bg-gray-100 text-gray-800">Parcial</Badge>;
  };

  const calcularHorasTrabalhadas = () => {
    if (!registroAtual?.hora_entrada) return '0h 0min';
    
    const entrada = new Date(`2000-01-01T${registroAtual.hora_entrada}`);
    let saida = new Date();
    
    if (registroAtual.hora_saida) {
      saida = new Date(`2000-01-01T${registroAtual.hora_saida}`);
    }
    
    // Subtrair intervalo se existir
    let intervaloMinutos = 0;
    if (registroAtual.intervalo_inicio && registroAtual.intervalo_fim) {
      const inicioIntervalo = new Date(`2000-01-01T${registroAtual.intervalo_inicio}`);
      const fimIntervalo = new Date(`2000-01-01T${registroAtual.intervalo_fim}`);
      intervaloMinutos = (fimIntervalo.getTime() - inicioIntervalo.getTime()) / (1000 * 60);
    } else if (registroAtual.intervalo_inicio && !registroAtual.intervalo_fim) {
      // Intervalo em andamento
      const inicioIntervalo = new Date(`2000-01-01T${registroAtual.intervalo_inicio}`);
      const agora = new Date(`2000-01-01T${currentTime.toTimeString().split(' ')[0]}`);
      intervaloMinutos = (agora.getTime() - inicioIntervalo.getTime()) / (1000 * 60);
    }
    
    const totalMinutos = (saida.getTime() - entrada.getTime()) / (1000 * 60) - intervaloMinutos;
    const horas = Math.floor(totalMinutos / 60);
    const minutos = Math.floor(totalMinutos % 60);
    
    return `${horas}h ${minutos}min`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando registro de ponto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registro de Ponto</h1>
          <p className="text-gray-600">Registre sua entrada, saída e intervalos</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Status das Notificações */}
          <div className="flex items-center space-x-2">
            {canNotify ? (
              <Badge variant="default" className="flex items-center space-x-1">
                <Bell className="h-3 w-3" />
                <span>Notificações Ativas</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center space-x-1">
                <BellOff className="h-3 w-3" />
                <span>Notificações Desativadas</span>
              </Badge>
            )}
            
            {/* Botão para configurar notificações */}
            <NotificationSettingsModal>
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-1" />
                Configurar
              </Button>
            </NotificationSettingsModal>
          </div>
          
          {/* Status de Conectividade */}
          <ConnectivityStatus 
            onSyncClick={syncPendingRecords}
            isSyncing={isSyncing}
            pendingSyncCount={pendingSyncCount}
          />
        </div>
      </div>

      {/* Aviso de modo offline */}
      {isOfflineMode && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <WifiOff className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-900">Modo Offline</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  Você está sem conexão com a internet. Seus registros de ponto estão sendo salvos localmente 
                  e serão sincronizados automaticamente quando a conexão for restabelecida.
                </p>
                {pendingSyncCount > 0 && (
                  <p className="text-sm text-yellow-800 mt-1 font-medium">
                    {pendingSyncCount} registro{pendingSyncCount > 1 ? 's' : ''} aguardando sincronização.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Relógio e Data */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-gray-900 mb-2">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-lg text-gray-600">
              {currentTime.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Status Atual</span>
            </span>
            {getStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Entrada</p>
              <p className="font-mono font-medium">
                {registroAtual?.hora_entrada || '--:--'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Saída</p>
              <p className="font-mono font-medium">
                {registroAtual?.hora_saida || '--:--'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Intervalo Início</p>
              <p className="font-mono font-medium">
                {registroAtual?.intervalo_inicio || '--:--'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Intervalo Fim</p>
              <p className="font-mono font-medium">
                {registroAtual?.intervalo_fim || '--:--'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Início Hora Adicional</p>
              <p className="font-mono font-medium">
                {registroAtual?.hora_adicional_inicio || '--:--'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Fim Hora Adicional</p>
              <p className="font-mono font-medium">
                {registroAtual?.hora_adicional_fim || '--:--'}
              </p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-center">
              <div className="text-center">
                <p className="text-sm text-gray-600">Horas Trabalhadas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {calcularHorasTrabalhadas()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões de Registro */}
      <Card>
        <CardHeader>
          <CardTitle>Ações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Button
              onClick={() => handleRegisterPonto('entrada')}
              disabled={!canRegisterEntrada() || isSyncing}
              className="h-20 flex flex-col space-y-2 bg-green-600 hover:bg-green-700"
            >
              <Play className="h-6 w-6" />
              <span>Entrada</span>
            </Button>
            
            <Button
              onClick={() => handleRegisterPonto('intervalo_inicio')}
              disabled={!canRegisterIntervaloInicio() || isSyncing}
              variant="outline"
              className="h-20 flex flex-col space-y-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50"
            >
              <Pause className="h-6 w-6" />
              <span>Início Intervalo</span>
            </Button>
            
            <Button
              onClick={() => handleRegisterPonto('intervalo_fim')}
              disabled={!canRegisterIntervaloFim() || isSyncing}
              variant="outline"
              className="h-20 flex flex-col space-y-2 border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              <Play className="h-6 w-6" />
              <span>Fim Intervalo</span>
            </Button>
            
            <Button
              onClick={() => handleRegisterPonto('saida')}
              disabled={!canRegisterSaida() || isSyncing}
              className="h-20 flex flex-col space-y-2 bg-red-600 hover:bg-red-700"
            >
              <CheckCircle className="h-6 w-6" />
              <span>Saída</span>
            </Button>

            <Button
              onClick={() => handleRegisterPonto('hora_adicional_inicio')}
              disabled={!registroAtual?.hora_saida || !!registroAtual?.hora_adicional_inicio || isSyncing}
              variant="outline"
              className="h-20 flex flex-col space-y-2 border-blue-500 text-blue-600 hover:bg-blue-50 !whitespace-normal text-center leading-tight px-2"
            >
              <Play className="h-6 w-6" />
              <span className="block !whitespace-normal break-words">Início Hora Adicional</span>
            </Button>

            <Button
              onClick={() => handleRegisterPonto('hora_adicional_fim')}
              disabled={!registroAtual?.hora_adicional_inicio || !!registroAtual?.hora_adicional_fim || isSyncing}
              variant="outline"
              className="h-20 flex flex-col space-y-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 !whitespace-normal text-center leading-tight px-2"
            >
              <CheckCircle className="h-6 w-6" />
              <span className="block !whitespace-normal break-words">Fim Hora Adicional</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações Importantes */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Informações Importantes</h3>
              <ul className="text-sm text-blue-800 mt-1 space-y-1">
                <li>• Registre sua entrada logo ao chegar no trabalho</li>
                <li>• Registre o início e fim dos intervalos</li>
                <li>• Registre sua saída ao final do expediente</li>
                <li>• Em caso de esquecimento, use a opção de correção de ponto</li>
                <li>• Seus registros são salvos mesmo sem internet e sincronizados automaticamente</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Componente de Instruções Offline */}
      <OfflineInstructions />
    </div>
  );
};

export default RegistroPontoPage;
