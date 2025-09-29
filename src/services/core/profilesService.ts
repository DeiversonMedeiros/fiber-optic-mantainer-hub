import { coreSupabase } from '@/integrations/supabase/client';

export type Profile = {
  id: string;
  nome: string;
  permissoes_gerais?: Record<string, any> | null;
  created_at?: string | null;
};

export type ProfileInput = Omit<Profile, 'id' | 'created_at'>;

export const ProfilesService = {
  async list(params?: { search?: string }) {
    let q = coreSupabase.from('profiles').select('*').order('nome', { ascending: true });
    if (params?.search) {
      q = q.ilike('nome', `%${params.search}%`);
    }
    const { data, error } = await q;
    if (error) throw error;
    return data as Profile[];
  },

  async getById(id: string) {
    const { data, error } = await coreSupabase.from('profiles').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Profile;
  },

  async create(input: ProfileInput) {
    const { data, error } = await coreSupabase.from('profiles').insert(input).select('*').single();
    if (error) throw error;
    return data as Profile;
  },

  async update(id: string, input: Partial<ProfileInput>) {
    const { data, error } = await coreSupabase.from('profiles').update(input).eq('id', id).select('*').single();
    if (error) throw error;
    return data as Profile;
  },

  async remove(id: string) {
    const { error } = await coreSupabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
  },
};


