import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, AlertCircle } from 'lucide-react';
import { useEmployeeCorrectionStatus } from '@/hooks/rh/useEmployeeCorrectionStatus';
import { MonthlyTimeRecordsCalendar } from '@/components/rh/MonthlyTimeRecordsCalendar';

const CorrecaoPontoPage = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const { correctionEnabled, isLoading: correctionLoading } = useEmployeeCorrectionStatus(selectedYear, selectedMonth);


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Correção de Ponto</h1>
        <p className="text-gray-600">Edite seus registros de ponto do mês</p>
      </div>

      {/* Status de Correção */}
      {correctionLoading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className={`p-3 rounded-lg border ${
          correctionEnabled 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            {correctionEnabled ? (
              <Unlock className="h-4 w-4 text-green-600" />
            ) : (
              <Lock className="h-4 w-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${
              correctionEnabled ? 'text-green-800' : 'text-red-800'
            }`}>
              {correctionEnabled 
                ? 'Correção de ponto liberada - Você pode editar seus registros'
                : 'Correção de ponto bloqueada - Apenas registros em tempo real'
              }
            </span>
          </div>
        </div>
      )}

      {/* Seletor de Mês/Ano - Sempre visível */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Mês para Correção</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ano</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full p-2 border rounded-md"
              >
                {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - 1 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mês</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full p-2 border rounded-md"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>
                    {new Date(2024, month - 1).toLocaleDateString('pt-BR', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo baseado no status de liberação */}
      {!correctionEnabled ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Correção Bloqueada
              </h3>
              <p className="text-gray-600">
                A correção de ponto não está liberada para este mês.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Calendário de Registros - Apenas quando liberado */
        <MonthlyTimeRecordsCalendar
          year={selectedYear}
          month={selectedMonth}
          correctionEnabled={correctionEnabled}
        />
      )}
    </div>
  );
};

export default CorrecaoPontoPage;
