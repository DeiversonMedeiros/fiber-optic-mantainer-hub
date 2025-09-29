
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { coreSupabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AuthForm = () => {
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔐 [AUTH_FORM] Iniciando processo de login...');
    console.log('🔐 [AUTH_FORM] Login input:', loginInput);
    console.log('🔐 [AUTH_FORM] Password length:', password.length);
    console.log('🔐 [AUTH_FORM] Remember me:', rememberMe);
    console.log('🔐 [AUTH_FORM] Supabase client:', coreSupabase);
    console.log('🔐 [AUTH_FORM] Supabase URL:', coreSupabase.supabaseUrl);
    console.log('🔐 [AUTH_FORM] Supabase Key (primeiros 10 chars):', coreSupabase.supabaseKey?.substring(0, 10));
    
    if (!loginInput || !password) {
      console.log('❌ [AUTH_FORM] Campos obrigatórios não preenchidos');
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let emailToLogin = loginInput;
      // Se não for e-mail, buscar pelo username
      if (!/\S+@\S+\.\S+/.test(loginInput)) {
        console.log('🔐 [AUTH_FORM] Input não é email, buscando por username...');
        
        // Teste de conectividade antes de buscar usuário
        console.log('🔐 [AUTH_FORM] Testando conectividade para buscar usuário...');
        try {
          const { data: testData, error: testError } = await coreSupabase
            .from('users')
            .select('id')
            .limit(1);
          console.log('🔐 [AUTH_FORM] Teste de conectividade core.users:', { testData, testError });
        } catch (testErr) {
          console.error('❌ [AUTH_FORM] Erro no teste de conectividade core.users:', testErr);
        }
        
        const { data, error } = await coreSupabase
          .from('users')
          .select('email')
          .eq('username', loginInput)
          .single();
        
        console.log('🔐 [AUTH_FORM] Resultado da busca de usuário:', { data, error });
        
        if (error || !data) {
          console.error('❌ [AUTH_FORM] Erro ao buscar username:', error);
          setIsLoading(false);
          toast({
            title: "Erro",
            description: "Nome de usuário não encontrado",
            variant: "destructive",
          });
          return;
        }
        console.log('✅ [AUTH_FORM] Email encontrado:', data.email);
        emailToLogin = data.email;
      } else {
        console.log('🔐 [AUTH_FORM] Input é email, usando diretamente');
      }
      
      console.log('🔐 [AUTH_FORM] Chamando signIn com email:', emailToLogin);
      const result = await signIn(emailToLogin, password);
      console.log('🔐 [AUTH_FORM] Resultado do signIn:', result);
      
      if (result.error) {
        console.error('❌ [AUTH_FORM] Erro no login:', result.error);
        toast({
          title: "Erro no login",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 [AUTH_FORM] Erro inesperado:', error);
      console.error('💥 [AUTH_FORM] Error type:', typeof error);
      console.error('💥 [AUTH_FORM] Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('💥 [AUTH_FORM] Error stack:', error instanceof Error ? error.stack : 'No stack');
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      console.log('🔐 [AUTH_FORM] Finalizando processo de login');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-fiber-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/sgm-logo-branca.png"
            alt="Logomarca SGM"
            className="h-20 mx-auto mb-4 drop-shadow-lg"
          />
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Acesso ao Sistema</CardTitle>
            <CardDescription className="text-center">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login">E-mail ou Nome de Usuário</Label>
                <Input
                  id="login"
                  type="text"
                  placeholder="E-mail ou nome de usuário"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  disabled={isLoading}
                />
                <Label htmlFor="remember" className="text-sm">
                  Lembrar meus dados
                </Label>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthForm;
