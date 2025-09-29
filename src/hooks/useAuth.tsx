
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        toast({
          title: "Erro no login",
          description: error.message === 'Invalid login credentials' 
            ? "Email ou senha incorretos" 
            : error.message,
          variant: "destructive",
        });
        return { error: error.message };
      }

      // Invalida queries de perfil e permissões após login
      await queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      await queryClient.invalidateQueries({ queryKey: ['access-profile'] });
      // Força o refetch imediatamente após invalidar
      await queryClient.refetchQueries({ queryKey: ['user-profile'] });
      await queryClient.refetchQueries({ queryKey: ['access-profile'] });

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao SGM",
      });
      
      return {};
    } catch (error) {
      console.error('Unexpected login error:', error);
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
