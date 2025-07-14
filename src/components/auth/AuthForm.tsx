
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
    if (!loginInput || !password) return;

    setIsLoading(true);
    try {
      let emailToLogin = loginInput;
      // Se não for e-mail, buscar pelo username
      if (!/\S+@\S+\.\S+/.test(loginInput)) {
        const { data, error } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', loginInput)
          .single();
        if (error || !data) {
          setIsLoading(false);
          // Exiba toast de erro
          // Exemplo:
          // toast({ title: "Erro", description: "Nome de usuário não encontrado", variant: "destructive" });
          return;
        }
        emailToLogin = data.email;
      }
      await signIn(emailToLogin, password);
    } finally {
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
