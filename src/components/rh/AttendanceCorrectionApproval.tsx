// @ts-nocheck
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';

const AttendanceCorrectionApproval = () => {
  const [corrections, setCorrections] = useState([
    {
      id: 1,
      employee: { first_name: 'João', last_name: 'Silva' },
      date: '2024-01-15',
      original_time: '08:30',
      corrected_time: '08:00',
      reason: 'Esqueci de bater o ponto na entrada',
      status: 'pending'
    }
  ]);

  const { toast } = useToast();

  const handleApproval = async (correctionId, action) => {
    try {
      setCorrections(prev => 
        prev.map(correction => 
          correction.id === correctionId 
            ? { ...correction, status: action === 'approve' ? 'approved' : 'rejected' }
            : correction
        )
      );

      toast({
        title: action === 'approve' ? 'Correção aprovada' : 'Correção rejeitada',
        description: `A solicitação foi ${action === 'approve' ? 'aprovada' : 'rejeitada'} com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar a solicitação",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'secondary', icon: Clock },
      approved: { label: 'Aprovado', variant: 'default', icon: CheckCircle },
      rejected: { label: 'Rejeitado', variant: 'destructive', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Aprovação de Correções de Ponto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {corrections.map((correction) => (
              <Card key={correction.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold">
                        {correction.employee.first_name} {correction.employee.last_name}
                      </h3>
                      {getStatusBadge(correction.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-gray-500">Horário Original:</p>
                        <p className="font-medium text-red-600">
                          {correction.original_time}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Horário Corrigido:</p>
                        <p className="font-medium text-green-600">
                          {correction.corrected_time}
                        </p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-gray-500">Motivo:</p>
                      <p className="font-medium">{correction.reason}</p>
                    </div>
                  </div>

                  {correction.status === 'pending' && (
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleApproval(correction.id, 'approve')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleApproval(correction.id, 'reject')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceCorrectionApproval;