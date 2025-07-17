
import React, { useState, useMemo } from 'react';
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
import { ChecklistFormSection, ChecklistItem } from "@/components/reports/ChecklistFormSection";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface MaterialConsumption {
  id: string;
  checklist_item: {
    id: string;
    name: string;
  };
  quantity: number;
  created_at: string;
}

interface MaterialAdjustment {
  id: string;
  checklist_item: {
    id: string;
    name: string;
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
  const [openAdjustmentsModal, setOpenAdjustmentsModal] = useState<string | null>(null);
  const [saCodeFilter, setSaCodeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: userMaterials = [], isLoading } = useQuery({
    queryKey: ['user-materials'],
    queryFn: async () => {
      // Buscar todos os relatórios
      let reportsQuery = supabase
        .from('reports')
        .select('id, technician_id, created_at, title, description');
      const { data: reports } = await reportsQuery;
      console.log('DEBUG reports (simplificado):', reports);
      if (!reports) return [];

      // Buscar todos os itens de checklist dos relatórios
      const reportIds = reports.map((r: any) => r.id);
      console.log('DEBUG reportIds:', reportIds);
      // Consulta com filtro para diagnosticar
      const { data: checklistItemsFiltered } = await supabase
        .from('report_checklist_items')
        .select('id, report_id, checklist_item_id, quantity')
        .in('report_id', reportIds);
      console.log('DEBUG checklistItems (com filtro):', checklistItemsFiltered);
      if (!checklistItemsFiltered) return [];

      // Buscar dados dos técnicos
      const technicianIds = Array.from(new Set(reports.map((r: any) => r.technician_id)));
      const { data: technicians } = await supabase
        .from('profiles')
        .select('id, name, email, user_class:user_classes(name)')
        .in('id', technicianIds);
      const technicianMap = new Map<string, any>();
      (technicians || []).forEach((t: any) => {
        technicianMap.set(t.id, t);
      });

      // Agrupar por técnico e por checklist_item
      const userMap = new Map<string, UserMaterials>();
      reports.forEach((report: any) => {
        const userId = report.technician_id;
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            user: technicianMap.get(userId) || { id: userId, name: 'Técnico desconhecido', email: '', user_class: { name: '' } },
            materials: [],
            adjustments: [],
            totalQuantity: 0,
            adjustedQuantity: 0,
            currentQuantity: 0
          });
        }
      });
      // Processar materiais usados por técnico
      checklistItemsFiltered.forEach((item: any) => {
        const report = reports.find((r: any) => r.id === item.report_id);
        if (!report) return;
        const userId = report.technician_id;
        const checklistItemId = item.checklist_item_id;
        if (!checklistItemId) return;
        const userData = userMap.get(userId)!;
        let mat = userData.materials.find((m: any) => m.checklist_item && m.checklist_item.id === checklistItemId);
        if (!mat) {
          mat = {
            id: checklistItemId,
            checklist_item: { id: checklistItemId, name: checklistItemId }, // nome será ajustado abaixo
            quantity: 0,
            created_at: report.created_at
          };
          userData.materials.push(mat);
        }
        mat.quantity += item.quantity || 1;
        userData.totalQuantity += item.quantity || 1;
      });
      // Buscar nomes e categorias dos checklist_items
      const checklistItemIds = Array.from(new Set(checklistItemsFiltered.map((item: any) => item.checklist_item_id)));
      const { data: checklistItemsData } = await supabase
        .from('checklist_items')
        .select('id, name, category')
        .in('id', checklistItemIds);
      console.log('DEBUG checklistItemsData:', checklistItemsData);
      // Filtrar apenas os itens de categoria 'materiais' (case insensitive)
      const materialChecklistItemIds = new Set(
        (checklistItemsData || [])
          .filter((ci: any) => ci.category && ci.category.toLowerCase() === 'materiais')
          .map((ci: any) => ci.id)
      );
      // Map para nomes dos checklist_items
      const checklistItemMap = new Map<string, string>();
      (checklistItemsData || []).forEach((ci: any) => {
        checklistItemMap.set(ci.id, ci.name);
      });
      // Atualizar nomes dos materiais e filtrar só materiais
      userMap.forEach((userData) => {
        // Filtrar só materiais
        userData.materials = userData.materials.filter((mat: any) =>
          materialChecklistItemIds.has(mat.id)
        );
        userData.materials.forEach((mat: any) => {
          const ci = (checklistItemsData || []).find((ci: any) => ci.id === mat.id);
          mat.checklist_item.name = ci ? ci.name : mat.id;
        });
        // Corrigir cálculo: zerar e somar só os materiais filtrados
        userData.totalQuantity = 0;
        userData.adjustedQuantity = 0;
        userData.currentQuantity = 0;
        userData.materials.forEach((mat: any) => {
          userData.totalQuantity += mat.quantity;
        });
      });
      // Buscar baixas já registradas
      const { data: adjustments } = await supabase
        .from('material_adjustments')
        .select('id, user_id, checklist_item_id, quantity_reduced, sa_code, reason, created_at');
      adjustments?.forEach((adj: any) => {
        if (!userMap.has(adj.user_id)) return;
        if (!materialChecklistItemIds.has(adj.checklist_item_id)) return; // só materiais
        const userData = userMap.get(adj.user_id)!;
        userData.adjustments.push({
          id: adj.id,
          checklist_item: { id: adj.checklist_item_id, name: checklistItemMap.get(adj.checklist_item_id) || adj.checklist_item_id },
          quantity_reduced: adj.quantity_reduced,
          sa_code: adj.sa_code,
          reason: adj.reason,
          created_at: adj.created_at
        });
        userData.adjustedQuantity += adj.quantity_reduced;
        // Subtrai do material correspondente
        const mat = userData.materials.find((m: any) => m.checklist_item.id === adj.checklist_item_id);
        if (mat) {
          mat.quantity -= adj.quantity_reduced;
        }
      });
      userMap.forEach((userData) => {
        userData.currentQuantity = userData.totalQuantity - userData.adjustedQuantity;
      });
      const result = Array.from(userMap.values());
      console.log('DEBUG userMaterials result:', result);
      return result;
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

  // Numeração sequencial global dos relatórios (mais antigo = 1)
  const reportSequenceMap = useMemo(() => {
    // Buscar todos os relatórios para criar a numeração sequencial
    const allReports = userMaterials.flatMap(userData => 
      userData.materials.map(material => ({
        id: material.id,
        created_at: material.created_at
      }))
    );
    const sorted = [...allReports].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const map: Record<string, number> = {};
    sorted.forEach((report, idx) => {
      map[report.id] = idx + 1;
    });
    return map;
  }, [userMaterials]);

  // Filtro local
  const filteredUserMaterials = useMemo(() => {
    return userMaterials.filter(userData => {
      const technicianMatch = !technicianFilter || (userData.user.name && userData.user.name.toLowerCase().includes(technicianFilter.toLowerCase()));
      const userClassMatch = userClassFilter === 'all' || (userData.user.user_class && userData.user.user_class.name === userClassFilter);
      const serviceNumberMatch = !serviceNumberFilter || userData.materials.some(mat => mat.id && mat.id.toLowerCase().includes(serviceNumberFilter.toLowerCase()));
      // Filtro por código da SA (já aplicado depois, mas pode ser incluído aqui se preferir)
      return technicianMatch && userClassMatch && serviceNumberMatch;
    });
  }, [userMaterials, technicianFilter, userClassFilter, serviceNumberFilter]);

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
    if (!dateFrom || !dateTo) {
      toast({ title: "Selecione as duas datas.", variant: "destructive" });
      return;
    }
    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    if (diffDays > 92) {
      toast({ title: "O intervalo máximo permitido é de 3 meses.", variant: "destructive" });
      return;
    }
    if (end < start) {
      toast({ title: "A data final deve ser maior que a inicial.", variant: "destructive" });
      return;
    }
    // Exportar apenas movimentações (ajustes) dentro do intervalo de datas
    const adjustments = userMaterials.flatMap(userData =>
      userData.adjustments
        .filter(adj => adj.created_at >= dateFrom && adj.created_at <= dateTo + 'T23:59:59')
        .map(adj => {
          // Converta objetos/arrays para string JSON
          const safeAdj = Object.fromEntries(
            Object.entries(adj).map(([key, value]) => {
              if (typeof value === "object" && value !== null) {
                return [key, JSON.stringify(value)];
              }
              return [key, value];
            })
          );
          return {
            ...safeAdj,
            tecnico_nome: userData.user.name || "",
            material_nome: adj.checklist_item?.name || ""
          };
        })
    );
    if (!adjustments || adjustments.length === 0) {
      toast({ title: "Nenhuma movimentação encontrada no período selecionado.", variant: "destructive" });
      return;
    }
    exportToCSV(adjustments, `movimentacoes_materiais_${dateFrom}_a_${dateTo}`);
    toast({
      title: "Exportação concluída",
      description: "O arquivo CSV foi baixado com sucesso",
    });
  };

