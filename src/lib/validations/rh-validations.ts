import { z } from 'zod';
import { format, parseISO, isValid, isFuture, isPast, differenceInDays, differenceInYears } from 'date-fns';

// ===== VALIDAÇÕES COMUNS =====

// Validação de CPF
export const cpfSchema = z.string()
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato XXX.XXX.XXX-XX')
  .refine((cpf) => {
    // Remove caracteres não numéricos
    const cleanCpf = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cleanCpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    return parseInt(cleanCpf.charAt(9)) === digit1 && parseInt(cleanCpf.charAt(10)) === digit2;
  }, 'CPF inválido');

// Validação de RG
export const rgSchema = z.string()
  .min(8, 'RG deve ter pelo menos 8 caracteres')
  .max(15, 'RG deve ter no máximo 15 caracteres');

// Validação de data de nascimento
export const birthDateSchema = z.string()
  .refine((date) => {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) return false;
    
    const today = new Date();
    const age = differenceInYears(today, parsedDate);
    
    // Funcionário deve ter entre 14 e 100 anos
    return age >= 14 && age <= 100;
  }, 'Data de nascimento inválida. Funcionário deve ter entre 14 e 100 anos');

// Validação de data de admissão
export const admissionDateSchema = z.string()
  .refine((date) => {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) return false;
    
    const today = new Date();
    return !isFuture(parsedDate) && differenceInDays(today, parsedDate) <= 36500; // Máximo 100 anos atrás
  }, 'Data de admissão inválida');

// Validação de salário
export const salarySchema = z.number()
  .min(0, 'Salário deve ser maior ou igual a 0')
  .max(1000000, 'Salário não pode exceder R$ 1.000.000');

// Validação de faixa salarial
export const salaryRangeSchema = z.object({
  min: salarySchema,
  max: salarySchema
}).refine((data) => data.min <= data.max, {
  message: 'Salário mínimo deve ser menor ou igual ao salário máximo',
  path: ['max']
});

// ===== VALIDAÇÕES DE FUNCIONÁRIOS =====

export const employeeValidationSchema = z.object({
  nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  
  cpf: cpfSchema.optional().or(z.literal('')),
  
  rg: rgSchema.optional().or(z.literal('')),
  
  data_nascimento: birthDateSchema.optional().or(z.literal('')),
  
  data_admissao: admissionDateSchema.optional().or(z.literal('')),
  
  data_demissao: z.string().optional().or(z.literal('')).refine((date) => {
    if (!date) return true;
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) return false;
    
    const today = new Date();
    return !isFuture(parsedDate);
  }, 'Data de demissão não pode ser futura'),
  
  status: z.enum(['ativo', 'inativo', 'demitido', 'aposentado', 'licenca']),
  
  matricula: z.string()
    .min(3, 'Matrícula deve ter pelo menos 3 caracteres')
    .max(20, 'Matrícula deve ter no máximo 20 caracteres')
    .regex(/^[A-Z0-9]+$/, 'Matrícula deve conter apenas letras maiúsculas e números')
    .optional()
    .or(z.literal('')),
  
  company_id: z.string().min(1, 'Empresa é obrigatória'),
  
  cost_center_id: z.string().optional().or(z.literal('')),
  project_id: z.string().optional().or(z.literal('')),
});

// Regras de negócio para funcionários
export const employeeBusinessRules = {
  // Verificar se CPF já existe na empresa
  async validateUniqueCPF(cpf: string, companyId: string, excludeId?: string) {
    // Esta validação seria implementada no backend
    return true;
  },
  
  // Verificar se matrícula já existe na empresa
  async validateUniqueMatricula(matricula: string, companyId: string, excludeId?: string) {
    // Esta validação seria implementada no backend
    return true;
  },
  
  // Verificar se funcionário pode ser demitido
  canBeTerminated(employee: any) {
    return employee.status === 'ativo';
  },
  
  // Verificar se funcionário pode ser reativado
  canBeReactivated(employee: any) {
    return ['inativo', 'demitido'].includes(employee.status);
  },
  
  // Calcular tempo de empresa
  calculateCompanyTime(admissionDate: string) {
    const admission = parseISO(admissionDate);
    const today = new Date();
    return differenceInYears(today, admission);
  }
};

