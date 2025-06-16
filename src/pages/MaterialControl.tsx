
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Download, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MaterialAdjustmentModal from '@/components/materials/MaterialAdjustmentModal';
import { exportToCSV } from '@/utils/csvExport';

interface MaterialConsumption {
  id: string;
  material: {
    id: string;
    name: string;
    code: string;
    unit: string;
  };
  quantity: number;
  sa_code?: string;
  service_order?: {
    number: string;
    title: string;
  };
  created_at: string;
}

interface MaterialAdjustment {
  id: string;
  material: {
    name: string;
    code: string;
  };
  quantity_reduced: number;
  sa_code: string;
  reason?: string;
  created_at: string;
}

interface UserMaterials {
  user: {
    id: string;
    name: string;
    email: string;
    user_class?: {
      name: string;
    };
  };
  materials: MaterialConsumption[];
  adjustments: MaterialAdjustment[];
  totalQuantity: number;
  adjustedQuantity: number;
  currentQuantity: number;
}

const MaterialControl = () => {
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [technicianFilter, setTechnicianFilter] = useState('');
  const [userClassFilter, setUserClassFilter] = useState('all');
  const [serviceNumberFilter, setServiceNumberFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: userMaterials = [], isLoading } = useQuery({
    queryKey: ['user-materials', technicianFilter, userClassFilter, serviceNumberFilter],
    queryFn: async () => {
      let query = supabase
        .from('material_consumption')
        .select(`
          id,
          quantity,
          sa_code,
          created_at,
          material:materials(id, name, code, unit),
          service_order:service_orders(number, title),
          used_by:profiles!material_consumption_used_by_fkey(
            id, name, email,
            user_class:user_classes(name)
          )
        `);

      if (technicianFilter) {
        query = query.ilike('used_by.name', `%${technicianFilter}%`);
      }

      if (userClassFilter && userClassFilter !== 'all') {
        query = query.eq('used_by.user_class.name', userClassFilter);
      }

      if (serviceNumberFilter) {
        query = query.ilike('service_order.number', `%${serviceNumberFilter}%`);
      }

      const { data: consumptions } = await query;

      const { data: adjustments } = await supabase
        .from('material_adjustments')
        .select(`
          id,
          quantity_reduced,
          sa_code,
          reason,
          created_at,
          material:materials(name, code),
          user_id:profiles!material_adjustments_user_id_fkey(id, name, email)
        `);

      // Group by user
      const userMap = new Map<string, UserMaterials>();

      // Process consumptions
      consumptions?.forEach((consumption: any) => {
        const userId = consumption.used_by.id;
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            user: consumption.used_by,
            materials: [],
            adjustments: [],
            totalQuantity: 0,
            adjustedQuantity: 0,
            currentQuantity: 0
          });
        }

        const userData = userMap.get(userId)!;
        userData.materials.push({
          id: consumption.id,
          material: consumption.material,
          quantity: consumption.quantity,
          sa_code: consumption.sa_code,
          service_order: consumption.service_order,
          created_at: consumption.created_at
        });
        userData.totalQuantity += consumption.quantity;
      });

      // Process adjustments
      adjustments?.forEach((adjustment: any) => {
        const userId = adjustment.user_id.id;
        if (userMap.has(userId)) {
          const userData = userMap.get(userId)!;
          userData.adjustments.push({
            id: adjustment.id,
            material: adjustment.material,
            quantity_reduced: adjustment.quantity_reduced,
            sa_code: adjustment.sa_code,
            reason: adjustment.reason,
            created_at: adjustment.created_at
          });
          userData.adjustedQuantity += adjustment.quantity_reduced;
        }
      });

      // Calculate current quantities
      userMap.forEach((userData) => {
        userData.currentQuantity = userData.totalQuantity - userData.adjustedQuantity;
      });

      return Array.from(userMap.values());
    }
  });

  const { data: userClasses = [] } = useQuery({
    queryKey: ['user-classes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_classes')
        .select('name')
        .eq('is_active', true);
      return data || [];
    }
  });

  const toggleUserExpansion = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const handleAdjustmentSuccess = () => {
    setSelectedUser(null);
    setSelectedMaterial(null);
    toast({
      title: "Baixa registrada",
      description: "A baixa do material foi registrada com sucesso",
    });
  };

  const handleExportCSV = () => {
    const csvData = userMaterials.flatMap(userData => 
      userData.materials.map(material => ({
        'Técnico': userData.user.name,
        'Email': userData.user.email,
        'Classe': userData.user.user_class?.name || 'N/A',
        'Material': material.material.name,
        'Código': material.material.code,
        'Quantidade': material.quantity,
        'Unidade': material.material.unit,
        'Código SA': material.sa_code || 'N/A',
        'OS': material.service_order?.number || 'N/A',
        'Data': new Date(material.created_at).toLocaleDateString('pt-BR')
      }))
    );

    exportToCSV(csvData, 'historico-materiais');
    toast({
      title: "Exportação concluída",
      description: "O arquivo CSV foi baixado com sucesso",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-fiber-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <div className="w-8 h-8 bg-primary rounded-full"></div>
          </div>
          <p className="text-white">Carregando controle de materiais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fiber-gradient p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Controle de Materiais</h1>
            <Button onClick={handleExportCSV} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtrar por Técnico
              </label>
              <Input
                placeholder="Nome do técnico..."
                value={technicianFilter}
                onChange={(e) => setTechnicianFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Classe do Usuário
              </label>
              <Select value={userClassFilter} onValueChange={setUserClassFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as classes</SelectItem>
                  {userClasses.map((userClass) => (
                    <SelectItem key={userClass.name} value={userClass.name}>
                      {userClass.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número da OS
              </label>
              <Input
                placeholder="Número da ordem de serviço..."
                value={serviceNumberFilter}
                onChange={(e) => setServiceNumberFilter(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {userMaterials.map((userData) => (
            <Card key={userData.user.id} className="bg-white shadow-md">
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleUserExpansion(userData.user.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold">
                      {userData.user.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600">{userData.user.email}</p>
                    {userData.user.user_class && (
                      <Badge variant="secondary" className="mt-1">
                        {userData.user.user_class.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Quantidade Atual</p>
                      <p className="text-xl font-bold text-blue-600">
                        {userData.currentQuantity}
                      </p>
                    </div>
                    {expandedUsers.has(userData.user.id) ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expandedUsers.has(userData.user.id) && (
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Materiais Consumidos</h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {userData.materials.map((material) => (
                          <div key={material.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div className="flex-1">
                              <p className="font-medium">{material.material.name}</p>
                              <p className="text-sm text-gray-600">
                                Código: {material.material.code} | Qtd: {material.quantity} {material.material.unit}
                              </p>
                              {material.service_order && (
                                <p className="text-xs text-gray-500">
                                  OS: {material.service_order.number}
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(userData.user.id);
                                setSelectedMaterial(material.material.id);
                              }}
                              className="ml-2"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Baixas Registradas</h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {userData.adjustments.map((adjustment) => (
                          <div key={adjustment.id} className="p-3 bg-red-50 rounded border-l-4 border-red-400">
                            <p className="font-medium">{adjustment.material.name}</p>
                            <p className="text-sm text-gray-600">
                              Redução: {adjustment.quantity_reduced} | SA: {adjustment.sa_code}
                            </p>
                            {adjustment.reason && (
                              <p className="text-xs text-gray-500">
                                Motivo: {adjustment.reason}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              {new Date(adjustment.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {selectedUser && selectedMaterial && (
          <MaterialAdjustmentModal
            isOpen={true}
            onClose={() => {
              setSelectedUser(null);
              setSelectedMaterial(null);
            }}
            userId={selectedUser}
            materialId={selectedMaterial}
            onSuccess={handleAdjustmentSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default MaterialControl;
