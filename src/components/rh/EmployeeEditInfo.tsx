import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Save, FileText } from 'lucide-react';

interface EmployeeEditInfoProps {
  isEditing: boolean;
}

export function EmployeeEditInfo({ isEditing }: EmployeeEditInfoProps) {
  if (!isEditing) return null;

  return (
    <Alert className="mb-4">
      <Info className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium">Como funciona a edição:</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <Save className="h-3 w-3" />
              <span><strong>Botão "Atualizar":</strong> Salva apenas os dados básicos do funcionário (nome, matrícula, CPF, etc.)</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-3 w-3" />
              <span><strong>Abas (Docs, Endereços, etc.):</strong> Cada aba tem seus próprios botões de salvar</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Dica: Para salvar dados das abas, navegue até a aba desejada e use os botões específicos de cada seção.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
