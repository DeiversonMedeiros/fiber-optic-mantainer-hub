import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const HoleritePage = () => {
  const { user } = useAuth();
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1);

  // Buscar holerites do colaborador
  const { data: holerites, isLoading } = useQuery({
    queryKey: ['holerites', user?.id, anoSelecionado],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await rhSupabase
        .from('payroll_slips')
        .select('*')
        .eq('employee_id', user.id)
        .eq('ano_referencia', anoSelecionado)
        .order('mes_referencia', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const meses = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const holeriteAtual = holerites?.find(h => h.mes_referencia === mesSelecionado);

  const handleDownload = async (holerite: any) => {
    if (holerite.arquivo_pdf) {
      // Aqui você implementaria o download do PDF
      // Por enquanto, apenas simula o download
      console.log('Download do holerite:', holerite);
      // window.open(holerite.arquivo_pdf, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Holerites</h1>
        <p className="text-gray-600">Visualize e baixe seus holerites</p>
      </div>

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
                Ano
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
            
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Mês
              </label>
              <Select value={mesSelecionado.toString()} onValueChange={(value) => setMesSelecionado(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value.toString()}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Holerite Selecionado */}
      {holeriteAtual ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Holerite - {meses[mesSelecionado - 1].label}/{anoSelecionado}</span>
              </div>
              <Badge variant="outline">Disponível</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Referência</p>
                  <p className="font-medium">{meses[mesSelecionado - 1].label}/{anoSelecionado}</p>
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
                    {new Date(holeriteAtual.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Última Atualização</p>
                  <p className="font-medium">
                    {new Date(holeriteAtual.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={() => handleDownload(holeriteAtual)} className="flex items-center space-x-2">
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
              Holerite não encontrado
            </h3>
            <p className="text-gray-600">
              Não foi encontrado holerite para {meses[mesSelecionado - 1].label}/{anoSelecionado}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lista de Holerites Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Holerites - {anoSelecionado}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando holerites...</p>
            </div>
          ) : holerites && holerites.length > 0 ? (
            <div className="space-y-3">
              {holerites.map((holerite) => (
                <div key={holerite.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium">
                        {meses[holerite.mes_referencia - 1].label}/{holerite.ano_referencia}
                      </p>
                      <p className="text-sm text-gray-600">
                        Gerado em {new Date(holerite.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Processado</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(holerite)}
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
                Nenhum holerite encontrado
              </h3>
              <p className="text-gray-600">
                Não há holerites disponíveis para o ano {anoSelecionado}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HoleritePage;
