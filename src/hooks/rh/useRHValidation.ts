import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/rh-client';

export const useRHValidation = () => {
  const queryClient = useQueryClient();

  // Validar se funcionário pode tirar férias
  const validateVacationRequest = useMutation({
    mutationFn: async ({ employeeId, startDate, endDate }: { 
      employeeId: string; 
      startDate: string; 
      endDate: string; 
    }) => {
      // Verificar se funcionário está ativo
      const { data: employee, error: employeeError } = await rhSupabase
        .from('employees')
        .select('status')
        .eq('id', employeeId)
        .single();
      
      if (employeeError) throw employeeError;
      if (employee.status !== 'ativo') {
        throw new Error('Funcionário deve estar ativo para solicitar férias');
      }

      // Verificar se já tem férias aprovadas no período
      const { data: existingVacations, error: vacationError } = await rhSupabase
        .from('vacations')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('status', 'aprovado')
        .or(`and(data_inicio.lte.${endDate},data_fim.gte.${startDate})`);
      
      if (vacationError) throw vacationError;
      if (existingVacations && existingVacations.length > 0) {
        throw new Error('Funcionário já tem férias aprovadas neste período');
      }

      return { valid: true };
    },
  });

  // Validar se funcionário pode ser promovido
  const validatePromotion = useMutation({
    mutationFn: async ({ employeeId, newPositionId }: { 
      employeeId: string; 
      newPositionId: string; 
    }) => {
      // Verificar se funcionário está ativo
      const { data: employee, error: employeeError } = await rhSupabase
        .from('employees')
        .select('status, position_id')
        .eq('id', employeeId)
        .single();
      
      if (employeeError) throw employeeError;
      if (employee.status !== 'ativo') {
        throw new Error('Funcionário deve estar ativo para ser promovido');
      }

      // Verificar se a nova posição existe e está ativa
      const { data: position, error: positionError } = await rhSupabase
        .from('positions')
        .select('ativo')
        .eq('id', newPositionId)
        .single();
      
      if (positionError) throw positionError;
      if (!position.ativo) {
        throw new Error('Posição de destino deve estar ativa');
      }

      return { valid: true };
    },
  });

  // Validar se funcionário pode ser demitido
  const validateTermination = useMutation({
    mutationFn: async ({ employeeId, terminationDate }: { 
      employeeId: string; 
      terminationDate: string; 
    }) => {
      // Verificar se funcionário está ativo
      const { data: employee, error: employeeError } = await rhSupabase
        .from('employees')
        .select('status, data_admissao')
        .eq('id', employeeId)
        .single();
      
      if (employeeError) throw employeeError;
      if (employee.status !== 'ativo') {
        throw new Error('Funcionário já não está ativo');
      }

      // Verificar se data de demissão é posterior à admissão
      if (new Date(terminationDate) <= new Date(employee.data_admissao)) {
        throw new Error('Data de demissão deve ser posterior à data de admissão');
      }

      return { valid: true };
    },
  });

  // Validar se funcionário pode ser contratado
  const validateHiring = useMutation({
    mutationFn: async ({ cpf, email, positionId }: { 
      cpf: string; 
      email: string; 
      positionId: string; 
    }) => {
      // Verificar se CPF já existe
      const { data: existingCpf, error: cpfError } = await rhSupabase
        .from('employees')
        .select('id')
        .eq('cpf', cpf)
        .single();
      
      if (cpfError && cpfError.code !== 'PGRST116') throw cpfError;
      if (existingCpf) {
        throw new Error('CPF já cadastrado no sistema');
      }

      // Verificar se email já existe
      const { data: existingEmail, error: emailError } = await rhSupabase
        .from('employees')
        .select('id')
        .eq('email', email)
        .single();
      
      if (emailError && emailError.code !== 'PGRST116') throw emailError;
      if (existingEmail) {
        throw new Error('Email já cadastrado no sistema');
      }

      // Verificar se posição existe e está ativa
      const { data: position, error: positionError } = await rhSupabase
        .from('positions')
        .select('ativo')
        .eq('id', positionId)
        .single();
      
      if (positionError) throw positionError;
      if (!position.ativo) {
        throw new Error('Posição deve estar ativa');
      }

      return { valid: true };
    },
  });

  // Validar se funcionário pode ser transferido
  const validateTransfer = useMutation({
    mutationFn: async ({ employeeId, newDepartmentId }: { 
      employeeId: string; 
      newDepartmentId: string; 
    }) => {
      // Verificar se funcionário está ativo
      const { data: employee, error: employeeError } = await rhSupabase
        .from('employees')
        .select('status, departamento')
        .eq('id', employeeId)
        .single();
      
      if (employeeError) throw employeeError;
      if (employee.status !== 'ativo') {
        throw new Error('Funcionário deve estar ativo para ser transferido');
      }

      // Verificar se não está sendo transferido para o mesmo departamento
      if (employee.departamento === newDepartmentId) {
        throw new Error('Funcionário já está no departamento de destino');
      }

      return { valid: true };
    },
  });

  // Validar se funcionário pode ser aposentado
  const validateRetirement = useMutation({
    mutationFn: async ({ employeeId, retirementDate }: { 
      employeeId: string; 
      retirementDate: string; 
    }) => {
      // Verificar se funcionário está ativo
      const { data: employee, error: employeeError } = await rhSupabase
        .from('employees')
        .select('status, data_nascimento')
        .eq('id', employeeId)
        .single();
      
      if (employeeError) throw employeeError;
      if (employee.status !== 'ativo') {
        throw new Error('Funcionário já não está ativo');
      }

      // Verificar se tem idade mínima para aposentadoria (65 anos)
      const birthDate = new Date(employee.data_nascimento);
      const retirementDateObj = new Date(retirementDate);
      const age = retirementDateObj.getFullYear() - birthDate.getFullYear();
      
      if (age < 65) {
        throw new Error('Funcionário deve ter pelo menos 65 anos para se aposentar');
      }

      return { valid: true };
    },
  });

  return {
    validateVacationRequest,
    validatePromotion,
    validateTermination,
    validateHiring,
    validateTransfer,
    validateRetirement,
  };
};