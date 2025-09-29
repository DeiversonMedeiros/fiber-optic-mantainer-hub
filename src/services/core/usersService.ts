import { coreSupabase } from '@/integrations/supabase/client';

export type CoreUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  is_active?: boolean | null;
  company_id?: string | null;
  profile_id?: string | null;
  username?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type UserCompany = {
  user_id: string;
  company_id: string;
  profile_id?: string | null;
  is_primary?: boolean | null;
  created_at?: string | null;
};

export const UsersService = {
  async list(params: { companyId?: string | null; search?: string; page?: number; pageSize?: number } = {}) {
    let q = coreSupabase.from('users').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (params.companyId) q = q.eq('company_id', params.companyId);
    if (params.search) q = q.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await q.range(from, to);
    if (error) throw error;
    return { data: (data as CoreUser[]) || [], count: count ?? 0 };
  },

  async getUserCompanies(userId: string) {
    const { data, error } = await coreSupabase.from('user_companies').select('*').eq('user_id', userId);
    if (error) throw error;
    return data as UserCompany[];
  },

  async upsertUserCompany(payload: UserCompany) {
    const { data, error } = await coreSupabase.from('user_companies').upsert(payload, { onConflict: 'user_id,company_id' }).select('*').single();
    if (error) throw error;
    return data as UserCompany;
  },

  async deleteUserCompany(userId: string, companyId: string) {
    const { error } = await coreSupabase.from('user_companies').delete().match({ user_id: userId, company_id: companyId });
    if (error) throw error;
  },

  async setPrimaryCompany(userId: string, companyId: string) {
    // unset previous
    const { error: e1 } = await coreSupabase.from('user_companies').update({ is_primary: false }).eq('user_id', userId);
    if (e1) throw e1;
    const { data, error } = await coreSupabase.from('user_companies').update({ is_primary: true }).match({ user_id: userId, company_id: companyId }).select('*').single();
    if (error) throw error;
    return data as UserCompany;
  },
};


