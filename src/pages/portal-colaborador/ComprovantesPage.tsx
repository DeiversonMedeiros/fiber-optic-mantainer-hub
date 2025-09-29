import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Calendar, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const ComprovantesPage = () => {
  const { user } = useAuth();
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());

  // Buscar comprovantes do colaborador
  const { data: comprovantes, isLoading } = useQuery({
    queryKey: ['comprovantes', user?.id, anoSelecionado],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await rhSupabase
        .from('income_statements')
        .select('*')
        .eq('employee_id', user.id)
        .eq('ano_referencia', anoSelecionado)
        .order('ano_referencia', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const handleDownload = async (comprovante: any) => {
    if (comprovante.arquivo_pdf) {
      // Aqui você implementaria o download do PDF
      // Por enquanto, apenas simula o download
      console.log('Download do comprovante:', comprovante);
      // window.open(comprovante.arquivo_pdf, '_blank');
    }
  };

  const comprovanteAtual = comprovantes?.find(c => c.ano_referencia === anoSelecionado);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Comprovantes de Rendimentos</h1>
        <p className="text-gray-600">Visualize e baixe seus comprovantes de rendimentos</p>
      </div>

      {/* Informações Importantes */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Importante</h3>
              <p className="text-sm text-blue-800 mt-1">
                Os comprovantes de rendimentos são utilizados para declaração do Imposto de Renda. 
                Certifique-se de baixar o documento do ano correto antes de preencher sua declaração.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Ano de Referência
              </label>
              <Select value={anoSelecionado.toString()} onValueChange={(value) => setAnoSelecionado(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map((ano) => (
                    <SelectItem key={ano} value={ano.toString()}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comprovante Selecionado */}
      {comprovanteAtual ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Comprovante de Rendimentos - {anoSelecionado}</span>
              </div>
              <Badge variant="outline">Disponível</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Ano de Referência</p>
                  <p className="font-medium">{comprovanteAtual.ano_referencia}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium">
                    <Badge className="bg-green-100 text-green-800">Processado</Badge>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Data de Geração</p>
                  <p className="font-medium">
                    {new Date(comprovanteAtual.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Para Declaração do IR</h4>
                    <p className="text-sm text-yellow-800 mt-1">
                      Este documento contém todas as informações necessárias para o preenchimento 
                      da sua declaração de Imposto de Renda, incluindo rendimentos, descontos e 
                      valores de IRRF retidos na fonte.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={() => handleDownload(comprovanteAtual)} className="flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Baixar PDF</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Comprovante não encontrado
            </h3>
            <p className="text-gray-600">
              Não foi encontrado comprovante de rendimentos para o ano {anoSelecionado}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lista de Comprovantes Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comprovantes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando comprovantes...</p>
            </div>
          ) : comprovantes && comprovantes.length > 0 ? (
            <div className="space-y-3">
              {comprovantes.map((comprovante) => (
                <div key={comprovante.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium">
                        Comprovante de Rendimentos - {comprovante.ano_referencia}
                      </p>
                      <p className="text-sm text-gray-600">
                        Gerado em {new Date(comprovante.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Processado</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(comprovante)}
                      className="flex items-center space-x-1"
                    >
                      <Download className="h-3 w-3" />
                      <span>Baixar</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum comprovante encontrado
              </h3>
              <p className="text-gray-600">
                Não há comprovantes de rendimentos disponíveis
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>Informações Importantes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Prazo para Declaração</h4>
                <p className="text-sm text-gray-600">
                  O prazo para entrega da declaração do Imposto de Renda geralmente 
                  vai de março a maio de cada ano.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Documentos Necessários</h4>
                <p className="text-sm text-gray-600">
                  Além do comprovante de rendimentos, você precisará de outros 
                  documentos como extratos bancários e comprovantes de gastos.
                </p>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Dúvidas?</h4>
              <p className="text-sm text-blue-800">
                Em caso de dúvidas sobre seu comprovante de rendimentos ou declaração 
                do IR, entre em contato com o departamento de RH.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComprovantesPage;