// ===== VALIDAÇÕES DE CARGOS =====

export const positionValidationSchema = z.object({
  codigo: z.string()
    .min(2, 'Código deve ter pelo menos 2 caracteres')
    .max(10, 'Código deve ter no máximo 10 caracteres')
    .regex(/^[A-Z0-9]+$/, 'Código deve conter apenas letras maiúsculas e números'),
  
  nome: z.string()
    .min(3, 'Nome do cargo deve ter pelo menos 3 caracteres')
    .max(100, 'Nome do cargo deve ter no máximo 100 caracteres'),
  
  descricao: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
  
  nivel_hierarquico: z.number()
    .min(1, 'Nível hierárquico deve ser maior que 0')
    .max(20, 'Nível hierárquico não pode exceder 20'),
  
  is_active: z.boolean(),
  
  company_id: z.string().min(1, 'Empresa é obrigatória'),
});

// Regras de negócio para cargos
export const positionBusinessRules = {
  // Verificar se código já existe na empresa
  async validateUniqueCode(codigo: string, companyId: string, excludeId?: string) {
    // Esta validação seria implementada no backend
    return true;
  },
  
  // Verificar se cargo pode ser desativado
  canBeDeactivated(position: any, employeeCount: number) {
    return employeeCount === 0;
  },
  
  // Verificar se nível hierárquico é válido
  isValidHierarchyLevel(level: number, existingLevels: number[]) {
    return !existingLevels.includes(level);
  }
};

// ===== VALIDAÇÕES DE FÉRIAS =====

export const vacationValidationSchema = z.object({
  employee_id: z.string().min(1, 'Funcionário é obrigatório'),
  
  ano: z.number()
    .min(new Date().getFullYear() - 5, 'Ano não pode ser muito antigo')
    .max(new Date().getFullYear() + 1, 'Ano não pode ser muito futuro'),
  
  data_inicio: z.string().refine((date) => {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) return false;
    
    const today = new Date();
    return !isPast(parsedDate) || differenceInDays(today, parsedDate) <= 30;
  }, 'Data de início deve ser futura ou no máximo 30 dias atrás'),
  
  data_fim: z.string().refine((date) => {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) return false;
    
    const today = new Date();
    return !isPast(parsedDate);
  }, 'Data de fim deve ser futura'),
  
  tipo: z.enum(['ferias', 'ferias_antecipadas', 'ferias_compensadas', 'abono_pecuniario']),
  
  status: z.enum(['pendente', 'aprovado', 'rejeitado', 'em_andamento', 'concluido', 'cancelado']),
  
  company_id: z.string().min(1, 'Empresa é obrigatória'),
  
  observacoes: z.string().max(500, 'Observações devem ter no máximo 500 caracteres').optional(),
});

// Regras de negócio para férias
export const vacationBusinessRules = {
  // Verificar se funcionário tem direito a férias
  canTakeVacation(employee: any, year: number) {
    if (employee.status !== 'ativo') return false;
    
    const admissionDate = parseISO(employee.data_admissao);
    const vacationYear = new Date(year, 0, 1);
    
    // Funcionário deve estar na empresa há pelo menos 12 meses
    return differenceInDays(vacationYear, admissionDate) >= 365;
  },
  
  // Verificar se período de férias é válido
  isValidVacationPeriod(startDate: string, endDate: string) {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    if (!isValid(start) || !isValid(end)) return false;
    
    const duration = differenceInDays(end, start) + 1;
    
    // Férias devem ter entre 5 e 30 dias
    return duration >= 5 && duration <= 30;
  },
  
  // Verificar se não há sobreposição com outras férias
  hasOverlap(existingVacations: any[], newStartDate: string, newEndDate: string, excludeId?: string) {
    const newStart = parseISO(newStartDate);
    const newEnd = parseISO(newEndDate);
    
    return existingVacations.some(vacation => {
      if (excludeId && vacation.id === excludeId) return false;
      
      const existingStart = parseISO(vacation.data_inicio);
      const existingEnd = parseISO(vacation.data_fim);
      
      return (
        (newStart <= existingEnd && newEnd >= existingStart) ||
        (existingStart <= newEnd && existingEnd >= newStart)
      );
    });
  }
};

