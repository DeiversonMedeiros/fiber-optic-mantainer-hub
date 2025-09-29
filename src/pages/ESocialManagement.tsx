import React, { useState } from 'react';
import { useUserCompany } from '@/hooks/useUserCompany';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Users, Calendar, CheckCircle, Filter, Download, Plus, Shield, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function ESocialManagementPage() {
  const navigate = useNavigate();
  const { data: userCompany, isLoading: loadingCompany } = useUserCompany();
  const { toast } = useToast();
  
  // Estados para o modal de registro de eventos
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventData, setEventData] = useState({
    tipo_evento: '',
    numero_recibo: '',
    xml_evento: ''
  });

  // Função para abrir o modal
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  // Função para fechar o modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEventData({
      tipo_evento: '',
      numero_recibo: '',
      xml_evento: ''
    });
  };

  // Função para salvar o evento
  const handleSaveEvent = async () => {
    if (!eventData.tipo_evento) {
      toast({
        title: "Erro",
        description: "Selecione o tipo de evento",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('rh.esocial_events')
        .insert({
          company_id: userCompany?.id,
          tipo_evento: eventData.tipo_evento,
          numero_recibo: eventData.numero_recibo || null,
          xml_evento: eventData.xml_evento || null,
          status: 'pendente'
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Evento registrado com sucesso!",
      });

      handleCloseModal();
      // Aqui você pode adicionar uma função para recarregar os dados se necessário
      
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar evento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingCompany) {
    return (
      <div className="w-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <p className="text-muted-foreground">Carregando módulo RH...</p>
        </div>
      </div>
    );
  }

  if (!userCompany) {
    return (
      <div className="w-full flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-destructive rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Erro de Configuração</h2>
          <p className="text-muted-foreground mb-4">
            Não foi possível carregar as informações da empresa. 
            Verifique se você está associado a uma empresa válida.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!userCompany.is_active) {
    return (
      <div className="w-full flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-warning rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Empresa Inativa</h2>
          <p className="text-muted-foreground">
            A empresa <strong>{userCompany.nome_fantasia || userCompany.razao_social}</strong> está com status inativo. 
            Entre em contato com o administrador para ativar o módulo RH.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      
        {/* Header da página */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/rh')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar ao RH</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Gestão do eSocial
                </h1>
                <p className="text-muted-foreground mt-2">
                  Gerencie eventos e compliance do eSocial da empresa <strong>{userCompany.nome_fantasia || userCompany.razao_social}</strong>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button size="sm" onClick={handleOpenModal}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Evento
              </Button>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <button 
              onClick={() => navigate('/rh')}
              className="hover:text-foreground transition-colors"
            >
              RH
            </button>
            <span>/</span>
            <span className="text-foreground font-medium">eSocial</span>
          </nav>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Este mês</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos Enviados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">0</div>
              <p className="text-xs text-muted-foreground">Processados com sucesso</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos Pendentes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">0</div>
              <p className="text-xs text-muted-foreground">Aguardando envio</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance</CardTitle>
              <Shield className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">100%</div>
              <p className="text-xs text-muted-foreground">Taxa de conformidade</p>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Eventos do eSocial */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Eventos do eSocial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Nenhum evento do eSocial registrado</p>
                <p className="text-sm">Registre o primeiro evento do eSocial</p>
                <Button className="mt-4" size="sm" onClick={handleOpenModal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Evento
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status dos Eventos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Status dos Eventos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <div className="font-medium mb-2">Status Disponíveis:</div>
                  <ul className="space-y-1 text-xs">
                    <li>• Pendente</li>
                    <li>• Enviado</li>
                    <li>• Processado</li>
                    <li>• Rejeitado</li>
                    <li>• Erro</li>
                    <li>• Cancelado</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tipos de Eventos */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tipos de Eventos do eSocial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium">Eventos de Admissão</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• S-2200: Admissão de Trabalhador</li>
                  <li>• S-2205: Alteração de Dados Cadastrais</li>
                  <li>• S-2206: Alteração de Contrato de Trabalho</li>
                  <li>• S-2230: Afastamento Temporário</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">Eventos de Remuneração</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• S-1200: Remuneração de Trabalhador</li>
                  <li>• S-1202: Remuneração de Servidor</li>
                  <li>• S-1207: Benefícios Previdenciários</li>
                  <li>• S-1210: Pagamentos de Rendimentos</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">Eventos de Desligamento</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• S-2299: Desligamento</li>
                  <li>• S-2300: Trabalhador Sem Vínculo</li>
                  <li>• S-2399: Trabalhador Sem Vínculo</li>
                  <li>• S-2400: Cadastro de Beneficiários</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance e Validações */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Compliance e Validações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium">Validações Automáticas</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Verificação de CPF</li>
                  <li>• Validação de datas</li>
                  <li>• Verificação de campos obrigatórios</li>
                  <li>• Validação de códigos</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">Regras de Negócio</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Períodos de competência</li>
                  <li>• Limites de valores</li>
                  <li>• Regras de afastamento</li>
                  <li>• Validações específicas</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Relatórios */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Relatórios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center py-6 border rounded-lg">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="font-medium">Por Período</p>
                <p className="text-sm text-muted-foreground">Análise temporal</p>
              </div>
              <div className="text-center py-6 border rounded-lg">
                <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="font-medium">Compliance</p>
                <p className="text-sm text-muted-foreground">Taxa de conformidade</p>
              </div>
              <div className="text-center py-6 border rounded-lg">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="font-medium">Erros e Rejeições</p>
                <p className="text-sm text-muted-foreground">Análise de problemas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal de Registro de Evento */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Registrar Novo Evento eSocial</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_evento">Tipo de Evento *</Label>
                <Select 
                  value={eventData.tipo_evento} 
                  onValueChange={(value) => setEventData(prev => ({ ...prev, tipo_evento: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de evento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S-2200">S-2200: Admissão de Trabalhador</SelectItem>
                    <SelectItem value="S-2205">S-2205: Alteração de Dados Cadastrais</SelectItem>
                    <SelectItem value="S-2206">S-2206: Alteração de Contrato de Trabalho</SelectItem>
                    <SelectItem value="S-2230">S-2230: Afastamento Temporário</SelectItem>
                    <SelectItem value="S-1200">S-1200: Remuneração de Trabalhador</SelectItem>
                    <SelectItem value="S-1202">S-1202: Remuneração de Servidor</SelectItem>
                    <SelectItem value="S-1207">S-1207: Benefícios Previdenciários</SelectItem>
                    <SelectItem value="S-1210">S-1210: Pagamentos de Rendimentos</SelectItem>
                    <SelectItem value="S-2299">S-2299: Desligamento</SelectItem>
                    <SelectItem value="S-2300">S-2300: Trabalhador Sem Vínculo</SelectItem>
                    <SelectItem value="S-2399">S-2399: Trabalhador Sem Vínculo</SelectItem>
                    <SelectItem value="S-2400">S-2400: Cadastro de Beneficiários</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero_recibo">Número do Recibo</Label>
                <Input
                  id="numero_recibo"
                  placeholder="Digite o número do recibo (opcional)"
                  value={eventData.numero_recibo}
                  onChange={(e) => setEventData(prev => ({ ...prev, numero_recibo: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="xml_evento">XML do Evento</Label>
                <Textarea
                  id="xml_evento"
                  placeholder="Cole aqui o XML do evento (opcional)"
                  value={eventData.xml_evento}
                  onChange={(e) => setEventData(prev => ({ ...prev, xml_evento: e.target.value }))}
                  rows={6}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEvent} disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Registrar Evento'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}










