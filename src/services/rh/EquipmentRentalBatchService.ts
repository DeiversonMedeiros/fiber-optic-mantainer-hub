import { rhSupabase, financeiroSupabase } from '@/integrations/supabase/client';
import { EquipmentRentalAbsenceService, EquipmentRentalAbsenceCalculation } from './EquipmentRentalAbsenceService';

export interface BatchProcessOptions {
  createPayments?: boolean; // default true
  overrideExisting?: boolean; // se existir pagamento pendente do mesmo período/equipamento, substituir
  createdBy?: string;
  createApprovalsForManagers?: boolean; // cria registros em rh.equipment_rental_approvals
  createAccountsPayable?: boolean; // cria títulos em financeiro.accounts_payable
  accountsPayableMode?: 'per_employee' | 'single_total'; // padrão por colaborador
  accountsPayableDueDay?: number; // dia do vencimento (ex: 10)
}

export interface BatchProcessResult {
  period: string;
  targetPaymentMonth: string; // YYYY-MM
  processedCount: number;
  createdPayments: number;
  updatedPayments: number;
  skippedPayments: number;
  createdApprovals: number;
  createdAccountsPayable: number;
  calculations: EquipmentRentalAbsenceCalculation[];
}

export class EquipmentRentalBatchService {
  private companyId: string;
  private absenceService: EquipmentRentalAbsenceService;

  constructor(companyId: string) {
    this.companyId = companyId;
    this.absenceService = new EquipmentRentalAbsenceService(companyId);
  }