// ===== VALIDAÇÕES DE FOLHA DE PAGAMENTO =====

export const payrollValidationSchema = z.object({
  employee_id: z.string().min(1, 'Funcionário é obrigatório'),
  
  competencia: z.string().regex(/^\d{4}-\d{2}$/, 'Competência deve estar no formato YYYY-MM'),
  
  salario_base: salarySchema,
  
  horas_trabalhadas: z.number()
    .min(0, 'Horas trabalhadas devem ser maiores ou iguais a 0')
    .max(300, 'Horas trabalhadas não podem exceder 300'),
  
  horas_extras: z.number()
    .min(0, 'Horas extras devem ser maiores ou iguais a 0')
    .max(100, 'Horas extras não podem exceder 100'),
  
  status: z.enum(['rascunho', 'processando', 'aprovado', 'pago', 'cancelado']),
  
  company_id: z.string().min(1, 'Empresa é obrigatória'),
  
  observacoes: z.string().max(500, 'Observações devem ter no máximo 500 caracteres').optional(),
});

// Regras de negócio para folha de pagamento
export const payrollBusinessRules = {
  // Verificar se competência já foi processada
  async isCompetenciaProcessed(employeeId: string, competencia: string, companyId: string) {
    // Esta validação seria implementada no backend
    return false;
  },
  
  // Verificar se funcionário está ativo na competência
  isEmployeeActiveInPeriod(employee: any, competencia: string) {
    const [year, month] = competencia.split('-').map(Number);
    const periodDate = new Date(year, month - 1, 1);
    
    const admissionDate = parseISO(employee.data_admissao);
    const terminationDate = employee.data_demissao ? parseISO(employee.data_demissao) : null;
    
    if (periodDate < admissionDate) return false;
    if (terminationDate && periodDate > terminationDate) return false;
    
    return true;
  },
  
  // Calcular valor das horas extras
  calculateOvertimeValue(baseSalary: number, overtimeHours: number, overtimeRate: number = 1.5) {
    const hourlyRate = baseSalary / 220; // 220 horas por mês
    return overtimeHours * hourlyRate * overtimeRate;
  }
};

// ===== VALIDAÇÕES DE ATESTADOS MÉDICOS =====

export const medicalCertificateValidationSchema = z.object({
  employee_id: z.string().min(1, 'Funcionário é obrigatório'),
  
  data_inicio: z.string().refine((date) => {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) return false;
    
    const today = new Date();
    return !isFuture(parsedDate) && differenceInDays(today, parsedDate) <= 365;
  }, 'Data de início deve ser passada e não pode exceder 1 ano'),
  
  data_fim: z.string().refine((date) => {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) return false;
    
    const today = new Date();
    return !isFuture(parsedDate);
  }, 'Data de fim deve ser passada'),
  
  tipo: z.enum(['doenca', 'acidente_trabalho', 'maternidade', 'outros']),
  
  cid: z.string()
    .regex(/^[A-Z]\d{2}$/, 'CID deve estar no formato X99')
    .optional()
    .or(z.literal('')),
  
  status: z.enum(['pendente', 'aprovado', 'rejeitado', 'cancelado']),
  
  company_id: z.string().min(1, 'Empresa é obrigatória'),
  
  observacoes: z.string().max(500, 'Observações devem ter no máximo 500 caracteres').optional(),
});

