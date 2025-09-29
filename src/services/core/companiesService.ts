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
  logo_url?: string | null;
  codigo_empresa?: string | null;
  is_primary?: boolean;
  user_profile_id?: string;
};

export type CompanyInput = Omit<Company, 'id' | 'created_at'>;

export const CompaniesService = {
  async list(params?: { search?: string; is_active?: boolean | null }) {
    // Buscar empresas através da tabela user_companies para mostrar apenas as empresas do usuário logado
    let q = coreSupabase
      .from('core.user_companies')
      .select(`
        companies!inner(*),
        is_primary,
        profile_id
      `)
      .order('companies(razao_social)', { ascending: true });
    
    if (params?.is_active !== undefined && params.is_active !== null) {
      q = q.eq('companies.is_active', params.is_active);
    }
    if (params?.search) {
      // Busca simples por razão social / nome fantasia / cnpj
      q = q.or(
        `companies.razao_social.ilike.%${params.search}%,companies.nome_fantasia.ilike.%${params.search}%,companies.cnpj.ilike.%${params.search}%`
      );
    }
    
    const { data, error } = await q;
    if (error) throw error;
    
    // Extrair apenas os dados da empresa e adicionar informações de acesso
    return data?.map(item => ({
      ...item.companies,
      is_primary: item.is_primary,
      user_profile_id: item.profile_id
    })) as (Company & { is_primary: boolean; user_profile_id?: string })[];
  },

  async getById(id: string) {
    const { data, error } = await coreSupabase.from('core.companies').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Company;
  },

  async create(input: CompanyInput) {
    const { data, error } = await coreSupabase.from('core.companies').insert(input).select('*').single();
    if (error) throw error;
    return data as Company;
  },

  async update(id: string, input: Partial<CompanyInput>) {
    const { data, error } = await coreSupabase.from('core.companies').update(input).eq('id', id).select('*').single();
    if (error) throw error;
    return data as Company;
  },

  async toggleActive(id: string, isActive: boolean) {
    const { data, error } = await coreSupabase
      .from('core.companies')
      .update({ is_active: isActive })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as Company;
  },
};


