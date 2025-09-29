import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Settings, CreditCard, Plus, Edit, Save, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';

interface PaymentConfigManagementProps {
  companyId: string;
  className?: string;
}

interface PaymentConfig {
  id: string;
  company_id: string;
  benefit_type: string;
  allowed_payment_methods: string[];
  flash_api_key?: string;
  flash_company_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function PaymentConfigManagement({ companyId, className = '' }: PaymentConfigManagementProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<PaymentConfig | null>(null);
  const [newConfig, setNewConfig] = useState<Partial<PaymentConfig>>({
    benefit_type: '',
    allowed_payment_methods: ['flash', 'transfer', 'pix'],
    is_active: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar configurações de pagamento
  const { data: paymentConfigs, isLoading } = useQuery({
    queryKey: ['payment-configs', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('rh.benefit_payment_configs')
        .select('*')
        .eq('company_id', companyId)
        .order('benefit_type');

      if (error) throw error;
      return data as PaymentConfig[];
    },
    enabled: !!companyId
  });

  // Criar nova configuração
  const createConfig = useMutation({
    mutationFn: async (config: Partial<PaymentConfig>) => {
      const { data, error } = await rhSupabase
        .from('rh.benefit_payment_configs')
        .insert({
          company_id: companyId,
          benefit_type: config.benefit_type,
          allowed_payment_methods: config.allowed_payment_methods,
          flash_api_key: config.flash_api_key,
          flash_company_id: config.flash_company_id,
          is_active: config.is_active
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-configs', companyId] });
      toast({
        title: 'Configuração Criada',
        description: 'Configuração de pagamento criada com sucesso!',
      });
      setNewConfig({
        benefit_type: '',
        allowed_payment_methods: ['flash', 'transfer', 'pix'],
        is_active: true
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao Criar Configuração',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Atualizar configuração
  const updateConfig = useMutation({
    mutationFn: async ({ id, config }: { id: string; config: Partial<PaymentConfig> }) => {
      const { data, error } = await rhSupabase
        .from('rh.benefit_payment_configs')
        .update({
          benefit_type: config.benefit_type,
          allowed_payment_methods: config.allowed_payment_methods,
          flash_api_key: config.flash_api_key,
          flash_company_id: config.flash_company_id,
          is_active: config.is_active
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-configs', companyId] });
      toast({
        title: 'Configuração Atualizada',
        description: 'Configuração de pagamento atualizada com sucesso!',
      });
      setEditingConfig(null);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao Atualizar Configuração',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleCreateConfig = () => {
    if (!newConfig.benefit_type) {
      toast({
        title: 'Erro',
        description: 'Tipo de benefício é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    createConfig.mutate(newConfig);
  };

  const handleUpdateConfig = () => {
    if (!editingConfig) return;

    updateConfig.mutate({
      id: editingConfig.id,
      config: editingConfig
    });
  };

  const getBenefitTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'VR': 'Vale Refeição',
      'VA': 'Vale Alimentação',
      'transporte': 'Transporte',
      'premiacao': 'Premiação',
      'producao': 'Produção'
    };
    return labels[type] || type;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'flash': 'Cartão Flash',
      'transfer': 'Transferência',
      'pix': 'PIX'
    };
    return labels[method] || method;
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações de Pagamento
            </CardTitle>
            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Configuração
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nova Configuração de Pagamento</DialogTitle>
                  <DialogDescription>
                    Configure os métodos de pagamento permitidos para cada tipo de benefício
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Tipo de benefício */}
                  <div className="space-y-2">
                    <Label htmlFor="benefit_type">Tipo de Benefício</Label>
                    <Input
                      id="benefit_type"
                      value={newConfig.benefit_type || ''}
                      onChange={(e) => setNewConfig({ ...newConfig, benefit_type: e.target.value })}
                      placeholder="Ex: VR, VA, transporte, etc."
                    />
                  </div>

                  {/* Métodos de pagamento permitidos */}
                  <div className="space-y-2">
                    <Label>Métodos de Pagamento Permitidos</Label>
                    <div className="space-y-2">
                      {['flash', 'transfer', 'pix'].map((method) => (
                        <div key={method} className="flex items-center space-x-2">
                          <Switch
                            checked={newConfig.allowed_payment_methods?.includes(method) || false}
                            onCheckedChange={(checked) => {
                              const methods = newConfig.allowed_payment_methods || [];
                              if (checked) {
                                setNewConfig({
                                  ...newConfig,
                                  allowed_payment_methods: [...methods, method]
                                });
                              } else {
                                setNewConfig({
                                  ...newConfig,
                                  allowed_payment_methods: methods.filter(m => m !== method)
                                });
                              }
                            }}
                          />
                          <Label className="text-sm">{getPaymentMethodLabel(method)}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Configurações da Flash */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium">Configurações da Flash API</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="flash_api_key">Chave da API Flash</Label>
                      <Input
                        id="flash_api_key"
                        type="password"
                        value={newConfig.flash_api_key || ''}
                        onChange={(e) => setNewConfig({ ...newConfig, flash_api_key: e.target.value })}
                        placeholder="Sua chave da API Flash"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="flash_company_id">ID da Empresa na Flash</Label>
                      <Input
                        id="flash_company_id"
                        value={newConfig.flash_company_id || ''}
                        onChange={(e) => setNewConfig({ ...newConfig, flash_company_id: e.target.value })}
                        placeholder="ID da sua empresa na Flash"
                      />
                    </div>
                  </div>

                  {/* Status ativo */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newConfig.is_active || false}
                      onCheckedChange={(checked) => setNewConfig({ ...newConfig, is_active: checked })}
                    />
                    <Label>Configuração ativa</Label>
                  </div>

                  {/* Botões */}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsConfigOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateConfig}
                      disabled={createConfig.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Configuração
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Carregando configurações...</div>
          ) : paymentConfigs && paymentConfigs.length > 0 ? (
            <div className="space-y-4">
              {paymentConfigs.map((config) => (
                <div key={config.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{getBenefitTypeLabel(config.benefit_type)}</h4>
                        <Badge variant={config.is_active ? "default" : "secondary"}>
                          {config.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-muted-foreground">Métodos permitidos: </span>
                          <div className="flex gap-1 mt-1">
                            {config.allowed_payment_methods.map((method) => (
                              <Badge key={method} variant="outline" className="text-xs">
                                {getPaymentMethodLabel(method)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {config.flash_api_key && (
                          <div className="text-sm text-muted-foreground">
                            Flash API: {config.flash_api_key.substring(0, 8)}...
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingConfig(config)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma configuração de pagamento encontrada</p>
              <p className="text-sm">Clique em "Nova Configuração" para começar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de edição */}
      {editingConfig && (
        <Dialog open={!!editingConfig} onOpenChange={() => setEditingConfig(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Configuração de Pagamento</DialogTitle>
              <DialogDescription>
                Edite os métodos de pagamento para {getBenefitTypeLabel(editingConfig.benefit_type)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Métodos de pagamento permitidos */}
              <div className="space-y-2">
                <Label>Métodos de Pagamento Permitidos</Label>
                <div className="space-y-2">
                  {['flash', 'transfer', 'pix'].map((method) => (
                    <div key={method} className="flex items-center space-x-2">
                      <Switch
                        checked={editingConfig.allowed_payment_methods?.includes(method) || false}
                        onCheckedChange={(checked) => {
                          const methods = editingConfig.allowed_payment_methods || [];
                          if (checked) {
                            setEditingConfig({
                              ...editingConfig,
                              allowed_payment_methods: [...methods, method]
                            });
                          } else {
                            setEditingConfig({
                              ...editingConfig,
                              allowed_payment_methods: methods.filter(m => m !== method)
                            });
                          }
                        }}
                      />
                      <Label className="text-sm">{getPaymentMethodLabel(method)}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Configurações da Flash */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Configurações da Flash API</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_flash_api_key">Chave da API Flash</Label>
                  <Input
                    id="edit_flash_api_key"
                    type="password"
                    value={editingConfig.flash_api_key || ''}
                    onChange={(e) => setEditingConfig({ ...editingConfig, flash_api_key: e.target.value })}
                    placeholder="Sua chave da API Flash"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_flash_company_id">ID da Empresa na Flash</Label>
                  <Input
                    id="edit_flash_company_id"
                    value={editingConfig.flash_company_id || ''}
                    onChange={(e) => setEditingConfig({ ...editingConfig, flash_company_id: e.target.value })}
                    placeholder="ID da sua empresa na Flash"
                  />
                </div>
              </div>

              {/* Status ativo */}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingConfig.is_active || false}
                  onCheckedChange={(checked) => setEditingConfig({ ...editingConfig, is_active: checked })}
                />
                <Label>Configuração ativa</Label>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingConfig(null)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateConfig}
                  disabled={updateConfig.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default PaymentConfigManagement;