// Regras de negócio para atestados médicos
export const medicalCertificateBusinessRules = {
  // Verificar se período é válido
  isValidPeriod(startDate: string, endDate: string) {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    if (!isValid(start) || !isValid(end)) return false;
    
    return start <= end;
  },
  
  // Verificar se não há sobreposição com outros atestados
  hasOverlap(existingCertificates: any[], newStartDate: string, newEndDate: string, excludeId?: string) {
    const newStart = parseISO(newStartDate);
    const newEnd = parseISO(newEndDate);
    
    return existingCertificates.some(certificate => {
      if (excludeId && certificate.id === excludeId) return false;
      
      const existingStart = parseISO(certificate.data_inicio);
      const existingEnd = parseISO(certificate.data_fim);
      
      return (
        (newStart <= existingEnd && newEnd >= existingStart) ||
        (existingStart <= newEnd && existingEnd >= newStart)
      );
    });
  },
  
  // Calcular duração do atestado
  calculateDuration(startDate: string, endDate: string) {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    return differenceInDays(end, start) + 1;
  }
};

// ===== VALIDAÇÕES DE TREINAMENTO =====

export const trainingValidationSchema = z.object({
  titulo: z.string()
    .min(5, 'Título deve ter pelo menos 5 caracteres')
    .max(200, 'Título deve ter no máximo 200 caracteres'),
  
  descricao: z.string()
    .min(10, 'Descrição deve ter pelo menos 10 caracteres')
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres'),
  
  tipo_treinamento: z.enum(['obrigatorio', 'opcional', 'desenvolvimento', 'compliance', 'seguranca']),
  
  categoria: z.enum(['tecnico', 'soft_skills', 'gestao', 'compliance', 'seguranca_trabalho']),
  
  modalidade: z.enum(['presencial', 'online', 'hibrido', 'e-learning']),
  
  duracao_horas: z.number()
    .min(1, 'Duração deve ser maior que 0')
    .max(200, 'Duração não pode exceder 200 horas'),
  
  data_inicio: z.string().refine((date) => {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) return false;
    
    const today = new Date();
    return !isPast(parsedDate) || differenceInDays(today, parsedDate) <= 7;
  }, 'Data de início deve ser futura ou no máximo 7 dias atrás'),
  
  data_fim: z.string().optional().refine((date) => {
    if (!date) return true;
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) return false;
    
    const today = new Date();
    return !isPast(parsedDate);
  }, 'Data de fim deve ser futura'),
  
  max_participantes: z.number()
    .min(1, 'Máximo de participantes deve ser maior que 0')
    .max(1000, 'Máximo de participantes não pode exceder 1000'),
  
  custo_por_participante: z.number()
    .min(0, 'Custo por participante deve ser maior ou igual a 0')
    .max(10000, 'Custo por participante não pode exceder R$ 10.000'),
  
  company_id: z.string().min(1, 'Empresa é obrigatória'),
});

// Regras de negócio para treinamento
export const trainingBusinessRules = {
  // Verificar se período é válido
  isValidPeriod(startDate: string, endDate?: string) {
    const start = parseISO(startDate);
    if (!isValid(start)) return false;
    
    if (endDate) {
      const end = parseISO(endDate);
      if (!isValid(end)) return false;
      
      return start <= end;
    }
    
    return true;
  },
  
  // Verificar se local é obrigatório para treinamentos presenciais
  isLocationRequired(modalidade: string, local?: string) {
    if (modalidade === 'presencial' && !local) return false;
    return true;
  },
  
  // Verificar se instrutor é obrigatório para treinamentos presenciais
  isInstructorRequired(modalidade: string, instrutor?: string) {
    if (modalidade === 'presencial' && !instrutor) return false;
    return true;
  }
};

// ===== VALIDAÇÕES DE BANCO DE HORAS =====

