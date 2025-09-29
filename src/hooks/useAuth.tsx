
import React, { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 [AUTH] Iniciando processo de login...');
      console.log('🔐 [AUTH] Email:', email);
      console.log('🔐 [AUTH] Password length:', password.length);
      console.log('🔐 [AUTH] Supabase URL:', supabase.supabaseUrl);
      console.log('🔐 [AUTH] Supabase Key (primeiros 10 chars):', supabase.supabaseKey?.substring(0, 10));
      
      // TEMPORARIAMENTE: Pular verificação de conectividade devido ao erro PGRST002
      // O problema parece ser com o cache do PostgREST, não com a conectividade real
      console.log('⚠️ [AUTH] Pulando verificação de conectividade devido ao erro PGRST002');
      console.log('⚠️ [AUTH] Assumindo conectividade OK para permitir inicialização');
      
      console.log('🔐 [AUTH] Chamando signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('🔐 [AUTH] Resposta do signInWithPassword:', { data, error });

      if (error) {
        console.error('❌ [AUTH] Erro no login:', error);
        console.error('❌ [AUTH] Error code:', error.status);
        console.error('❌ [AUTH] Error message:', error.message);
        console.error('❌ [AUTH] Error details:', error);
        console.error('❌ [AUTH] Error name:', error.name);
        console.error('❌ [AUTH] Error stack:', error.stack);
        
        // Log detalhado do erro
        if (error.message === 'Database error querying schema') {
          console.error('🔍 [AUTH] ERRO PGRST002 DETECTADO!');
          console.error('🔍 [AUTH] Este erro indica que o PostgREST não consegue acessar o schema cache');
          console.error('🔍 [AUTH] Possíveis causas:');
          console.error('🔍 [AUTH] 1. Permissões insuficientes do authenticator');
          console.error('🔍 [AUTH] 2. Problemas com o search_path');
          console.error('🔍 [AUTH] 3. Cache do PostgREST corrompido');
          console.error('🔍 [AUTH] 4. Problemas de conectividade com o banco');
        }
        
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
        return { error: error.message };
      }

      console.log('✅ [AUTH] Login realizado com sucesso!');
      console.log('✅ [AUTH] User data:', data.user);
      console.log('✅ [AUTH] Session data:', data.session);

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao SGM",
      });
      
      return {};
    } catch (error) {
      console.error('💥 [AUTH] Login error (catch):', error);
      console.error('💥 [AUTH] Error type:', typeof error);
      console.error('💥 [AUTH] Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('💥 [AUTH] Error stack:', error instanceof Error ? error.stack : 'No stack');
      return { error: 'Erro inesperado durante o login' };
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name || email,
          },
        },
      });

      if (error) {
        console.error('Signup error:', error);
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive",
        });
        return { error: error.message };
      }

      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu email para confirmar a conta",
      });
      
      return {};
    } catch (error) {
      console.error('Unexpected signup error:', error);
      return { error: 'Erro inesperado durante o cadastro' };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        toast({
          title: "Erro no logout",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Logout realizado",
          description: "Até logo!",
        });
      }
    } catch (error) {
      console.error('Unexpected logout error:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
