import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AutoSchedulingConfig {
  companyId: string;
  examTypes: string[];
  daysBeforeNotification: number;
}

interface ExamScheduleResult {
  employeeId: string;
  employeeName: string;
  examType: string;
  scheduledDate: string;
  notificationDate: string;
  created: boolean;
  reason?: string;
}

export const usePeriodicExamScheduling = () => {
  const queryClient = useQueryClient();

  // Função para calcular a próxima data de exame baseada na data de admissão
  const calculateNextExamDate = (admissionDate: string, examType: string): string => {
    const admission = new Date(admissionDate);
    const currentDate = new Date();
    
    // Para exames periódicos, calcular baseado no último exame ou data de admissão
    if (examType === 'periodico') {
      // Calcular anos desde a admissão
      const yearsSinceAdmission = Math.floor(
        (currentDate.getTime() - admission.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      
      // Próximo exame deve ser 1 ano após o último
      const nextExamDate = new Date(admission);
      nextExamDate.setFullYear(admission.getFullYear() + yearsSinceAdmission + 1);
      
      return nextExamDate.toISOString().split('T')[0];
    }
    
    // Para outros tipos de exame, usar a data de admissão como base
    return admission.toISOString().split('T')[0];
  };

  // Função para calcular a data de notificação (30 dias antes)
  const calculateNotificationDate = (examDate: string, daysBefore: number = 30): string => {
    const exam = new Date(examDate);
    const notification = new Date(exam);
    notification.setDate(exam.getDate() - daysBefore);
    return notification.toISOString().split('T')[0];
  };

  // Query para buscar funcionários que precisam de exames agendados
  const getEmployeesNeedingExams = useQuery({
    queryKey: ['periodic-exams', 'employees-needing-exams'],
    queryFn: async (): Promise<any[]> => {
      const { data: employees, error } = await supabase.rpc('get_rh_employees', {
        p_status: 'ativo'
      });

      if (error) throw error;
      return employees || [];
    },
  });

  // Query para buscar exames já agendados para evitar duplicatas
  const getExistingExams = useQuery({
    queryKey: ['periodic-exams', 'existing'],
    queryFn: async (): Promise<any[]> => {
      const { data: exams, error } = await supabase.rpc('get_rh_periodic_exams', {
        p_status: 'agendado'
      });

      if (error) throw error;
      return exams || [];
    },
  });

  // Mutation para agendar exames automaticamente
  const scheduleAutomaticExams = useMutation({
    mutationFn: async (config: AutoSchedulingConfig): Promise<ExamScheduleResult[]> => {
      const results: ExamScheduleResult[] = [];
      
      // Buscar funcionários ativos
      const { data: employees, error: employeesError } = await (supabase as any)
        .from('rh.employees')
        .select(`
          id,
          nome,
          data_admissao,
          status,
          company_id
        `)
        .eq('status', 'ativo')
        .eq('company_id', config.companyId)
        .not('data_admissao', 'is', null);

      if (employeesError) throw employeesError;

      // Buscar exames já agendados
      const { data: existingExams, error: examsError } = await (supabase as any)
        .from('rh.periodic_exams')
        .select(`
          id,
          employee_id,
          tipo_exame,
          data_agendada,
          status
        `)
        .eq('company_id', config.companyId)
        .eq('status', 'agendado');

      if (examsError) throw examsError;

      // Processar cada funcionário
      for (const employee of employees) {
        for (const examType of config.examTypes) {
          // Verificar se já existe um exame agendado deste tipo para este funcionário
          const existingExam = existingExams?.find(
            (exam: any) => exam.employee_id === employee.id && exam.tipo_exame === examType
          );

          if (existingExam) {
            results.push({
              employeeId: employee.id,
              employeeName: employee.nome,
              examType,
              scheduledDate: existingExam.data_agendada,
              notificationDate: calculateNotificationDate(existingExam.data_agendada, config.daysBeforeNotification),
              created: false,
              reason: 'Exame já agendado'
            });
            continue;
          }

          // Calcular data do próximo exame
          const examDate = calculateNextExamDate(employee.data_admissao, examType);
          const notificationDate = calculateNotificationDate(examDate, config.daysBeforeNotification);

          // Verificar se o exame não está muito no passado
          const examDateObj = new Date(examDate);
          const currentDate = new Date();
          if (examDateObj < currentDate) {
            // Se a data calculada está no passado, agendar para 30 dias a partir de hoje
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + config.daysBeforeNotification);
            const newExamDate = futureDate.toISOString().split('T')[0];
            const newNotificationDate = new Date().toISOString().split('T')[0];

            // Criar o exame
            const { data: newExam, error: createError } = await (supabase as any)
              .from('rh.periodic_exams')
              .insert([{
                company_id: config.companyId,
                employee_id: employee.id,
                tipo_exame: examType,
                data_agendada: newExamDate,
                status: 'agendado'
              }])
              .select()
              .single();

            if (createError) {
              results.push({
                employeeId: employee.id,
                employeeName: employee.nome,
                examType,
                scheduledDate: newExamDate,
                notificationDate: newNotificationDate,
                created: false,
                reason: `Erro ao criar: ${createError.message}`
              });
            } else {
              results.push({
                employeeId: employee.id,
                employeeName: employee.nome,
                examType,
                scheduledDate: newExamDate,
                notificationDate: newNotificationDate,
                created: true
              });
            }
          } else {
            // Data futura válida
            const { data: newExam, error: createError } = await (supabase as any)
              .from('rh.periodic_exams')
              .insert([{
                company_id: config.companyId,
                employee_id: employee.id,
                tipo_exame: examType,
                data_agendada: examDate,
                status: 'agendado'
              }])
              .select()
              .single();

            if (createError) {
              results.push({
                employeeId: employee.id,
                employeeName: employee.nome,
                examType,
                scheduledDate: examDate,
                notificationDate,
                created: false,
                reason: `Erro ao criar: ${createError.message}`
              });
            } else {
              results.push({
                employeeId: employee.id,
                employeeName: employee.nome,
                examType,
                scheduledDate: examDate,
                notificationDate,
                created: true
              });
            }
          }
        }
      }

      return results;
    },
    onSuccess: (results) => {
      const createdCount = results.filter(r => r.created).length;
      const skippedCount = results.filter(r => !r.created).length;
      
      toast.success(`Agendamento automático concluído: ${createdCount} exames criados, ${skippedCount} já existiam`);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['periodic-exams'] });
    },
    onError: (error: any) => {
      toast.error(`Erro no agendamento automático: ${error.message}`);
    }
  });

  // Mutation para agendar próximo exame anual para um funcionário específico
  const scheduleNextAnnualExam = useMutation({
    mutationFn: async ({ 
      employeeId, 
      companyId, 
      examType = 'periodico',
      daysBeforeNotification = 30 
    }: {
      employeeId: string;
      companyId: string;
      examType?: string;
      daysBeforeNotification?: number;
    }) => {
      // Buscar dados do funcionário
      const { data: employee, error: employeeError } = await (supabase as any)
        .from('rh.employees')
        .select('id, nome, data_admissao')
        .eq('id', employeeId)
        .single();

      if (employeeError) throw employeeError;

      // Buscar último exame deste tipo
      const { data: lastExam, error: examError } = await (supabase as any)
        .from('rh.periodic_exams')
        .select('data_agendada, data_realizacao')
        .eq('employee_id', employeeId)
        .eq('tipo_exame', examType)
        .eq('status', 'realizado')
        .order('data_realizacao', { ascending: false })
        .limit(1)
        .single();

      let nextExamDate: string;

      if (lastExam?.data_realizacao) {
        // Se tem exame realizado, agendar para 1 ano depois
        const lastExamDate = new Date(lastExam.data_realizacao);
        lastExamDate.setFullYear(lastExamDate.getFullYear() + 1);
        nextExamDate = lastExamDate.toISOString().split('T')[0];
      } else {
        // Se não tem exame realizado, usar data de admissão + 1 ano
        const admissionDate = new Date(employee.data_admissao);
        admissionDate.setFullYear(admissionDate.getFullYear() + 1);
        nextExamDate = admissionDate.toISOString().split('T')[0];
      }

      // Verificar se a data não está no passado
      const examDateObj = new Date(nextExamDate);
      const currentDate = new Date();
      if (examDateObj < currentDate) {
        // Se está no passado, agendar para 30 dias no futuro
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysBeforeNotification);
        nextExamDate = futureDate.toISOString().split('T')[0];
      }

      // Criar o exame
      const { data: newExam, error: createError } = await (supabase as any)
        .from('rh.periodic_exams')
        .insert([{
          company_id: companyId,
          employee_id: employeeId,
          tipo_exame: examType,
          data_agendada: nextExamDate,
          status: 'agendado'
        }])
        .select()
        .single();

      if (createError) throw createError;

      return newExam;
    },
    onSuccess: () => {
      toast.success('Próximo exame anual agendado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['periodic-exams'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao agendar próximo exame: ${error.message}`);
    }
  });

  return {
    getEmployeesNeedingExams,
    getExistingExams,
    scheduleAutomaticExams,
    scheduleNextAnnualExam,
    calculateNextExamDate,
    calculateNotificationDate
  };
};