export const timeBankValidationSchema = z.object({
  employee_id: z.string().min(1, 'Funcionário é obrigatório'),
  
  tipo: z.enum(['credito', 'debito']),
  
  quantidade: z.number()
    .min(0.5, 'Quantidade deve ser maior que 0.5 horas')
    .max(12, 'Quantidade não pode exceder 12 horas por registro'),
  
  data_registro: z.string().refine((date) => {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) return false;
    
    const today = new Date();
    // Permite registros de até 90 dias atrás
    return !isFuture(parsedDate) && differenceInDays(today, parsedDate) <= 90;
  }, 'Data de registro deve ser passada e não pode exceder 90 dias'),
  
  justificativa: z.string()
    .min(10, 'Justificativa deve ter pelo menos 10 caracteres')
    .max(500, 'Justificativa deve ter no máximo 500 caracteres'),
  
  time_record_id: z.string().optional(),
  
  company_id: z.string().min(1, 'Empresa é obrigatória'),
});

// Regras de negócio para banco de horas
export const timeBankBusinessRules = {
  // Verificar saldo do banco de horas
  calculateBalance(timeBankRecords: any[]) {
    return timeBankRecords.reduce((balance, record) => {
      return record.tipo === 'credito' 
        ? balance + record.quantidade 
        : balance - record.quantidade;
    }, 0);
  },
  
  // Verificar se funcionário pode ter débito
  canHaveDebit(currentBalance: number, debitAmount: number, maxDebit: number = 40) {
    const newBalance = currentBalance - debitAmount;
    return newBalance >= -maxDebit;
  },
  
  // Verificar se funcionário pode ter crédito
  canHaveCredit(currentBalance: number, creditAmount: number, maxCredit: number = 120) {
    const newBalance = currentBalance + creditAmount;
    return newBalance <= maxCredit;
  },
};

// ===== VALIDAÇÕES DE SOLICITAÇÕES DE COMPENSAÇÃO =====

export const compensationRequestValidationSchema = z.object({
  employee_id: z.string().min(1, 'Funcionário é obrigatório'),
  
  data_solicitacao: z.string().refine((date) => {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) return false;
    
    const today = new Date();
    return !isFuture(parsedDate) && differenceInDays(today, parsedDate) <= 30;
  }, 'Data de solicitação deve ser atual ou até 30 dias atrás'),
  
  data_compensacao: z.string().refine((date) => {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) return false;
    
    const today = new Date();
    // Compensação deve ser futura ou no máximo 7 dias atrás
    return differenceInDays(today, parsedDate) >= -7;
  }, 'Data de compensação deve ser futura ou no máximo 7 dias atrás'),
  
  quantidade_horas: z.number()
    .min(0.5, 'Quantidade deve ser maior que 0.5 horas')
    .max(8, 'Quantidade não pode exceder 8 horas'),
  
  justificativa: z.string()
    .min(20, 'Justificativa deve ter pelo menos 20 caracteres')
    .max(500, 'Justificativa deve ter no máximo 500 caracteres'),
  
  status: z.enum(['pendente', 'aprovado', 'rejeitado', 'realizado']),
  
  company_id: z.string().min(1, 'Empresa é obrigatória'),
});

// Regras de negócio para solicitações de compensação
export const compensationRequestBusinessRules = {
  // Verificar se período de compensação é válido
  isValidCompensationPeriod(requestDate: string, compensationDate: string) {
    const request = parseISO(requestDate);
    const compensation = parseISO(compensationDate);
    
    if (!isValid(request) || !isValid(compensation)) return false;
    
    // Compensação deve ser no máximo 60 dias após a solicitação
    return differenceInDays(compensation, request) <= 60;
  },
  
  // Verificar se funcionário tem saldo suficiente no banco de horas
  hasSufficientBalance(timeBankBalance: number, requestedHours: number) {
    return timeBankBalance >= requestedHours;
  },
  
  // Verificar se não há sobreposição com outras compensações
  hasOverlap(existingRequests: any[], newCompensationDate: string, excludeId?: string) {
    const newDate = parseISO(newCompensationDate);
    
    return existingRequests.some(request => {
      if (excludeId && request.id === excludeId) return false;
      if (request.status !== 'aprovado') return false;
      
      const existingDate = parseISO(request.data_compensacao);
      
      // Verifica se é o mesmo dia
      return (
        newDate.getFullYear() === existingDate.getFullYear() &&
        newDate.getMonth() === existingDate.getMonth() &&
        newDate.getDate() === existingDate.getDate()
      );
    });
  }
};

