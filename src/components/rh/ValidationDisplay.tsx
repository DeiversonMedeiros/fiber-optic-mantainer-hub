import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationDisplayProps {
  isValid?: boolean;
  errors?: string[];
  warnings?: string[];
  info?: string[];
  className?: string;
  showSuccess?: boolean;
  compact?: boolean;
}

export function ValidationDisplay({
  isValid,
  errors = [],
  warnings = [],
  info = [],
  className = '',
  showSuccess = false,
  compact = false,
}: ValidationDisplayProps) {
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const hasInfo = info.length > 0;
  const hasContent = hasErrors || hasWarnings || hasInfo || (showSuccess && isValid);

  if (!hasContent) return null;

  if (compact) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {hasErrors && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            {errors.length} erro{errors.length !== 1 ? 's' : ''}
          </Badge>
        )}
        
        {hasWarnings && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {warnings.length} aviso{warnings.length !== 1 ? 's' : ''}
          </Badge>
        )}
        
        {hasInfo && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Info className="h-3 w-3" />
            {info.length} informação{info.length !== 1 ? 'es' : ''}
          </Badge>
        )}
        
        {showSuccess && isValid && !hasErrors && (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Válido
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Erros */}
      {hasErrors && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Erros de validação:</div>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-sm">
                  {error}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Avisos */}
      {hasWarnings && (
        <Alert variant="default" className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            <div className="font-medium mb-2 text-yellow-800">Avisos:</div>
            <ul className="list-disc list-inside space-y-1 text-yellow-700">
              {warnings.map((warning, index) => (
                <li key={index} className="text-sm">
                  {warning}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Informações */}
      {hasInfo && (
        <Alert variant="default" className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <div className="font-medium mb-2 text-blue-800">Informações:</div>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              {info.map((infoItem, index) => (
                <li key={index} className="text-sm">
                  {infoItem}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Sucesso */}
      {showSuccess && isValid && !hasErrors && (
        <Alert variant="default" className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="font-medium">Formulário válido!</div>
            <div className="text-sm text-green-700">
              Todos os campos estão preenchidos corretamente.
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Componente para validação de campo individual
interface FieldValidationProps {
  field: string;
  value: any;
  entity: string;
  companyId: string;
  className?: string;
  showSuccess?: boolean;
  compact?: boolean;
}

export function FieldValidation({
  field,
  value,
  entity,
  companyId,
  className = '',
  showSuccess = false,
  compact = false,
}: FieldValidationProps) {
  // Este componente seria usado com o hook useRHValidation
  // Por enquanto, retornamos null para evitar dependências circulares
  return null;
}

// Componente para validação de entidade completa
interface EntityValidationProps {
  entity: string;
  data: any;
  companyId: string;
  className?: string;
  showSuccess?: boolean;
  compact?: boolean;
}

export function EntityValidation({
  entity,
  data,
  companyId,
  className = '',
  showSuccess = false,
  compact = false,
}: EntityValidationProps) {
  // Este componente seria usado com o hook useRHValidation
  // Por enquanto, retornamos null para evitar dependências circulares
  return null;
}

export default ValidationDisplay;
































































































