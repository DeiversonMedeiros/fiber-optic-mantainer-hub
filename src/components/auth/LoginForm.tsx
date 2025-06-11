
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
}

const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'E-mail inválido';
    }
    
    if (!password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Simular delay de autenticação
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Demo credentials para teste
      if (email === 'admin@sgm.com' && password === '123456') {
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao Sistema de Gestão de Manutenção",
        });
        onLogin(email, password);
      } else {
        toast({
          title: "Erro no login",
          description: "E-mail ou senha incorretos",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro no sistema",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
          <div className="w-8 h-8 bg-secondary rounded-full fiber-pulse"></div>
        </div>
        <CardTitle className="text-2xl font-bold text-primary">
          Acesso ao Sistema
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Sistema de Gestão de Manutenção
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              E-mail ou Nome de Usuário
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <div className="flex items-center gap-1 text-destructive text-xs">
                <AlertCircle className="h-3 w-3" />
                {errors.email}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`pl-10 ${errors.password ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.password && (
              <div className="flex items-center gap-1 text-destructive text-xs">
                <AlertCircle className="h-3 w-3" />
                {errors.password}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              disabled={isLoading}
            />
            <Label htmlFor="remember" className="text-sm text-muted-foreground">
              Lembrar meus dados
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>

        <div className="text-center">
          <button className="text-primary hover:text-primary-dark text-sm transition-colors">
            Esqueci minha senha
          </button>
        </div>

        <div className="text-center pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Demo: admin@sgm.com / 123456
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