// ===== VALIDAÇÕES DE EXAMES PERIÓDICOS =====

export const periodicExamValidationSchema = z.object({
  employee_id: z.string().min(1, 'Funcionário é obrigatório'),
  
  tipo_exame: z.enum(['admissional', 'periodico', 'retorno_ao_trabalho', 'mudanca_de_funcao', 'demissional']),
  
  data_exame: z.string().refine((date) => {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) return false;
    
    const today = new Date();
    // Permite exames de até 30 dias atrás ou futuro
    return differenceInDays(today, parsedDate) >= -365 && differenceInDays(parsedDate, today) >= -30;
  }, 'Data do exame deve ser entre 30 dias atrás e 1 ano no futuro'),
  
  data_agendamento: z.string().optional().refine((date) => {
    if (!date) return true;
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) return false;
    
    const today = new Date();
    return !isPast(parsedDate) || differenceInDays(today, parsedDate) <= 7;
  }, 'Data de agendamento deve ser futura ou no máximo 7 dias atrás'),
  
  resultado: z.enum(['apto', 'inapto', 'apto_com_restricoes']).optional(),
  
  medico_responsavel: z.string()
    .min(5, 'Nome do médico deve ter pelo menos 5 caracteres')
    .max(100, 'Nome do médico deve ter no máximo 100 caracteres')
    .optional(),
  
  observacoes: z.string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional(),
  
  status: z.enum(['agendado', 'realizado', 'cancelado']),
  
  company_id: z.string().min(1, 'Empresa é obrigatória'),
});

// Regras de negócio para exames periódicos
export const periodicExamBusinessRules = {
  // Verificar se funcionário precisa de exame periódico
  needsPeriodicExam(employee: any, lastExamDate?: string) {
    if (employee.status !== 'ativo') return false;
    
    if (!lastExamDate) return true;
    
    const lastExam = parseISO(lastExamDate);
    const today = new Date();
    
    // Exame periódico deve ser feito a cada 12 meses
    return differenceInDays(today, lastExam) >= 365;
  },
  
  // Verificar se tipo de exame é apropriado para a situação
  isAppropriateExamType(examType: string, employee: any, situation: string) {
    switch (situation) {
      case 'admission':
        return examType === 'admissional';
      case 'periodic':
        return examType === 'periodico';
      case 'return_to_work':
        return examType === 'retorno_ao_trabalho';
      case 'job_change':
        return examType === 'mudanca_de_funcao';
      case 'termination':
        return examType === 'demissional';
      default:
        return true;
    }
  },
  
  // Verificar se resultado requer ação
  requiresAction(resultado: string) {
    return ['inapto', 'apto_com_restricoes'].includes(resultado);
  },
  
  // Calcular próxima data de exame
  calculateNextExamDate(currentExamDate: string, examType: string) {
    const currentDate = parseISO(currentExamDate);
    
    switch (examType) {
      case 'periodico':
        // Próximo exame em 12 meses
        return new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), currentDate.getDate());
      case 'retorno_ao_trabalho':
        // Próximo exame em 6 meses
        return new Date(currentDate.getFullYear(), currentDate.getMonth() + 6, currentDate.getDate());
      default:
        return null;
    }
  }
};

// ===== VALIDAÇÕES DE RECRUTAMENTO =====

