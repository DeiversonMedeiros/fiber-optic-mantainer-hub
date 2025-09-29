import { coreSupabase } from '@/integrations/supabase/client';

export type UserCompany = {
  user_id: string;
  company_id: string;
  profile_id?: string | null;
  is_primary: boolean;
  created_at?: string;
  // Dados da empresa (quando buscado com join)
  company?: {
    id: string;
    razao_social: string;
    nome_fantasia?: string | null;
    cnpj?: string | null;
  };
  // Dados do perfil (quando buscado com join)
  profile?: {
    id: string;
    nome: string;
  };
};

export type UserCompanyInput = {
  user_id: string;
  company_id: string;
  profile_id?: string | null;
  is_primary?: boolean;
};

export const UserCompaniesService = {
  // Buscar empresas de um usuário
  async getUserCompanies(userId: string) {
    const { data, error } = await coreSupabase
      .from('core.user_companies')
      .select(`
        *,
        companies!inner(
          id,
          razao_social,
          nome_fantasia,
          cnpj,
          is_active
        ),
        profiles(
          id,
          nome
        )
      `)
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
      .order('companies(razao_social)', { ascending: true });
    
    if (error) throw error;
    return data as UserCompany[];
  },

  // Adicionar empresa a um usuário
  async addUserToCompany(input: UserCompanyInput) {
    // Se for a primeira empresa do usuário, definir como primária
    const existingCompanies = await this.getUserCompanies(input.user_id);
    const isFirstCompany = existingCompanies.length === 0;
    
    const { data, error } = await coreSupabase
      .from('core.user_companies')
      .insert({
        ...input,
        is_primary: input.is_primary ?? isFirstCompany
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Remover empresa de um usuário
  async removeUserFromCompany(userId: string, companyId: string) {
    const { error } = await coreSupabase
      .from('core.user_companies')
      .delete()
      .eq('user_id', userId)
      .eq('company_id', companyId);
    
    if (error) throw error;
  },

  // Definir empresa primária
  async setPrimaryCompany(userId: string, companyId: string) {
    // Primeiro, remover o status primário de todas as empresas do usuário
    await coreSupabase
      .from('core.user_companies')
      .update({ is_primary: false })
      .eq('user_id', userId);

    // Depois, definir a empresa especificada como primária
    const { data, error } = await coreSupabase
      .from('core.user_companies')
      .update({ is_primary: true })
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Atualizar perfil do usuário em uma empresa
  async updateUserProfileInCompany(userId: string, companyId: string, profileId: string | null) {
    const { data, error } = await coreSupabase
      .from('core.user_companies')
      .update({ profile_id: profileId })
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Buscar usuários de uma empresa
  async getCompanyUsers(companyId: string) {
    const { data, error } = await coreSupabase
      .from('core.user_companies')
      .select(`
        *,
        users!inner(
          id,
          name,
          email,
          is_active
        ),
        profiles(
          id,
          nome
        )
      `)
      .eq('company_id', companyId)
      .order('is_primary', { ascending: false })
      .order('users(name)', { ascending: true });
    
    if (error) throw error;
    return data;
  }
};
