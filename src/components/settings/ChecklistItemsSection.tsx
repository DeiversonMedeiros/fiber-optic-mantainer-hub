
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type ChecklistCategory = 'acessorios' | 'cabos' | 'caixas' | 'servicos' | 'outros';

const ChecklistItemsSection = () => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<ChecklistCategory>('acessorios');
  const [selectedClass, setSelectedClass] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const categories = [
    { value: 'acessorios', label: 'Acessórios' },
    { value: 'cabos', label: 'Cabos' },
    { value: 'caixas', label: 'Caixas' },
    { value: 'servicos', label: 'Serviços' },
    { value: 'outros', label: 'Outros' }
  ];

  const { data: userClasses = [] } = useQuery({
    queryKey: ['user-classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_classes')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: checklistItems = [] } = useQuery({
    queryKey: ['checklist-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_items')
        .select(`
          *,
          user_classes!inner(name)
        `)
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (items: Array<{ name: string; category: ChecklistCategory; user_class_id: string }>) => {
      const { error } = await supabase
        .from('checklist_items')
        .insert(items);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      toast({
        title: "Item criado",
        description: "O item foi adicionado com sucesso.",
      });
      setNewItemName('');
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o item.",
        variant: "destructive",
      });
    }
  });

  const deleteMutation = useMutation({
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
        description: "O item foi removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o item.",
        variant: "destructive",
      });
    }
  });

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !selectedClass) return;

    createMutation.mutate([{
      name: newItemName.trim(),
      category: newItemCategory,
      user_class_id: selectedClass
    }]);
  };

  const groupedItems = checklistItems.reduce((acc, item) => {
    const className = item.user_classes?.name || 'Sem Classe';
    if (!acc[className]) {
      acc[className] = {};
    }
    if (!acc[className][item.category]) {
      acc[className][item.category] = [];
    }
    acc[className][item.category].push(item);
    return acc;
  }, {} as Record<string, Record<string, any[]>>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Novo Item</CardTitle>
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
                <Label htmlFor="item-category">Categoria</Label>
                <Select value={newItemCategory} onValueChange={(value: ChecklistCategory) => setNewItemCategory(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-class">Classe</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {userClasses.map(userClass => (
                      <SelectItem key={userClass.id} value={userClass.id}>
                        {userClass.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Item
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Itens do Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={Object.keys(groupedItems)[0]} className="space-y-4">
            <TabsList className="grid w-full grid-cols-auto">
              {Object.keys(groupedItems).map(className => (
                <TabsTrigger key={className} value={className}>
                  {className}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(groupedItems).map(([className, categories]) => (
              <TabsContent key={className} value={className} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(categories).map(([category, items]) => (
                    <Card key={category}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {categories.find(cat => cat.value === category)?.label || category}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {items.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                              <span>{item.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteMutation.mutate(item.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          {items.length === 0 && (
                            <p className="text-gray-500 text-sm">Nenhum item nesta categoria</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChecklistItemsSection;