export const recruitmentValidationSchema = z.object({
  position_id: z.string().min(1, 'Cargo é obrigatório'),
  
  titulo: z.string()
    .min(10, 'Título deve ter pelo menos 10 caracteres')
    .max(200, 'Título deve ter no máximo 200 caracteres'),
  
  descricao: z.string()
    .min(20, 'Descrição deve ter pelo menos 20 caracteres')
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres'),
  
  requisitos: z.string()
    .min(10, 'Requisitos devem ter pelo menos 10 caracteres')
    .max(500, 'Requisitos devem ter no máximo 500 caracteres'),
  
  salario_min: salarySchema,
  
  salario_max: salarySchema,
  
  tipo_contrato: z.enum(['clt', 'pj', 'estagio', 'temporario']),
  
  local_trabalho: z.string()
    .min(3, 'Local de trabalho deve ter pelo menos 3 caracteres')
    .max(100, 'Local de trabalho deve ter no máximo 100 caracteres'),
  
  data_abertura: z.string().refine((date) => {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) return false;
    
    const today = new Date();
    return !isFuture(parsedDate);
  }, 'Data de abertura deve ser passada ou atual'),
  
  data_fechamento: z.string().optional().refine((date) => {
    if (!date) return true;
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) return false;
    
    const today = new Date();
    return !isPast(parsedDate);
  }, 'Data de fechamento deve ser futura'),
  
  vagas_disponiveis: z.number()
    .min(1, 'Vagas disponíveis deve ser maior que 0')
    .max(100, 'Vagas disponíveis não pode exceder 100'),
  
  company_id: z.string().min(1, 'Empresa é obrigatória'),
});

// Regras de negócio para recrutamento
export const recruitmentBusinessRules = {
  // Verificar se faixa salarial é válida
  isValidSalaryRange(min: number, max: number) {
    return min <= max;
  },
  
  // Verificar se período de abertura é válido
  isValidOpeningPeriod(startDate: string, endDate?: string) {
    const start = parseISO(startDate);
    if (!isValid(start)) return false;
    
    if (endDate) {
      const end = parseISO(endDate);
      if (!isValid(end)) return false;
      
      return start < end;
    }
    
    return true;
  },
  
  // Verificar se vaga pode ser fechada
  canCloseVacancy(recruitment: any) {
    return recruitment.status === 'aberta' || recruitment.status === 'em_andamento';
  },
  
  // Verificar se vaga pode ser reaberta
  canReopenVacancy(recruitment: any) {
    return recruitment.status === 'fechada';
  }
};

// ===== FUNÇÕES DE VALIDAÇÃO GLOBAL =====

export const validateRHData = {
  // Validar funcionário
  employee: (data: any) => employeeValidationSchema.parse(data),
  
  // Validar cargo
  position: (data: any) => positionValidationSchema.parse(data),
  
  // Validar férias
  vacation: (data: any) => vacationValidationSchema.parse(data),
  
  // Validar folha de pagamento
  payroll: (data: any) => payrollValidationSchema.parse(data),
  
  // Validar atestado médico
  medicalCertificate: (data: any) => medicalCertificateValidationSchema.parse(data),
  
  // Validar treinamento
  training: (data: any) => trainingValidationSchema.parse(data),
  
  // Validar recrutamento
  recruitment: (data: any) => recruitmentValidationSchema.parse(data),
  
  // Validar banco de horas
  timeBank: (data: any) => timeBankValidationSchema.parse(data),
  
  // Validar solicitação de compensação
  compensationRequest: (data: any) => compensationRequestValidationSchema.parse(data),
  
  // Validar exame periódico
  periodicExam: (data: any) => periodicExamValidationSchema.parse(data),
};

// ===== MENSAGENS DE ERRO PERSONALIZADAS =====

