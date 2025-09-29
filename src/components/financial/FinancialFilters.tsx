import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';

interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number';
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface FinancialFiltersProps {
  fields: FilterField[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onClear: () => void;
  onSearch?: () => void;
  loading?: boolean;
}

export function FinancialFilters({
  fields,
  values,
  onChange,
  onClear,
  onSearch,
  loading = false,
}: FinancialFiltersProps) {
  const hasActiveFilters = Object.values(values).some(value => 
    value !== '' && value !== null && value !== undefined
  );

  const renderField = (field: FilterField) => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            placeholder={field.placeholder || `Digite ${field.label.toLowerCase()}...`}
            value={values[field.key] || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            disabled={loading}
          />
        );

      case 'select':
        return (
          <Select
            value={values[field.key] || ''}
            onValueChange={(value) => onChange(field.key, value || undefined)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || `Selecione ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={values[field.key] || ''}
            onChange={(e) => onChange(field.key, e.target.value || undefined)}
            disabled={loading}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder || `Digite ${field.label.toLowerCase()}...`}
            value={values[field.key] || ''}
            onChange={(e) => onChange(field.key, e.target.value ? parseFloat(e.target.value) : undefined)}
            disabled={loading}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filtros
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="ml-auto"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              {renderField(field)}
            </div>
          ))}
        </div>
        {onSearch && (
          <div className="flex justify-end mt-4">
            <Button onClick={onSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