  async processPeriod(
    period: string,
    options: BatchProcessOptions = {}
  ): Promise<BatchProcessResult> {
    const {
      createPayments = true,
      overrideExisting = false,
      createdBy = 'system',
      createApprovalsForManagers = true,
      createAccountsPayable = true,
      accountsPayableMode = 'per_employee',
      accountsPayableDueDay = 10
    } = options;

    const calculations = await this.absenceService.calculateAbsenceDiscounts(period);
    const targetPayment = this.getNextMonthOf(period);

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let approvalsCreated = 0;
    let apCreated = 0;

    if (createPayments && calculations.length > 0) {
      const { data: existing, error: existingError } = await rhSupabase
        .from('rh.equipment_rental_payments')
        .select('id, equipment_rental_id, payment_month, payment_year, status')
        .eq('company_id', this.companyId)
        .eq('payment_month', targetPayment.monthStr)
        .eq('payment_year', targetPayment.year);

      if (existingError) throw existingError;
      const existingMap = new Map<string, any>();
      (existing || []).forEach(p => existingMap.set(p.equipment_rental_id, p));

      const inserts: any[] = [];
      const updates: Array<{ id: string; payload: any }> = [];

      for (const calc of calculations) {
        const payload = {
          company_id: this.companyId,
          equipment_rental_id: calc.equipment_rental_id,
          payment_month: targetPayment.monthStr,
          payment_year: targetPayment.year,
          amount: Number(calc.final_value || 0),
          status: 'pending' as const,
          notes: `Processado do período ${period}. Ausências: ${calc.total_absence_days}. Valor diário: ${calc.daily_value.toFixed(2)}.`,
          created_by: createdBy || undefined
        };

        const existingPayment = existingMap.get(calc.equipment_rental_id);
        if (existingPayment) {
          if (overrideExisting && existingPayment.status === 'pending') {
            updates.push({ id: existingPayment.id, payload });
          } else {
            skipped++;
          }
        } else {
          inserts.push(payload);
        }
      }

      if (inserts.length > 0) {
        const { error: insertError } = await rhSupabase
          .from('rh.equipment_rental_payments')
          .insert(inserts);
        if (insertError) throw insertError;
        created = inserts.length;
      }

      for (const up of updates) {
        const { error: updateError } = await rhSupabase
          .from('rh.equipment_rental_payments')
          .update(up.payload)
          .eq('id', up.id)
          .eq('company_id', this.companyId);
        if (updateError) throw updateError;
        updated++;
      }
    }

    // Aprovações para gestores (um registro por equipamento/funcionário)
    if (createApprovalsForManagers && calculations.length > 0) {
      // Buscar possíveis gestores dos colaboradores
      const uniqueEmployeeIds = Array.from(new Set(calculations.map(c => c.employee_id)));
      const { data: employees, error: empErr } = await rhSupabase
        .from('rh.employees')
        .select('id, nome, manager_id')
        .in('id', uniqueEmployeeIds);
      if (empErr) throw empErr;
      const empMap = new Map<string, any>();
      (employees || []).forEach(e => empMap.set(e.id, e));

      const approvalRows: any[] = [];
      for (const calc of calculations) {
        const emp = empMap.get(calc.employee_id);
        const gestorId = emp?.manager_id || null;
        if (!gestorId) continue; // sem gestor, pula
        approvalRows.push({
          company_id: this.companyId,
          employee_id: calc.employee_id,
          equipment_rental_id: calc.equipment_rental_id,
          mes_referencia: targetPayment.monthNum,
          ano_referencia: targetPayment.year,
          valor_aprovado: Number(calc.final_value || 0),
          status: 'pendente',
          aprovado_por: gestorId,
          observacoes: `Locação ${targetPayment.monthStr}/${targetPayment.year} processada do período ${period}`
        });
      }
      if (approvalRows.length > 0) {
        const { error: apprErr } = await rhSupabase
          .from('rh.equipment_rental_approvals')
          .insert(approvalRows);
        if (apprErr) throw apprErr;
        approvalsCreated = approvalRows.length;
      }
    }

    // Contas a pagar
    if (createAccountsPayable && calculations.length > 0) {
      if (accountsPayableMode === 'per_employee') {
        // Agregar por colaborador
        const totalsByEmployee = new Map<string, number>();
        for (const c of calculations) {
          totalsByEmployee.set(c.employee_id, (totalsByEmployee.get(c.employee_id) || 0) + Number(c.final_value || 0));
        }

        // Buscar nomes para descrição
        const uniqueEmployeeIds = Array.from(totalsByEmployee.keys());
        const { data: employees, error: empErr } = await rhSupabase
          .from('rh.employees')
          .select('id, nome')
          .in('id', uniqueEmployeeIds);
        if (empErr) throw empErr;
        const empNameMap = new Map<string, string>();
        (employees || []).forEach(e => empNameMap.set(e.id, e.nome));

        const dueDate = this.makeDueDate(targetPayment.year, targetPayment.monthNum, accountsPayableDueDay);
        const apRows = uniqueEmployeeIds.map((empId) => ({
          company_id: this.companyId,
          fornecedor_id: empId, // assumindo pagamento ao colaborador
          numero_documento: null,
          descricao: `Locação de equipamentos ${String(targetPayment.monthNum).padStart(2, '0')}/${targetPayment.year} - ${empNameMap.get(empId) || empId}`,
          valor: Number(totalsByEmployee.get(empId) || 0),
          data_vencimento: dueDate,
          data_pagamento: null,
          valor_pago: null,
          status: 'pendente',
          cost_center_id: null,
          project_id: null,
          classe_financeira: 'LOCAÇÃO_EQUIPAMENTOS'
        }));

        if (apRows.length > 0) {
          const { error: apErr } = await financeiroSupabase
            .from('financeiro.accounts_payable')
            .insert(apRows);
          if (apErr) throw apErr;
          apCreated = apRows.length;
        }
      } else {
        // single_total
        const total = calculations.reduce((s, c) => s + Number(c.final_value || 0), 0);
        const dueDate = this.makeDueDate(targetPayment.year, targetPayment.monthNum, accountsPayableDueDay);
        const row = {
          company_id: this.companyId,
          fornecedor_id: null,
          numero_documento: null,
          descricao: `Locação de equipamentos ${String(targetPayment.monthNum).padStart(2, '0')}/${targetPayment.year}`,
          valor: Number(total),
          data_vencimento: dueDate,
          data_pagamento: null,
          valor_pago: null,
          status: 'pendente',
          cost_center_id: null,
          project_id: null,
          classe_financeira: 'LOCAÇÃO_EQUIPAMENTOS'
        };
        const { error: apErr } = await financeiroSupabase
          .from('financeiro.accounts_payable')
          .insert([row]);
        if (apErr) throw apErr;
        apCreated = 1;
      }
    }

    return {
      period,
      targetPaymentMonth: `${targetPayment.year}-${String(targetPayment.monthNum).padStart(2, '0')}`,
      processedCount: calculations.length,
      createdPayments: created,
      updatedPayments: updated,
      skippedPayments: skipped,
      createdApprovals: approvalsCreated,
      createdAccountsPayable: apCreated,
      calculations
    };
  }

  private getNextMonthOf(period: string): { year: number; monthNum: number; monthStr: string } {
    const [y, m] = period.split('-').map(Number);
    let year = y;
    let month = m + 1;
    if (month > 12) {
      month = 1;
      year = y + 1;
    }
    const monthStr = `${String(month).padStart(2, '0')}`;
    return { year, monthNum: month, monthStr };
  }

  private makeDueDate(year: number, month: number, day: number): string {
    const dt = new Date(Date.UTC(year, month - 1, Math.min(day, 28)));
    return dt.toISOString().split('T')[0];
  }
}
