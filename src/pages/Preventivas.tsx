
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, AlertTriangle } from "lucide-react";
import RiskCompletionForm from "@/components/preventive/RiskCompletionForm";
import type { Database } from '@/integrations/supabase/types';

type RiskStatus = Database['public']['Enums']['risk_status'];

interface Risk {
  id: string;
  risk_number: string | null;
  title: string;
  description: string;
  location: string;
  severity: number;
  status: RiskStatus;
  risk_type: string | null;
  cable_client_site: string | null;
  city: string | null;
  photos: string[];
  directed_at: string | null;
  created_at: string;
  reporter: {
    name: string;
  } | null;
}

const Preventivas = () => {
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar riscos direcionados ao usuário logado
  const { data: risks = [], isLoading } = useQuery({
    queryKey: ['technician-risks'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não logado');

      const { data, error } = await supabase
        .from('risks')
        .select(`
          *,
          reporter:profiles!reported_by(name)
        `)
        .eq('directed_to', user.user.id)
        .eq('status', 'direcionado')
        .order('directed_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(risk => ({
        ...risk,
        photos: Array.isArray(risk.photos) 
          ? (risk.photos as any[]).filter(photo => typeof photo === 'string') as string[]
          : []
      })) as Risk[];
    }
  });

  // Concluir risco
  const completionMutation = useMutation({
    mutationFn: async ({ riskId, formData }: { riskId: string; formData: any }) => {
      const { error } = await supabase
        .from('risks')
        .update({
          status: 'concluido' as RiskStatus,
          resolved_at: new Date().toISOString()
        })
        .eq('id', riskId);
      
      if (error) throw error;
      
      // Aqui você pode salvar os dados do formulário se necessário
      // Por exemplo, criar um registro de conclusão ou relatório
    },
    onSuccess: () => {
      toast({
        title: "Risco concluído",
        description: "O risco foi marcado como concluído com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['technician-risks'] });
      setFormOpen(false);
      setSelectedRisk(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao concluir risco",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCompleteRisk = (formData: any) => {
    if (selectedRisk) {
      completionMutation.mutate({
        riskId: selectedRisk.id,
        formData
      });
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'bg-red-100 text-red-800';
    if (severity >= 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getSeverityLabel = (severity: number) => {
    if (severity >= 8) return 'Alta';
    if (severity >= 5) return 'Média';
    return 'Baixa';
  };

  if (isLoading) {
    return <div className="p-6">Carregando riscos...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Preventivas</h1>
        <p className="text-muted-foreground">
          Riscos direcionados para você concluir
        </p>
      </div>

      {risks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold mb-2">Nenhum risco pendente</h3>
            <p className="text-muted-foreground">
              Você não possui riscos direcionados no momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {risks.map((risk) => (
            <Card key={risk.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    {risk.risk_number} - {risk.title}
                  </CardTitle>
                  <Badge className={getSeverityColor(risk.severity)}>
                    Severidade: {getSeverityLabel(risk.severity)}
                  </Badge>
                </div>
                <CardDescription>
                  Direcionado em: {risk.directed_at ? format(new Date(risk.directed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Descrição</h4>
                  <p className="text-sm text-muted-foreground">{risk.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-1">Localização</h4>
                    <p className="text-sm">{risk.location}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Tipo</h4>
                    <p className="text-sm">{risk.risk_type || '-'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Cabo/Cliente/Site</h4>
                    <p className="text-sm">{risk.cable_client_site || '-'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Cidade</h4>
                    <p className="text-sm">{risk.city || '-'}</p>
                  </div>
                </div>

                {risk.photos && risk.photos.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Fotos</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {risk.photos.map((photo, index) => (
                        <img 
                          key={index} 
                          src={photo} 
                          alt={`Foto ${index + 1}`} 
                          className="w-full h-24 object-cover rounded border"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={() => {
                      setSelectedRisk(risk);
                      setFormOpen(true);
                    }}
                    disabled={completionMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Concluir Risco
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RiskCompletionForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedRisk(null);
        }}
        risk={selectedRisk}
        onSubmit={handleCompleteRisk}
        isLoading={completionMutation.isPending}
      />
    </div>
  );
};

export default Preventivas;
