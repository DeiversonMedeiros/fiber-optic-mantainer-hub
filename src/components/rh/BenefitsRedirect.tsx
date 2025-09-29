import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Info, 
  Settings, 
  Users, 
  Calculator, 
  CreditCard,
  BarChart3,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface BenefitsRedirectProps {
  fromPage: string;
  benefitType?: 'vr_va' | 'transporte' | 'equipment_rental' | 'premiacao' | 'all';
}

export function BenefitsRedirect({ fromPage, benefitType }: BenefitsRedirectProps) {
  const navigate = useNavigate();

  const getBenefitTypeInfo = (type?: string) => {
    const types = {
      'vr_va': {
        label: 'VR/VA',
        description: 'Gestão de Vale Refeição e Vale Alimentação',
        icon: Settings,
        tab: 'configurations'
      },
      'transporte': {
        label: 'Transporte',
        description: 'Gestão de Vale Transporte',
        icon: Users,
        tab: 'assignments'
      },
      'equipment_rental': {
        label: 'Locação de Equipamentos',
        description: 'Gestão de Locação de Equipamentos',
        icon: Calculator,
        tab: 'processing'
      },
      'premiacao': {
        label: 'Premiação',
        description: 'Gestão de Premiação e Produtividade',
        icon: CreditCard,
        tab: 'payments'
      },
      'all': {
        label: 'Todos os Benefícios',
        description: 'Sistema Unificado de Gestão de Benefícios',
        icon: BarChart3,
        tab: 'statistics'
      }
    };

    return types[type as keyof typeof types] || types.all;
  };

  const handleRedirect = () => {
    const benefitInfo = getBenefitTypeInfo(benefitType);
    const targetUrl = `/rh/beneficios-unificados?tab=${benefitInfo.tab}`;
    navigate(targetUrl);
    toast.success(`Redirecionando para ${benefitInfo.label} no sistema unificado`);
  };

  const benefitInfo = getBenefitTypeInfo(benefitType);

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Info className="h-5 w-5" />
            Sistema de Benefícios Atualizado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <ExternalLink className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-amber-800 font-medium mb-2">
                Esta página foi migrada para o novo sistema unificado de benefícios!
              </p>
              <p className="text-amber-700 text-sm mb-4">
                O sistema antigo foi substituído por uma versão mais moderna e eficiente. 
                Todas as funcionalidades foram preservadas e melhoradas.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-amber-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <benefitInfo.icon className="h-4 w-4" />
              {benefitInfo.label}
            </h3>
            <p className="text-gray-600 text-sm mb-3">{benefitInfo.description}</p>
            
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="text-xs">
                Sistema Unificado
              </Badge>
              <Badge variant="outline" className="text-xs">
                Melhor Performance
              </Badge>
              <Badge variant="outline" className="text-xs">
                Interface Moderna
              </Badge>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 text-sm">Novas funcionalidades disponíveis:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  Processamento em lote otimizado
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  Integração com Flash API
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  Relatórios e estatísticas avançadas
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  Gestão unificada de todos os benefícios
                </li>
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-amber-200">
            <div className="text-sm text-amber-700">
              Redirecionando automaticamente em <span className="font-mono">3</span> segundos...
            </div>
            <Button 
              onClick={handleRedirect}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Ir para o Sistema Unificado
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Redirecionamento automático */}
      <AutoRedirect 
        onRedirect={handleRedirect}
        delay={3000}
      />
    </div>
  );
}

// Componente para redirecionamento automático
interface AutoRedirectProps {
  onRedirect: () => void;
  delay: number;
}

function AutoRedirect({ onRedirect, delay }: AutoRedirectProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRedirect();
    }, delay);

    return () => clearTimeout(timer);
  }, [onRedirect, delay]);

  return null;
}
