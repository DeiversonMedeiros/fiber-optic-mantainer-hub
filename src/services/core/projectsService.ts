import { coreSupabase } from '@/integrations/supabase/client';

export type Project = {
  id: string;
  company_id: string | null;
  cost_center_id: string | null;
  codigo: string;
  nome: string;
  descricao?: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  status?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

export type ProjectInput = Omit<Project, 'id' | 'created_at'>;

export const ProjectsService = {
  async list(params: { companyId?: string | null; costCenterId?: string | null; status?: string | null; search?: string; page?: number; pageSize?: number } = {}) {
    let q = coreSupabase.from('projects').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (params.companyId) q = q.eq('company_id', params.companyId);
    if (params.costCenterId) q = q.eq('cost_center_id', params.costCenterId);
    if (params.status) q = q.eq('status', params.status);
    if (params.search) q = q.or(`codigo.ilike.%${params.search}%,nome.ilike.%${params.search}%`);
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await q.range(from, to);
    if (error) throw error;
    return { data: (data as Project[]) || [], count: count ?? 0 };
  },

  async create(input: ProjectInput) {
    const { data, error } = await coreSupabase.from('projects').insert(input).select('*').single();
    if (error) throw error;
    return data as Project;
  },

  async update(id: string, input: Partial<ProjectInput>) {
    const { data, error } = await coreSupabase.from('projects').update(input).eq('id', id).select('*').single();
    if (error) throw error;
    return data as Project;
  },

  async toggleActive(id: string, isActive: boolean) {
    const { data, error } = await coreSupabase.from('projects').update({ is_active: isActive }).eq('id', id).select('*').single();
    if (error) throw error;
    return data as Project;
  },
};


