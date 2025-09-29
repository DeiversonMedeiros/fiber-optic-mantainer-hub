import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Trash2, CreditCard } from 'lucide-react';
import { EmployeeBankAccount, EmployeeBankAccountInsert, EmployeeBankAccountUpdate } from '@/integrations/supabase/rh-types';

// Schema de validação
const bankAccountSchema = z.object({
  banco_codigo: z.string().optional(),
  banco_nome: z.string().optional(),
  agencia_numero: z.string().optional(),
  agencia_digito: z.string().optional(),
  conta_numero: z.string().optional(),
  conta_digito: z.string().optional(),
  tipo_conta: z.string().optional(),
  titular_nome: z.string().optional(),
  titular_cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos').optional().or(z.literal('')),
  conta_principal: z.boolean().optional(),
});

type BankAccountFormData = z.infer<typeof bankAccountSchema>;

export interface EmployeeBankAccountsProps {
  employeeId: string;
  bankAccounts?: EmployeeBankAccount[];
  onSubmit: (data: EmployeeBankAccountInsert | EmployeeBankAccountUpdate) => Promise<void>;
  onDelete?: (accountId: string) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export function EmployeeBankAccounts({
  employeeId,
  bankAccounts = [],
  onSubmit,
  onDelete,
  loading = false,
  className = '',
}: EmployeeBankAccountsProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
  } = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      banco_codigo: '',
      banco_nome: '',
      agencia_numero: '',
      agencia_digito: '',
      conta_numero: '',
      conta_digito: '',
      tipo_conta: '',
      titular_nome: '',
      titular_cpf: '',
      conta_principal: false,
    },
  });

  const handleFormSubmit = async (data: BankAccountFormData) => {
    try {
      const accountData: EmployeeBankAccountInsert = {
        employee_id: employeeId,
        company_id: '', // Será preenchido pelo hook
        ...data,
      };
      await onSubmit(accountData);
      reset();
    } catch (error) {
      console.error('Erro ao salvar dados bancários:', error);
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setValue('titular_cpf', formatted.replace(/\D/g, ''));
  };

  const bancoOptions = [
    { codigo: '001', nome: 'Banco do Brasil' },
    { codigo: '033', nome: 'Santander' },
    { codigo: '104', nome: 'Caixa Econômica Federal' },
    { codigo: '237', nome: 'Bradesco' },
    { codigo: '341', nome: 'Itaú Unibanco' },
    { codigo: '356', nome: 'Banco Real' },
    { codigo: '422', nome: 'Banco Safra' },
    { codigo: '748', nome: 'Sicredi' },
    { codigo: '756', nome: 'Sicoob' },
    { codigo: '260', nome: 'Nu Pagamentos' },
  ];

  const tipoContaOptions = [
    { value: 'corrente', label: 'Conta Corrente' },
    { value: 'poupanca', label: 'Conta Poupança' },
    { value: 'salario', label: 'Conta Salário' },
    { value: 'poupanca_corrente', label: 'Poupança + Corrente' },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Dados Bancários
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Informações do Banco */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Informações do Banco</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="banco_codigo">Código do Banco</Label>
                <Select
                  value={watch('banco_codigo')}
                  onValueChange={(value) => {
                    setValue('banco_codigo', value);
                    const banco = bancoOptions.find(b => b.codigo === value);
                    if (banco) {
                      setValue('banco_nome', banco.nome);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {bancoOptions.map((banco) => (
                      <SelectItem key={banco.codigo} value={banco.codigo}>
                        {banco.codigo} - {banco.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="banco_nome">Nome do Banco</Label>
                <Input
                  id="banco_nome"
                  {...register('banco_nome')}
                  placeholder="Nome do banco"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Informações da Agência */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Informações da Agência</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agencia_numero">Número da Agência</Label>
                <Input
                  id="agencia_numero"
                  {...register('agencia_numero')}
                  placeholder="0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agencia_digito">Dígito da Agência</Label>
                <Input
                  id="agencia_digito"
                  {...register('agencia_digito')}
                  placeholder="0"
                  maxLength={1}
                />
              </div>
            </div>
          </div>

          {/* Informações da Conta */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Informações da Conta</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="conta_numero">Número da Conta</Label>
                <Input
                  id="conta_numero"
                  {...register('conta_numero')}
                  placeholder="00000000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conta_digito">Dígito da Conta</Label>
                <Input
                  id="conta_digito"
                  {...register('conta_digito')}
                  placeholder="0"
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_conta">Tipo de Conta</Label>
                <Select
                  value={watch('tipo_conta')}
                  onValueChange={(value) => setValue('tipo_conta', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoContaOptions.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Informações do Titular */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Informações do Titular</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="titular_nome">Nome do Titular</Label>
                <Input
                  id="titular_nome"
                  {...register('titular_nome')}
                  placeholder="Nome completo do titular"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="titular_cpf">CPF do Titular</Label>
                <Input
                  id="titular_cpf"
                  value={watch('titular_cpf')}
                  onChange={handleCPFChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={errors.titular_cpf ? 'border-destructive' : ''}
                />
                {errors.titular_cpf && (
                  <p className="text-sm text-destructive">{errors.titular_cpf.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="conta_principal"
                checked={watch('conta_principal')}
                onCheckedChange={(checked) => setValue('conta_principal', checked as boolean)}
              />
              <Label htmlFor="conta_principal" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Conta principal para pagamentos
              </Label>
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button
              type="submit"
              disabled={!isValid || loading}
              className="min-w-[100px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Conta'
              )}
            </Button>
          </div>
        </form>

        {/* Lista de Contas Existentes */}
        {bankAccounts.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Contas Cadastradas</h3>
            <div className="space-y-2">
              {bankAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {account.banco_nome || account.banco_codigo || 'Banco não informado'}
                      {account.conta_principal && (
                        <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                          Principal
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ag: {account.agencia_numero || 'N/A'}
                      {account.agencia_digito && `-${account.agencia_digito}`}
                      {' | '}
                      Conta: {account.conta_numero || 'N/A'}
                      {account.conta_digito && `-${account.conta_digito}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {account.titular_nome && `Titular: ${account.titular_nome}`}
                      {account.titular_cpf && 
                        ` | CPF: ${account.titular_cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}`
                      }
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      Tipo: {account.tipo_conta || 'Não informado'}
                    </p>
                  </div>
                  {onDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(account.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}




