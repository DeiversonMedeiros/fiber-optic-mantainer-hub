import { coreSupabase } from '@/integrations/supabase/client';

export type Department = {
  id: string;
  company_id: string;
  nome: string;
  codigo?: string | null;
  descricao?: string | null;
  centro_custo?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DepartmentInput = Omit<Department, 'id' | 'created_at' | 'updated_at'>;

export const DepartmentsService = {
  async list(params: { companyId: string; search?: string } ) {
    let q = coreSupabase.from('departments').select('*').order('nome', { ascending: true }).eq('company_id', params.companyId);
    if (params.search) q = q.or(`nome.ilike.%${params.search}%,codigo.ilike.%${params.search}%`);
    const { data, error } = await q;
    if (error) throw error;
    return data as Department[];
  },

  async create(input: DepartmentInput) {
    const { data, error } = await coreSupabase.from('departments').insert(input).select('*').single();
    if (error) throw error;
    return data as Department;
  },

  async update(id: string, input: Partial<DepartmentInput>) {
    const { data, error } = await coreSupabase.from('departments').update(input).eq('id', id).select('*').single();
    if (error) throw error;
    return data as Department;
  },

  async toggleActive(id: string, isActive: boolean) {
    const { data, error } = await coreSupabase.from('departments').update({ is_active: isActive }).eq('id', id).select('*').single();
    if (error) throw error;
    return data as Department;
  },
};


