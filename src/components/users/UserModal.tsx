
// @ts-nocheck

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { coreSupabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserCompaniesService } from '@/services/core/userCompaniesService';
import { CompaniesService } from '@/services/core/companiesService';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
}

const UserModal = ({ isOpen, onClose, user }: UserModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    phone: '',
    profileId: '',
    managerId: '',
    password: '',
    companies: [] as string[], // IDs das empresas
    primaryCompanyId: '' as string // ID da empresa primária
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar perfis
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles-modal'],
    queryFn: async () => {
      const { data, error } = await coreSupabase
        .from('core.profiles')
        .select('id, nome')
        .order('nome');
      
      if (error) throw error;
      return data;
    }
  });

  // Buscar gestores (usuários com perfil de gestor)
  const { data: managers = [] } = useQuery({
    queryKey: ['managers'],
    queryFn: async () => {
      const { data, error } = await coreSupabase
        .from('core.users')
        .select(`
          id, 
          name,
          profiles!inner(nome)
        `)
        .eq('is_active', true)
        .ilike('profiles.nome', '%gestor%')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Buscar todas as empresas disponíveis
  const { data: availableCompanies = [] } = useQuery({
    queryKey: ['all-companies'],
    queryFn: async () => {
      const { data, error } = await coreSupabase
        .from('core.companies')
        .select('id, razao_social, nome_fantasia')
        .eq('is_active', true)
        .order('razao_social');
      if (error) throw error;
      return data;
    }
  });

  // Buscar empresas do usuário (apenas para edição)
  const { data: userCompanies = [] } = useQuery({
    queryKey: ['user-companies', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await UserCompaniesService.getUserCompanies(user.id);
    },
    enabled: !!user?.id
  });

  // Separar os efeitos para evitar loops infinitos
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        username: user.username || '',
        phone: user.phone || '',
        profileId: user.profile_id || '',
        managerId: user.manager_id || '',
        password: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        name: '',
        email: '',
        username: '',
        phone: '',
        profileId: '',
        managerId: '',
        password: ''
      }));
    }
  }, [user]);

  // Efeito separado para empresas - usar apenas quando realmente necessário
  useEffect(() => {
    if (user && userCompanies) {
      const companyIds = userCompanies.map(uc => uc.company_id);
      const primaryCompany = userCompanies.find(uc => uc.is_primary);
      setFormData(prev => ({
        ...prev,
        companies: companyIds,
        primaryCompanyId: primaryCompany?.company_id || ''
      }));
    } else if (!user) {
      setFormData(prev => ({
        ...prev,
        companies: [],
        primaryCompanyId: ''
      }));
    }
  }, [user?.id, userCompanies?.length]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (user) {
        // Montar payload sem campos nulos
        const updatePayload: any = {
          name: data.name,
          username: data.username,
          phone: data.phone,
          profile_id: data.profileId || null,
        };
        if (data.managerId) updatePayload.manager_id = data.managerId;
        console.log('Payload final do update:', updatePayload);
        const { data: updateData, error } = await coreSupabase
          .from('core.users')
          .update(updatePayload)
          .eq('id', user.id)
          .select();
        console.log('Resposta do update:', updateData, error);
        if (error) throw error;
        if (!updateData || updateData.length === 0) {
          throw new Error('Nenhuma linha foi atualizada. Verifique se o ID do usuário está correto e se os dados realmente mudaram.');
        }

        // Gerenciar empresas do usuário
        const currentCompanyIds = userCompanies.map(uc => uc.company_id);
        const newCompanyIds = data.companies;

        // Remover empresas que não estão mais na lista
        const companiesToRemove = currentCompanyIds.filter(id => !newCompanyIds.includes(id));
        for (const companyId of companiesToRemove) {
          await UserCompaniesService.removeUserFromCompany(user.id, companyId);
        }

        // Adicionar novas empresas
        const companiesToAdd = newCompanyIds.filter(id => !currentCompanyIds.includes(id));
        for (const companyId of companiesToAdd) {
          await UserCompaniesService.addUserToCompany({
            user_id: user.id,
            company_id: companyId,
            profile_id: data.profileId || null,
            is_primary: companyId === data.primaryCompanyId
          });
        }

        // Atualizar empresa primária se necessário
        if (data.primaryCompanyId && newCompanyIds.includes(data.primaryCompanyId)) {
          await UserCompaniesService.setPrimaryCompany(user.id, data.primaryCompanyId);
        }

      } else {
        // Criar novo usuário usando Edge Function
        if (!user) {
          // Log do payload antes de enviar para create-user
          console.log('Payload enviado para create-user:', {
            email: data.email,
            password: data.password,
            name: data.name,
            username: data.username,
            phone: data.phone,
            profileId: data.profileId,
            managerId: data.managerId
          });
        }
        const { data: result, error: createError } = await supabase.functions.invoke('create-user', {
          body: {
            email: data.email,
            password: data.password,
            name: data.name,
            username: data.username,
            phone: data.phone,
            profileId: data.profileId,
            managerId: data.managerId
          }
        });
        
        if (createError) {
          console.error('Create user error:', createError);
          throw createError;
        }
        
        if (result?.error) {
          console.error('Create user function error:', result.error);
          throw new Error(result.error);
        }

        // Adicionar empresas ao novo usuário
        if (result?.user?.id && data.companies.length > 0) {
          for (const companyId of data.companies) {
            await UserCompaniesService.addUserToCompany({
              user_id: result.user.id,
              company_id: companyId,
              profile_id: data.profileId || null,
              is_primary: companyId === data.primaryCompanyId
            });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: user ? "Usuário atualizado" : "Usuário criado",
        description: `O usuário foi ${user ? 'atualizado' : 'criado'} com sucesso.`,
      });
      onClose();
    },
    onError: (error) => {
      console.error('Error creating/updating user:', error);
      toast({
        title: "Erro",
        description: `Não foi possível ${user ? 'atualizar' : 'criar'} o usuário.`,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || (!user && !formData.email.trim())) {
      toast({
        title: "Erro",
        description: "Nome e email são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (formData.companies.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos uma empresa.",
        variant: "destructive",
      });
      return;
    }

    if (formData.companies.length > 0 && !formData.primaryCompanyId) {
      toast({
        title: "Erro",
        description: "Selecione uma empresa primária.",
        variant: "destructive",
      });
      return;
    }
    
    if (!user && !formData.password) {
      toast({
        title: "Erro",
        description: "Senha é obrigatória para novos usuários.",
        variant: "destructive",
      });
      return;
    }
    
    mutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {user ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
          </DialogTitle>
          <DialogDescription>
            {user 
              ? 'Edite as informações do usuário.'
              : 'Preencha os dados para criar um novo usuário.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o nome completo"
              required
            />
          </div>
          
          {!user && (
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Digite o email"
                required
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="username">Nome de Usuário *</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Digite o nome de usuário"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Digite o telefone"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="profile">Perfil</Label>
            <Select value={formData.profileId} onValueChange={(value) => setFormData(prev => ({ ...prev, profileId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um perfil" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="manager">Gestor</Label>
            <Select value={formData.managerId} onValueChange={(value) => setFormData(prev => ({ ...prev, managerId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um gestor" />
              </SelectTrigger>
              <SelectContent>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Empresas *</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
              {availableCompanies.map((company) => (
                <div key={company.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`company-${company.id}`}
                    checked={formData.companies.includes(company.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData(prev => ({
                          ...prev,
                          companies: [...prev.companies, company.id]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          companies: prev.companies.filter(id => id !== company.id)
                        }));
                      }
                    }}
                  />
                  <Label 
                    htmlFor={`company-${company.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {company.razao_social}
                    {company.nome_fantasia && (
                      <span className="text-muted-foreground ml-1">
                        ({company.nome_fantasia})
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
            {formData.companies.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Selecione pelo menos uma empresa
              </p>
            )}
          </div>

          {/* Seleção de Empresa Primária */}
          {formData.companies.length > 0 && (
            <div className="space-y-2">
              <Label>Empresa Primária</Label>
              <Select 
                value={formData.primaryCompanyId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, primaryCompanyId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa primária" />
                </SelectTrigger>
                <SelectContent>
                  {formData.companies.map(companyId => {
                    const company = availableCompanies.find(c => c.id === companyId);
                    return company ? (
                      <SelectItem key={companyId} value={companyId}>
                        {company.razao_social}
                        {company.nome_fantasia && ` (${company.nome_fantasia})`}
                      </SelectItem>
                    ) : null;
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                A empresa primária será a padrão quando o usuário fizer login
              </p>
            </div>
          )}
          
          {!user && (
            <div className="space-y-2">
              <Label htmlFor="password">Senha Provisória *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Digite uma senha provisória"
                required
                minLength={6}
              />
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending 
                ? 'Salvando...' 
                : user ? 'Atualizar' : 'Criar Usuário'
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserModal;
