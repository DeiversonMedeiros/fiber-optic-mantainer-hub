
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = {
  acessorios: 'Acessórios',
  cabos: 'Cabos',
  caixas: 'Caixas',
  servicos: 'Serviços',
  outros: 'Outros'
};

const ChecklistItemsSection = () => {
  const [newItemName, setNewItemName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userClasses } = useQuery({
    queryKey: ['user-classes-for-checklist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_classes')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: checklistItems } = useQuery({
    queryKey: ['checklist-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_items')
        .select(`
          *,
          user_classes (
            id,
            name
          )
        `)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: { name: string; category: string; user_class_id: string }) => {
      const { error } = await supabase
        .from('checklist_items')
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      setNewItemName('');
      setSelectedCategory('');
      setSelectedClass('');
      toast({
        title: "Item criado",
        description: "O item do checklist foi criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar item",
        description: "Não foi possível criar o item do checklist.",
        variant: "destructive",
      });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('checklist_items')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      toast({
        title: "Item excluído",
        description: "O item do checklist foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o item do checklist.",
        variant: "destructive",
      });
    }
  });

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !selectedCategory || !selectedClass) return;
    
    createItemMutation.mutate({
      name: newItemName.trim(),
      category: selectedCategory,
      user_class_id: selectedClass
    });
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      deleteItemMutation.mutate(id);
    }
  };

  const filteredItems = checklistItems?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = !activeTab || item.user_class_id === activeTab;
    return matchesSearch && matchesTab;
  });

  const groupedItems = filteredItems?.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Checklist de Itens</h2>
        <p className="text-gray-600">Gerencie os itens do checklist organizados por classe e categoria</p>
      </div>

      {/* Formulário de criação */}
      <Card>
        <CardHeader>
          <CardTitle>Cadastrar Novo Item</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-name">Nome do Item</Label>
                <Input
                  id="item-name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Digite o nome do item"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">Classe</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {userClasses?.map((userClass) => (
                      <SelectItem key={userClass.id} value={userClass.id}>
                        {userClass.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={createItemMutation.isPending}>
              <Plus className="w-4 h-4 mr-2" />
              {createItemMutation.isPending ? 'Criando...' : 'Criar Item'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Filtros e visualização */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar itens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-auto">
            <TabsTrigger value="">Todas as Classes</TabsTrigger>
            {userClasses?.map((userClass) => (
              <TabsTrigger key={userClass.id} value={userClass.id}>
                {userClass.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {Object.entries(CATEGORIES).map(([categoryKey, categoryLabel]) => {
              const categoryItems = groupedItems?.[categoryKey] || [];
              
              if (categoryItems.length === 0) return null;

              return (
                <Card key={categoryKey} className="mb-4">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {categoryLabel}
                      <Badge variant="secondary">{categoryItems.length} itens</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">
                              Classe: {item.user_classes?.name}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ChecklistItemsSection;
