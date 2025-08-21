import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Package, PackageX, Scissors, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import MaterialAdjustmentModal from '@/components/materials/MaterialAdjustmentModal';
import MaterialChargeModal from '@/components/materials/MaterialChargeModal';
import MaterialChargeWithdrawalModal from '@/components/materials/MaterialChargeWithdrawalModal';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { exportToCSV } from '@/utils/csvExport';

const MaterialControl = () => {
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [technicianFilter, setTechnicianFilter] = useState('');
  const [userClassFilter, setUserClassFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const { toast } = useToast();
  const [openAdjustmentsModal, setOpenAdjustmentsModal] = useState<string | null>(null);
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [selectedChargeItem, setSelectedChargeItem] = useState<any>(null);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [selectedWithdrawalItem, setSelectedWithdrawalItem] = useState<any>(null);
  
  // 🆕 Estados para lazy loading e paginação
  const [loadedUsers, setLoadedUsers] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(15);

  // 🆕 Query para buscar apenas lista básica de usuários
  const { data: userList = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users-basic'],
    queryFn: async () => {
      console.log('👥 Carregando lista básica de usuários...');
      
      const { data: activeUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, email, user_class:user_classes(id, name)')
        .eq('is_active', true);

      if (usersError) throw usersError;
      console.log(`✅ ${activeUsers?.length || 0} usuários ativos carregados`);
      
      return activeUsers || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,   // 10 minutos
  });

  // 🆕 Resetar página e usuários expandidos quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
    setExpandedUsers(new Set());
  }, [technicianFilter, userClassFilter]);

  // 🆕 Função para processar dados de um usuário específico
  const processUserData = (userId: string, validatedAgg: any[], chargesAgg: any[], adjustmentsAgg: any[], classMaterials: any[]) => {
    const user = userList.find((u: any) => u.id === userId);
    if (!user) return null;

    const userData = {
      user,
      materials: [],
      adjustments: [],
      charges: [],
      totalQuantity: 0,
      adjustedQuantity: 0,
      currentQuantity: 0,
      chargeQuantity: 0,
      withdrawnQuantity: 0,
      balance: 0,
      requestQuantity: 0
    };

    // Criar materiais da classe
    classMaterials.forEach((materialData) => {
      const material = {
        id: materialData.id,
        checklist_item: { id: materialData.id, name: materialData.name },
        quantity: 0,
        chargeQuantity: 0,
        withdrawnQuantity: 0,
        netChargeQuantity: 0,
        balance: 0,
        requestQuantity: 0,
        standard_quantity: materialData.standard_quantity || 0,
        created_at: new Date().toISOString()
      };
      userData.materials.push(material);
    });

    // Processar validados
    (validatedAgg || []).forEach((row: any) => {
      if (row.technician_id === userId) {
        const material = userData.materials.find((m: any) => m.checklist_item.id === row.checklist_item_id);
        if (material) {
          material.quantity += Number(row.total_quantity) || 0;
          userData.totalQuantity += Number(row.total_quantity) || 0;
        }
      }
    });

    // Processar cargas
    (chargesAgg || []).forEach((row: any) => {
      if (row.user_id === userId) {
        const material = userData.materials.find((m: any) => m.checklist_item.id === row.checklist_item_id);
        if (material) {
          material.chargeQuantity = Number(row.total_quantity_added) || 0;
          material.withdrawnQuantity = Number(row.total_quantity_withdrawn) || 0;
          material.netChargeQuantity = Number(row.net_charge_quantity) || 0;
          
          userData.chargeQuantity += Number(row.total_quantity_added) || 0;
          userData.withdrawnQuantity += Number(row.total_quantity_withdrawn) || 0;
        }
      }
    });

    // Processar ajustes
    (adjustmentsAgg || []).forEach((row: any) => {
      if (row.user_id === userId) {
        const material = userData.materials.find((m: any) => m.checklist_item.id === row.checklist_item_id);
        if (material) {
          userData.adjustedQuantity += Number(row.total_reduced) || 0;
        }
      }
    });

    // Calcular saldos
    userData.materials.forEach((material: any) => {
      material.balance = material.netChargeQuantity - material.quantity;
      const standardQty = material.standard_quantity || 0;
      userData.requestQuantity += Math.max(0, standardQty - material.balance);
    });
    
    userData.balance = userData.chargeQuantity - userData.withdrawnQuantity - userData.totalQuantity;
    userData.currentQuantity = userData.totalQuantity - userData.adjustedQuantity;

    return userData;
  };

  // 🆕 Estado para armazenar dados dos usuários carregados
  const [userMaterialsData, setUserMaterialsData] = useState<Map<string, any>>(new Map());

  // 🆕 Função para obter dados de um usuário (carregados ou vazios)
  const getUserData = (userId: string) => {
    if (userMaterialsData.has(userId)) {
      return userMaterialsData.get(userId);
    }
    
    // Retornar dados básicos se não carregados
    const user = userList.find((u: any) => u.id === userId);
    if (!user) return null;
    
    return {
      user,
      materials: [],
      adjustments: [],
      charges: [],
      totalQuantity: 0,
      adjustedQuantity: 0,
      currentQuantity: 0,
      chargeQuantity: 0,
      withdrawnQuantity: 0,
      balance: 0,
      requestQuantity: 0
    };
  };

  // 🆕 Função para expandir usuário (com lazy loading)
  const handleToggleUser = async (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    
    if (newExpanded.has(userId)) {
      // Fechar usuário
      newExpanded.delete(userId);
    } else {
      // Abrir usuário - carregar dados se necessário
      newExpanded.add(userId);
      if (!loadedUsers.has(userId)) {
        await loadUserData(userId);
      }
    }
    
    setExpandedUsers(newExpanded);
  };

  // 🆕 Função para carregar dados completos de um usuário específico
  const loadUserData = async (userId: string) => {
    if (loadedUsers.has(userId)) return; // Já carregado
    
    console.log(`🔄 Carregando dados completos para usuário ${userId}...`);
    
    try {
      // Buscar dados do usuário específico
      const [
        { data: validatedAgg, error: validatedErr },
        { data: chargesAgg, error: chargesErr },
        { data: adjustmentsAgg, error: adjustmentsErr }
      ] = await Promise.all([
        (supabase as any).rpc('get_validated_materials_by_technicians', { tech_ids: [userId] }),
        (supabase as any).rpc('get_charges_by_users', { user_ids: [userId] }),
        (supabase as any).rpc('get_adjustments_by_users', { user_ids: [userId] })
      ]);

      if (validatedErr) throw validatedErr;
      if (chargesErr || adjustmentsErr) throw chargesErr || adjustmentsErr;

      // Buscar materiais da classe do usuário
      const user = userList.find((u: any) => u.id === userId);
      if (!user?.user_class?.id) return;

      const { data: classMaterials, error: materialsErr } = await supabase
        .from('checklist_items')
        .select('id, name, category, standard_quantity')
        .eq('is_active', true)
        .eq('category', 'materiais')
        .eq('user_class_id', user.user_class.id);
      
      if (materialsErr) throw materialsErr;

      // Processar dados do usuário
      const userData = processUserData(userId, validatedAgg, chargesAgg, adjustmentsAgg, classMaterials);
      
      if (userData) {
        // 🆕 Armazenar dados processados no estado
        setUserMaterialsData(prev => new Map(prev).set(userId, userData));
      }
      
      // Atualizar estado global
      setLoadedUsers(prev => new Set(prev).add(userId));
      
      console.log(`✅ Dados do usuário ${userId} carregados com sucesso`);
      
    } catch (error) {
      console.error(`❌ Erro ao carregar dados do usuário ${userId}:`, error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do usuário.",
        variant: "destructive",
      });
    }
  };

  // 🆕 Filtrar TODOS os usuários ANTES da paginação
  const filteredUsers = userList.filter((userData: any) => {
    const matchesTechnician = userData.name.toLowerCase().includes(technicianFilter.toLowerCase()) ||
      userData.email.toLowerCase().includes(technicianFilter.toLowerCase());
    const matchesUserClass = userClassFilter === 'all' || userData.user_class?.name === userClassFilter;
    return matchesTechnician && matchesUserClass;
  });

  // 🆕 Paginação com usuários FILTRADOS
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Resetar usuários expandidos ao mudar de página
    setExpandedUsers(new Set());
  };

  const handleExportCSV = () => {
    // 🆕 Exportar apenas usuários carregados
    const loadedUserData = Array.from(loadedUsers).map(userId => getUserData(userId)).filter(Boolean);
    
    const csvData = loadedUserData.flatMap((userData: any) =>
      userData.materials.map((material: any) => ({
        'Técnico': userData.user.name,
        'Email': userData.user.email,
        'Classe': userData.user.user_class?.name || 'N/A',
        'Material': material.checklist_item.name,
        'Baixados': material.quantity,
        'Carregados': material.chargeQuantity,
        'Retiradas da Carga': material.withdrawnQuantity || 0,
        'Saldo': material.balance,
        'Solicitar': Math.max(0, (material.standard_quantity || 0) - material.balance)
      }))
    );

    exportToCSV(csvData, 'controle_materiais');
    toast({
      title: "Exportação realizada",
      description: "Os dados foram exportados para CSV com sucesso.",
    });
  };

  if (isLoadingUsers) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando lista de usuários...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Controle de Materiais</h1>
        <Button onClick={handleExportCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder="Filtrar por técnico..."
          value={technicianFilter}
          onChange={(e) => setTechnicianFilter(e.target.value)}
        />
        <Select value={userClassFilter} onValueChange={setUserClassFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por classe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as classes</SelectItem>
            {Array.from(new Set(userList.map((u: any) => u.user_class?.name).filter(Boolean))).map((className) => (
              <SelectItem key={className} value={className!}>
                {className}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 🆕 Contador de usuários e paginação */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Mostrando {paginatedUsers.length} de {filteredUsers.length} usuários filtrados (total: {userList.length})
        </div>
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {paginatedUsers.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-lg text-gray-500">Nenhum usuário encontrado com materiais.</p>
            <p className="text-sm text-gray-400">Verifique o console para logs detalhados.</p>
          </div>
        ) : (
          paginatedUsers.map((userData: any) => {
            // 🆕 Obter dados do usuário (carregados ou vazios)
            const userMaterials = getUserData(userData.id);
            
            return (
              <Card key={userData.id} className="w-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleUser(userData.id)}
                      >
                        {expandedUsers.has(userData.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                      <div>
                        <CardTitle className="text-lg">{userData.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {userData.email} • {userData.user_class?.name || 'Sem classe'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {loadedUsers.has(userData.id) ? (
                          <>
                            Baixados: {userMaterials?.totalQuantity || 0} | 
                            Carregados: {userMaterials?.chargeQuantity || 0} | 
                            Retiradas: {userMaterials?.withdrawnQuantity || 0} | 
                            Saldo: {userMaterials?.balance || 0}
                          </>
                        ) : (
                          <span className="text-gray-400">Clique para carregar dados</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {expandedUsers.has(userData.id) && (
                  <CardContent>
                    {!loadedUsers.has(userData.id) ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="text-lg">Carregando dados do usuário...</div>
                      </div>
                    ) : userMaterials?.materials?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 p-2 text-left">Material</th>
                              <th className="border border-gray-300 p-2 text-center">Padrão</th>
                              <th className="border border-gray-300 p-2 text-center">Carga</th>
                              <th className="border border-gray-300 p-2 text-center">Retiradas</th>
                              <th className="border border-gray-300 p-2 text-center">Baixados</th>
                              <th className="border border-gray-300 p-2 text-center">Saldo</th>
                              <th className="border border-gray-300 p-2 text-center">Solicitar</th>
                              <th className="border border-gray-300 p-2 text-center">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userMaterials.materials.map((material: any) => {
                              const standardQty = material.standard_quantity || 0;
                              const finalRequestQty = Math.max(0, standardQty - material.balance);

                              return (
                                <tr key={material.checklist_item.id}>
                                  <td className="border border-gray-300 p-2">
                                    <div className="font-medium">{material.checklist_item.name}</div>
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center">{standardQty}</td>
                                  <td className="border border-gray-300 p-2 text-center text-blue-600">{material.chargeQuantity}</td>
                                  <td className="border border-gray-300 p-2 text-center text-orange-600">{material.withdrawnQuantity || 0}</td>
                                  <td className="border border-gray-300 p-2 text-center text-red-600">{material.quantity}</td>
                                  <td className={`border border-gray-300 p-2 text-center ${material.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{material.balance}</td>
                                  <td className={`border border-gray-300 p-2 text-center ${finalRequestQty > 0 ? 'text-red-600' : 'text-green-600'}`}>{finalRequestQty}</td>
                                  <td className="border border-gray-300 p-2 text-center">
                                    <div className="flex gap-1 justify-center">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedChargeItem({
                                            userId: userData.id,
                                            checklistItem: {
                                              id: material.checklist_item.id,
                                              name: material.checklist_item.name,
                                              category: 'materiais'
                                            }
                                          });
                                          setIsChargeModalOpen(true);
                                        }}
                                        className="text-green-600 hover:text-green-700"
                                        title="Adicionar Carga"
                                      >
                                        <Package className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedWithdrawalItem({
                                            userId: userData.id,
                                            checklistItem: {
                                              id: material.checklist_item.id,
                                              name: material.checklist_item.name,
                                              currentCharge: material.netChargeQuantity
                                            }
                                          });
                                          setIsWithdrawalModalOpen(true);
                                        }}
                                        className="text-orange-600 hover:text-orange-700"
                                        title="Retirar da Carga"
                                        disabled={material.netChargeQuantity <= 0}
                                      >
                                        <PackageX className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedUser(userData.id);
                                          setSelectedMaterial(material);
                                          setOpenAdjustmentsModal(userData.id);
                                        }}
                                        className="text-red-600 hover:text-red-700"
                                        title="Reduzir Baixa"
                                      >
                                        <Scissors className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center p-8">
                        <p className="text-lg text-gray-500">Nenhum material encontrado para este usuário.</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* 🆕 Paginação inferior */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              Primeira
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="px-4 py-2 text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              Última
            </Button>
          </div>
        </div>
      )}

      {openAdjustmentsModal && selectedMaterial && (
        <MaterialAdjustmentModal
          isOpen={!!openAdjustmentsModal}
          onClose={() => setOpenAdjustmentsModal(null)}
          userId={selectedUser!}
          checklistItemId={selectedMaterial.checklist_item.id}
          onSuccess={() => {
            setOpenAdjustmentsModal(null);
            window.location.reload();
          }}
        />
      )}

      {isChargeModalOpen && selectedChargeItem && (
        <MaterialChargeModal
          isOpen={isChargeModalOpen}
          onClose={() => {
            setIsChargeModalOpen(false);
            setSelectedChargeItem(null);
          }}
          userId={selectedChargeItem.userId}
          checklistItem={selectedChargeItem.checklistItem}
        />
      )}

      {isWithdrawalModalOpen && selectedWithdrawalItem && (
        <MaterialChargeWithdrawalModal
          isOpen={isWithdrawalModalOpen}
          onClose={() => {
            setIsWithdrawalModalOpen(false);
            setSelectedWithdrawalItem(null);
          }}
          userId={selectedWithdrawalItem.userId}
          checklistItem={selectedWithdrawalItem.checklistItem}
        />
      )}
    </div>
  );
};

export default MaterialControl;