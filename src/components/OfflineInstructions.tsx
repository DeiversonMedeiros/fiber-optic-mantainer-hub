import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Download, 
  Upload, 
  Clock,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

export const OfflineInstructions: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          size="sm"
        >
          <Smartphone className="h-4 w-4 mr-2" />
          Instruções Offline
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold">Como usar o registro offline</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status de Conectividade */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center">
              <Wifi className="h-5 w-5 mr-2 text-green-600" />
              Status de Conectividade
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Wifi className="h-4 w-4 text-green-600" />
                <Badge className="bg-green-100 text-green-800">Online</Badge>
                <span className="text-sm text-gray-600">Registros salvos no servidor</span>
              </div>
              <div className="flex items-center space-x-2">
                <WifiOff className="h-4 w-4 text-red-600" />
                <Badge className="bg-red-100 text-red-800">Offline</Badge>
                <span className="text-sm text-gray-600">Registros salvos localmente</span>
              </div>
            </div>
          </div>

          {/* Como Funciona */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              Como Funciona
            </h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <div>
                  <p className="font-medium">Registre seu ponto normalmente</p>
                  <p className="text-sm text-gray-600">Use os botões de entrada, saída e intervalos como sempre</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">2</span>
                </div>
                <div>
                  <p className="font-medium">Dados salvos automaticamente</p>
                  <p className="text-sm text-gray-600">
                    Se estiver online: salvos no servidor<br/>
                    Se estiver offline: salvos no dispositivo
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">3</span>
                </div>
                <div>
                  <p className="font-medium">Sincronização automática</p>
                  <p className="text-sm text-gray-600">
                    Quando a conexão voltar, os registros são sincronizados automaticamente
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Instruções para Mobile */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center">
              <Smartphone className="h-5 w-5 mr-2 text-purple-600" />
              Para Melhor Experiência no Mobile
            </h3>
            <div className="space-y-2">
              <div className="flex items-start space-x-3">
                <Download className="h-4 w-4 text-purple-600 mt-1" />
                <div>
                  <p className="font-medium">Instale como App</p>
                  <p className="text-sm text-gray-600">
                    No navegador, toque em "Adicionar à tela inicial" para instalar como app
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                <div>
                  <p className="font-medium">Funciona sem internet</p>
                  <p className="text-sm text-gray-600">
                    Após instalado, você pode usar mesmo sem conexão
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Avisos Importantes */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
              Avisos Importantes
            </h3>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <ul className="text-sm space-y-1">
                <li>• Os dados ficam salvos no seu dispositivo até serem sincronizados</li>
                <li>• Não limpe os dados do navegador para não perder registros</li>
                <li>• A sincronização acontece automaticamente quando voltar online</li>
                <li>• Em caso de problemas, entre em contato com o suporte</li>
              </ul>
            </div>
          </div>

          {/* Botão Fechar */}
          <div className="flex justify-end pt-4">
            <Button onClick={() => setIsOpen(false)}>
              Entendi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
