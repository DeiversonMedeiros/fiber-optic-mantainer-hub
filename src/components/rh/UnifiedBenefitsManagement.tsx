// @ts-nocheck
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Users, 
  Calculator, 
  CreditCard, 
  BarChart3,
  Plus,
  FileSpreadsheet
} from 'lucide-react';
import { useBenefitStatistics } from '@/hooks/rh/useUnifiedBenefits';
import { BenefitType, BENEFIT_TYPE_LABELS } from '@/integrations/supabase/rh-benefits-unified-types';
import { BenefitsConfigurationTab } from './BenefitsConfigurationTab';
import { BenefitsAssignmentsTab } from './BenefitsAssignmentsTab';
import { BenefitsProcessingTab } from './BenefitsProcessingTab';
import { BenefitsPaymentsTab } from './BenefitsPaymentsTab';
import { BenefitsStatisticsTab } from './BenefitsStatisticsTab';

interface UnifiedBenefitsManagementProps {
  companyId: string;
}

export function UnifiedBenefitsManagement({ companyId }: UnifiedBenefitsManagementProps) {
  const [activeTab, setActiveTab] = useState('configurations');
  const { statistics, isLoading: statsLoading } = useBenefitStatistics(companyId);

  // Calcular estatísticas gerais
  const totalConfigurations = statistics?.reduce((sum, stat) => sum + stat.total_configurations, 0) || 0;
  const totalActiveAssignments = statistics?.reduce((sum, stat) => sum + stat.active_assignments, 0) || 0;
  const totalProcessedValue = statistics?.reduce((sum, stat) => sum + stat.total_processed_value, 0) || 0;
  const totalPaidValue = statistics?.reduce((sum, stat) => sum + stat.total_paid_value, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Benefícios</h1>
          <p className="text-muted-foreground">
            Sistema unificado para gerenciamento de todos os tipos de benefícios
          </p>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configurações</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConfigurations}</div>
            <p className="text-xs text-muted-foreground">
              Configurações ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vínculos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveAssignments}</div>
            <p className="text-xs text-muted-foreground">
              Funcionários vinculados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processado</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalProcessedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total processado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pago</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalPaidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total pago
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas por Tipo de Benefício */}
      {statistics && statistics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Estatísticas por Tipo de Benefício
            </CardTitle>
            <CardDescription>
              Resumo dos benefícios por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {statistics.map((stat) => (
                <div key={stat.benefit_type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      {BENEFIT_TYPE_LABELS[stat.benefit_type as BenefitType]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {stat.active_configurations} configs
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Vínculos:</span>
                      <span className="font-medium">{stat.active_assignments}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Processado:</span>
                      <span className="font-medium">
                        R$ {stat.total_processed_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pago:</span>
                      <span className="font-medium">
                        R$ {stat.total_paid_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {stat.pending_value > 0 && (
                      <div className="flex justify-between text-sm text-orange-600">
                        <span>Pendente:</span>
                        <span className="font-medium">
                          R$ {stat.pending_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="configurations" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Vínculos
          </TabsTrigger>
          <TabsTrigger value="processing" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Processamento
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-4">
          <BenefitsConfigurationTab companyId={companyId} />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <BenefitsAssignmentsTab companyId={companyId} />
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          <BenefitsProcessingTab companyId={companyId} />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <BenefitsPaymentsTab companyId={companyId} />
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <BenefitsStatisticsTab companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
