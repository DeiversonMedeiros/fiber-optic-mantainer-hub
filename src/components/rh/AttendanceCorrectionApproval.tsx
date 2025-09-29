import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AttendanceCorrection {
  id: string;
  employee_id: string;
  employee_name: string;
  data_original: string;
  hora_entrada_original: string;
  hora_saida_original: string;
  hora_entrada_corrigida: string;
  hora_saida_corrigida: string;
  justificativa: string;
  status: 'pending' | 'approved' | 'rejected';
  horario_correcao: string;
  created_at: string;
  aprovado_por?: string;
  data_aprovacao?: string;
}

interface AttendanceCorrectionApprovalProps {
  companyId: string;
}

export function AttendanceCorrectionApproval({ companyId }: AttendanceCorrectionApprovalProps) {
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [selectedCorrection, setSelectedCorrection] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Carregar correções pendentes
  React.useEffect(() => {
    loadCorrections();
  }, [companyId]);

  const loadCorrections = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('rh.attendance_corrections')
        .select(`
          *,
          employees:employee_id (
            first_name,
            last_name
          )
        `)
        .eq('company_id', companyId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar correções:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as correções de ponto",
          variant: "destructive"
        });
        return;
      }

      const formattedCorrections = data?.map(correction => ({
        ...correction,
        employee_name: `${correction.employees?.first_name || ''} ${correction.employees?.last_name || ''}`.trim(),
        horario_correcao: correction.horario_correcao || correction.created_at
      })) || [];

      setCorrections(formattedCorrections);
    } catch (error) {
      console.error('Erro ao carregar correções:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar correções",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (correctionId: string) => {
    if (!user) return;

    try {
      setProcessingId(correctionId);

      const { error } = await supabase
        .from('rh.attendance_corrections')
        .update({
          status: 'approved',
          aprovado_por: user.id,
          data_aprovacao: new Date().toISOString()
        })
        .eq('id', correctionId);

      if (error) {
        console.error('Erro ao aprovar correção:', error);
        toast({
          title: "Erro",
          description: "Não foi possível aprovar a correção",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Aprovado",
        description: "Correção de ponto aprovada com sucesso",
        variant: "default"
      });

      // Recarregar lista
      await loadCorrections();
    } catch (error) {
      console.error('Erro ao aprovar correção:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao aprovar correção",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (correctionId: string) => {
    if (!user || !rejectionReason.trim()) {
      toast({
        title: "Atenção",
        description: "Por favor, informe o motivo da rejeição",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessingId(correctionId);

      const { error } = await supabase
        .from('rh.attendance_corrections')
        .update({
          status: 'rejected',
          aprovado_por: user.id,
          data_aprovacao: new Date().toISOString(),
          justificativa: rejectionReason
        })
        .eq('id', correctionId);

      if (error) {
        console.error('Erro ao rejeitar correção:', error);
        toast({
          title: "Erro",
          description: "Não foi possível rejeitar a correção",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Rejeitado",
        description: "Correção de ponto rejeitada",
        variant: "destructive"
      });

      // Limpar motivo de rejeição e fechar modal
      setRejectionReason('');
      setSelectedCorrection(null);

      // Recarregar lista
      await loadCorrections();
    } catch (error) {
      console.error('Erro ao rejeitar correção:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao rejeitar correção",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatTime = (time: string) => {
    return time ? time.substring(0, 5) : '--:--';
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Desconhecido</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando correções...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Correções de Ponto Pendentes ({corrections.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {corrections.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma correção de ponto pendente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {corrections.map((correction) => (
                <Card key={correction.id} className="border-l-4 border-l-yellow-400">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-gray-500" />
                        <div>
                          <h3 className="font-medium">{correction.employee_name}</h3>
                          <p className="text-sm text-gray-500">
                            Data: {new Date(correction.data_original).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Corrigido em: {formatDateTime(correction.horario_correcao)}
                        </p>
                        {getStatusBadge(correction.status)}
                      </div>
                    </div>

                    {/* Horários Originais vs Corrigidos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          Horários Originais
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p>Entrada: {formatTime(correction.hora_entrada_original)}</p>
                          <p>Saída: {formatTime(correction.hora_saida_original)}</p>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 p-3 rounded-lg">
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Horários Corrigidos
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p>Entrada: {formatTime(correction.hora_entrada_corrigida)}</p>
                          <p>Saída: {formatTime(correction.hora_saida_corrigida)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Justificativa */}
                    <div className="mb-4">
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Justificativa
                      </h4>
                      <p className="text-sm bg-gray-50 p-3 rounded-lg">
                        {correction.justificativa}
                      </p>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(correction.id)}
                        disabled={processingId === correction.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(correction.id)}
                        disabled={processingId === correction.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Rejeição */}
      {selectedCorrection && (
        <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <CardContent className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="font-medium mb-4">Motivo da Rejeição</h3>
            <Textarea
              placeholder="Informe o motivo da rejeição..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mb-4"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCorrection(null);
                  setRejectionReason('');
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleReject(selectedCorrection)}
                disabled={!rejectionReason.trim() || processingId === selectedCorrection}
                className="bg-red-600 hover:bg-red-700"
              >
                Rejeitar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