  // Filtro por código da SA
  const filteredUserMaterialsForSA = saCodeFilter.trim() === ""
    ? filteredUserMaterials
    : filteredUserMaterials.filter(userData =>
        userData.adjustments.some(adj => adj.sa_code && adj.sa_code.toString().includes(saCodeFilter.trim()))
      );

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

  console.log('userMaterials antes do map:', userMaterials);
  return (
    <div className="min-h-screen bg-fiber-gradient p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Controle de Materiais</h1>
            <div className="flex gap-2 items-end">
              <div>
                <label className="block text-xs">Data Início</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="border rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-xs">Data Fim</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="border rounded px-2 py-1"
                />
              </div>
              <Button onClick={handleExportCSV} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-4 items-end">
            {/* Filtro por Técnico */}
            <div className="flex flex-col md:w-64 w-full">
              <label htmlFor="tecnicoFilter" className="block text-sm font-medium text-gray-700">Filtrar por Técnico</label>
              <Input
                id="tecnicoFilter"
                type="text"
                placeholder="Nome do técnico..."
                value={technicianFilter}
                onChange={(e) => setTechnicianFilter(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            {/* Classe do Usuário */}
            <div className="flex flex-col md:w-64 w-full">
              <label htmlFor="classeUsuarioFilter" className="block text-sm font-medium text-gray-700">Classe do Usuário</label>
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
            {/* Número da OS */}
            <div className="flex flex-col md:w-64 w-full">
              <label htmlFor="osNumberFilter" className="block text-sm font-medium text-gray-700">Número da OS</label>
              <Input
                id="osNumberFilter"
                type="text"
                placeholder="Número da ordem de serviço..."
                value={serviceNumberFilter}
                onChange={(e) => setServiceNumberFilter(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            {/* Código da SA */}
            <div className="flex flex-col md:w-64 w-full">
              <label htmlFor="saCodeFilter" className="block text-sm font-medium text-gray-700">Código da SA</label>
              <Input
                id="saCodeFilter"
                type="text"
                value={saCodeFilter}
                onChange={e => setSaCodeFilter(e.target.value)}
                placeholder="Filtrar por código da SA"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredUserMaterialsForSA.map((userData) => {
            console.log('Entrou no map de userMaterials para usuário:', userData.user?.name || userData.user?.id);
            const sortedAdjustments = [...userData.adjustments].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            console.log('Ordem final dos ajustes para usuário', userData.user.name, ':', sortedAdjustments.map(a => a.created_at));
            return (
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
                        <div className="space-y-2 max-h-60 overflow-y-auto break-words whitespace-normal">
                          {userData.materials.map((material) => (
                            <div key={material.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <div className="flex-1">
                                <p className="font-medium">
                                  Nº {reportSequenceMap[material.id]}: {material.checklist_item.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Quantidade: {material.quantity}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="min-w-[44px] min-h-[44px] self-center ml-2"
                                onClick={() => {
                                  setSelectedUser(userData.user.id);
                                  setSelectedMaterial(material.id);
                                }}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">Baixas Registradas</h3>
                          {userData.adjustments.length > 3 && (
                            <Dialog open={openAdjustmentsModal === userData.user.id} onOpenChange={open => setOpenAdjustmentsModal(open ? userData.user.id : null)}>
                              <DialogTrigger asChild>
                                <button className="text-blue-600 underline text-sm ml-2">Ver todas</button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Todas as Baixas Registradas</DialogTitle>
                                </DialogHeader>
                                <div className="flex flex-col max-h-96 overflow-y-auto space-y-2 mt-2">
                                  {sortedAdjustments.map((adjustment) => (
                                    <div key={adjustment.id} className="p-3 bg-red-50 rounded border-l-4 border-red-400">
                                      <p className="font-medium">{adjustment.checklist_item.name}</p>
                                      <p className="text-sm text-gray-600">
                                        Redução: {adjustment.quantity_reduced} | SA: {adjustment.sa_code}
                                      </p>
                                      {adjustment.reason && (
                                        <p className="text-xs text-gray-500">
                                          Motivo: {adjustment.reason}
                                        </p>
                                      )}
                                      <p className="text-xs text-gray-400">
                                        {new Date(adjustment.created_at).toLocaleString('pt-BR')}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                        <div className="flex flex-col space-y-2 max-h-60 overflow-y-auto break-words whitespace-normal">
                          {(sortedAdjustments.slice(0, 3)).map((adjustment) => (
                            <div key={adjustment.id} className="p-3 bg-red-50 rounded border-l-4 border-red-400">
                              <p className="font-medium">{adjustment.checklist_item.name}</p>
                              <p className="text-sm text-gray-600">
                                Redução: {adjustment.quantity_reduced} | SA: {adjustment.sa_code}
                              </p>
                              {adjustment.reason && (
                                <p className="text-xs text-gray-500">
                                  Motivo: {adjustment.reason}
                                </p>
                              )}
                              <p className="text-xs text-gray-400">
                                {new Date(adjustment.created_at).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          ))}
                          {userData.adjustments.length === 0 && (
                            <p className="text-sm text-gray-500">Nenhuma baixa registrada.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {selectedUser && selectedMaterial && (
          <MaterialAdjustmentModal
            isOpen={true}
            onClose={() => {
              setSelectedUser(null);
              setSelectedMaterial(null);
            }}
            userId={selectedUser}
            checklistItemId={selectedMaterial}
            onSuccess={handleAdjustmentSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default MaterialControl;
