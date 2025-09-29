import { coreSupabase } from '@/integrations/supabase/client';

export type CostCenter = {
  id: string;
  company_id: string | null;
  codigo: string;
  nome: string;
  descricao?: string | null;
  parent_id?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

export type CostCenterInput = Omit<CostCenter, 'id' | 'created_at'>;

export const CostCentersService = {
  async list(params: { companyId?: string | null; search?: string } = {}) {
    let q = coreSupabase.from('cost_centers').select('*').order('codigo', { ascending: true });
    if (params.companyId) q = q.eq('company_id', params.companyId);
    if (params.search) q = q.or(`codigo.ilike.%${params.search}%,nome.ilike.%${params.search}%`);
    const { data, error } = await q;
    if (error) throw error;
    return data as CostCenter[];
  },

  async create(input: CostCenterInput) {
    const { data, error } = await coreSupabase.from('cost_centers').insert(input).select('*').single();
    if (error) throw error;
    return data as CostCenter;
  },

  async update(id: string, input: Partial<CostCenterInput>) {
    const { data, error } = await coreSupabase.from('cost_centers').update(input).eq('id', id).select('*').single();
    if (error) throw error;
    return data as CostCenter;
  },

  async toggleActive(id: string, isActive: boolean) {
    const { data, error } = await coreSupabase.from('cost_centers').update({ is_active: isActive }).eq('id', id).select('*').single();
    if (error) throw error;
    return data as CostCenter;
  },
};


