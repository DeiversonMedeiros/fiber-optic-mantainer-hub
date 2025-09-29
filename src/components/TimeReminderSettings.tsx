import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  BellOff, 
  Clock, 
  Settings, 
  TestTube,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useTimeReminders } from '@/hooks/useTimeReminders';
import { useToast } from '@/hooks/use-toast';

export const TimeReminderSettings: React.FC = () => {
  const { toast } = useToast();
  const {
    settings,
    isLoading,
    permission,
    canNotify,
    saveSettings,
    requestPermission,
    testNotification,
    workSchedule
  } = useTimeReminders();

  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Atualizar configurações locais quando as configurações mudarem
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSettingChange = (key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings(localSettings);
      toast({
        title: "Configurações salvas!",
        description: "Suas configurações de lembretes foram atualizadas.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestPermission = async () => {
    try {
      const granted = await requestPermission();
      if (granted) {
        toast({
          title: "Permissão concedida!",
          description: "Você receberá lembretes de registro de ponto.",
        });
      } else {
        toast({
          title: "Permissão negada",
          description: "Você não receberá notificações. Pode alterar isso nas configurações do navegador.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível solicitar permissão.",
        variant: "destructive",
      });
    }
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      const success = await testNotification();
      if (success) {
        toast({
          title: "Teste enviado!",
          description: "Verifique se a notificação apareceu.",
        });
      } else {
        toast({
          title: "Erro no teste",
          description: "Não foi possível enviar a notificação de teste.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao testar notificação.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando configurações...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status das Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Status das Notificações</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {canNotify ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span>Permissão do Navegador</span>
            </div>
            <Badge variant={canNotify ? "default" : "destructive"}>
              {canNotify ? "Ativa" : "Inativa"}
            </Badge>
          </div>

          {!canNotify && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 mb-3">
                Para receber lembretes de registro de ponto, você precisa permitir notificações no navegador.
              </p>
              <Button onClick={handleRequestPermission} size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Permitir Notificações
              </Button>
            </div>
          )}

          {canNotify && (
            <div className="flex space-x-2">
              <Button onClick={handleTestNotification} disabled={isTesting} size="sm" variant="outline">
                <TestTube className="h-4 w-4 mr-2" />
                {isTesting ? "Testando..." : "Testar Notificação"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações de Lembretes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configurações de Lembretes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Habilitar/Desabilitar */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="enabled">Ativar lembretes</Label>
              <p className="text-sm text-gray-600">
                Receber notificações para lembrar de registrar o ponto
              </p>
            </div>
            <Switch
              id="enabled"
              checked={localSettings.enabled}
              onCheckedChange={(checked) => handleSettingChange('enabled', checked)}
            />
          </div>

          {localSettings.enabled && (
            <>
              {/* Lembretes Específicos */}
              <div className="space-y-4">
                <h4 className="font-medium">Lembretes por Tipo</h4>
                
                {/* Entrada */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Lembrete de Entrada</Label>
                      <p className="text-sm text-gray-600">
                        Notificar 5 minutos antes do horário de entrada
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.entrada_reminder}
                      onCheckedChange={(checked) => handleSettingChange('entrada_reminder', checked)}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label>Horário de Entrada</Label>
                    <Input
                      type="time"
                      value={localSettings.entrada_time}
                      onChange={(e) => handleSettingChange('entrada_time', e.target.value)}
                      disabled={!localSettings.entrada_reminder}
                    />
                  </div>
                </div>

                {/* Saída */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Lembrete de Saída</Label>
                      <p className="text-sm text-gray-600">
                        Notificar no horário de saída
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.saida_reminder}
                      onCheckedChange={(checked) => handleSettingChange('saida_reminder', checked)}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label>Horário de Saída</Label>
                    <Input
                      type="time"
                      value={localSettings.saida_time}
                      onChange={(e) => handleSettingChange('saida_time', e.target.value)}
                      disabled={!localSettings.saida_reminder}
                    />
                  </div>
                </div>

                {/* Intervalo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Lembretes de Intervalo</Label>
                      <p className="text-sm text-gray-600">
                        Notificar início e fim do intervalo
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.intervalo_reminder}
                      onCheckedChange={(checked) => handleSettingChange('intervalo_reminder', checked)}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label>Início do Intervalo</Label>
                    <Input
                      type="time"
                      value={localSettings.intervalo_inicio_time}
                      onChange={(e) => handleSettingChange('intervalo_inicio_time', e.target.value)}
                      disabled={!localSettings.intervalo_reminder}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label>Fim do Intervalo</Label>
                    <Input
                      type="time"
                      value={localSettings.intervalo_fim_time}
                      onChange={(e) => handleSettingChange('intervalo_fim_time', e.target.value)}
                      disabled={!localSettings.intervalo_reminder}
                    />
                  </div>
                </div>
              </div>

              {/* Mensagem Personalizada */}
              <div className="space-y-2">
                <Label htmlFor="custom_message">Mensagem Personalizada</Label>
                <Textarea
                  id="custom_message"
                  placeholder="Digite uma mensagem personalizada para os lembretes (opcional)"
                  value={localSettings.custom_message}
                  onChange={(e) => handleSettingChange('custom_message', e.target.value)}
                  rows={3}
                />
                <p className="text-sm text-gray-600">
                  Se deixar em branco, será usada a mensagem padrão para cada tipo de lembrete.
                </p>
              </div>

              {/* Informações da Escala de Trabalho */}
              {workSchedule && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Escala de Trabalho</span>
                  </div>
                  <p className="text-sm text-blue-800">
                    Seus lembretes serão baseados na escala de trabalho configurada: 
                    {(workSchedule as any)?.hora_inicio || 'N/A'} às {(workSchedule as any)?.hora_fim || 'N/A'}
                    {(workSchedule as any)?.hora_intervalo_inicio && (workSchedule as any)?.hora_intervalo_fim && 
                      ` (Intervalo: ${(workSchedule as any).hora_intervalo_inicio} - ${(workSchedule as any).hora_intervalo_fim})`
                    }
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex justify-end space-x-2">
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !localSettings.enabled}
          className="flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? "Salvando..." : "Salvar Configurações"}</span>
        </Button>
      </div>
    </div>
  );
};
