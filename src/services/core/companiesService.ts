import { coreSupabase } from '@/integrations/supabase/client';

export type Company = {
  id: string;
  razao_social: string;
  nome_fantasia?: string | null;
  cnpj?: string | null;
  inscricao_estadual?: string | null;
  endereco?: string | null;
  contato?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

export type CompanyInput = Omit<Company, 'id' | 'created_at'>;

export const CompaniesService = {
  async list(params?: { search?: string; is_active?: boolean | null }) {
    let q = coreSupabase.from('companies').select('*').order('razao_social', { ascending: true });
    if (params?.is_active !== undefined && params.is_active !== null) {
      q = q.eq('is_active', params.is_active);
    }
    if (params?.search) {
      // Busca simples por razão social / nome fantasia / cnpj
      q = q.or(
        `razao_social.ilike.%${params.search}%,nome_fantasia.ilike.%${params.search}%,cnpj.ilike.%${params.search}%`
      );
    }
    const { data, error } = await q;
    if (error) throw error;
    return data as Company[];
  },

  async getById(id: string) {
    const { data, error } = await coreSupabase.from('companies').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Company;
  },

  async create(input: CompanyInput) {
    const { data, error } = await coreSupabase.from('companies').insert(input).select('*').single();
    if (error) throw error;
    return data as Company;
  },

  async update(id: string, input: Partial<CompanyInput>) {
    const { data, error } = await coreSupabase.from('companies').update(input).eq('id', id).select('*').single();
    if (error) throw error;
    return data as Company;
  },

  async toggleActive(id: string, isActive: boolean) {
    const { data, error } = await coreSupabase
      .from('companies')
      .update({ is_active: isActive })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as Company;
  },
};