export const rhValidationMessages = {
  employee: {
    cpf_invalid: 'CPF informado não é válido',
    cpf_duplicate: 'CPF já cadastrado na empresa',
    matricula_duplicate: 'Matrícula já existe na empresa',
    admission_future: 'Data de admissão não pode ser futura',
    termination_before_admission: 'Data de demissão não pode ser anterior à admissão',
    underage: 'Funcionário deve ter pelo menos 14 anos',
    too_old: 'Funcionário não pode ter mais de 100 anos',
  },
  
  position: {
    code_duplicate: 'Código do cargo já existe na empresa',
    hierarchy_conflict: 'Nível hierárquico já está em uso',
    cannot_deactivate: 'Cargo não pode ser desativado pois possui funcionários ativos',
  },
  
  vacation: {
    employee_inactive: 'Funcionário deve estar ativo para solicitar férias',
    insufficient_time: 'Funcionário deve estar na empresa há pelo menos 12 meses',
    period_invalid: 'Período de férias deve ter entre 5 e 30 dias',
    overlap_exists: 'Período de férias sobrepõe a outras férias aprovadas',
    start_date_past: 'Data de início deve ser futura',
    end_date_past: 'Data de fim deve ser futura',
  },
  
  payroll: {
    competencia_processed: 'Competência já foi processada para este funcionário',
    employee_inactive: 'Funcionário deve estar ativo na competência',
    hours_exceeded: 'Horas trabalhadas excedem o limite permitido',
    overtime_exceeded: 'Horas extras excedem o limite permitido',
  },
  
  medicalCertificate: {
    period_invalid: 'Período do atestado é inválido',
    overlap_exists: 'Período do atestado sobrepõe a outros atestados',
    start_date_future: 'Data de início não pode ser futura',
    end_date_future: 'Data de fim não pode ser futura',
    too_old: 'Atestado não pode ter mais de 1 ano',
  },
  
  training: {
    period_invalid: 'Período do treinamento é inválido',
    location_required: 'Local é obrigatório para treinamentos presenciais',
    instructor_required: 'Instrutor é obrigatório para treinamentos presenciais',
    start_date_past: 'Data de início deve ser futura',
    end_date_past: 'Data de fim deve ser futura',
  },
  
  recruitment: {
    salary_range_invalid: 'Faixa salarial inválida',
    period_invalid: 'Período de abertura da vaga é inválido',
    cannot_close: 'Vaga não pode ser fechada no momento',
    cannot_reopen: 'Vaga não pode ser reaberta',
  },
  
  timeBank: {
    quantity_invalid: 'Quantidade de horas deve estar entre 0.5 e 12 horas',
    date_too_old: 'Data de registro não pode ser superior a 90 dias',
    date_future: 'Data de registro não pode ser futura',
    balance_exceeded: 'Saldo do banco de horas excederia o limite permitido',
    insufficient_balance: 'Saldo insuficiente no banco de horas',
    justification_required: 'Justificativa é obrigatória e deve ter pelo menos 10 caracteres',
  },
  
  compensationRequest: {
    quantity_invalid: 'Quantidade de horas deve estar entre 0.5 e 8 horas',
    request_date_invalid: 'Data de solicitação deve ser atual ou até 30 dias atrás',
    compensation_date_invalid: 'Data de compensação deve ser futura ou no máximo 7 dias atrás',
    period_too_long: 'Compensação deve ser no máximo 60 dias após a solicitação',
    insufficient_balance: 'Saldo insuficiente no banco de horas para esta compensação',
    overlap_exists: 'Já existe compensação aprovada para esta data',
    justification_too_short: 'Justificativa deve ter pelo menos 20 caracteres',
  },
  
  periodicExam: {
    exam_date_invalid: 'Data do exame deve ser entre 30 dias atrás e 1 ano no futuro',
    scheduling_date_invalid: 'Data de agendamento deve ser futura ou no máximo 7 dias atrás',
    inappropriate_exam_type: 'Tipo de exame não é apropriado para a situação',
    result_requires_action: 'Resultado do exame requer ação específica',
    doctor_required: 'Nome do médico responsável é obrigatório',
    exam_not_needed: 'Funcionário não precisa de exame neste momento',
  },
};

export default {
  validateRHData,
  rhValidationMessages,
  employeeBusinessRules,
  positionBusinessRules,
  vacationBusinessRules,
  payrollBusinessRules,
  medicalCertificateBusinessRules,
  trainingBusinessRules,
  recruitmentBusinessRules,
  timeBankBusinessRules,
  compensationRequestBusinessRules,
  periodicExamBusinessRules,
};








