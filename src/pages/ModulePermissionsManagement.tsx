import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ModulePermissionsService, ModulePermission } from '@/services/core/modulePermissionsService';
import { ProfilesService, Profile } from '@/services/core/profilesService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Shield, Plus, Trash2 } from 'lucide-react';

const ModulePermissionsManagement: React.FC = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { checkModule } = useAuthorization();

  const [search, setSearch] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<string>('all');
  const [editing, setEditing] = useState<ModulePermission | null>(null);
  const [form, setForm] = useState<Partial<ModulePermission>>({
    profile_id: '',
    module_name: '',
    can_read: false,
    can_create: false,
    can_edit: false,
    can_delete: false
  });

  const { data: canRead } = useQuery({ 
    queryKey: ['perm', 'module_permissions', 'read'], 
    queryFn: () => checkModule('core', 'read') 
  });
  const { data: canCreate } = useQuery({ 
    queryKey: ['perm', 'module_permissions', 'create'], 
    queryFn: () => checkModule('core', 'create') 
  });
  const { data: canEdit } = useQuery({ 
    queryKey: ['perm', 'module_permissions', 'edit'], 
    queryFn: () => checkModule('core', 'edit') 
  });
  const { data: canDelete } = useQuery({ 
    queryKey: ['perm', 'module_permissions', 'delete'], 
    queryFn: () => checkModule('core', 'delete') 
  });

  const { data: profiles } = useQuery({
    queryKey: ['core', 'profiles'],
    queryFn: () => ProfilesService.list(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['core', 'module_permissions', { search, profileId: selectedProfile }],
    queryFn: () => ModulePermissionsService.list({ 
      search, 
      profileId: selectedProfile === 'all' ? undefined : selectedProfile 
    }),
    enabled: canRead !== false,
  });

  const availableModules = ModulePermissionsService.getAvailableModules();

  const createMutation = useMutation({
    mutationFn: (newPermission: any) => ModulePermissionsService.create(newPermission),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['core', 'module_permissions'] });
      setForm({
        profile_id: '',
        module_name: '',
        can_read: false,
        can_create: false,
        can_edit: false,
        can_delete: false
      });
      toast({ title: 'Permissão de módulo criada com sucesso!' });
    },
    onError: (error: any) => toast({ 
      title: 'Erro ao criar permissão', 
      description: error?.message || String(error), 
      variant: 'destructive' 
    })
  });

  const updateMutation = useMutation({
    mutationFn: (updatedPermission: any) => editing ? ModulePermissionsService.update(editing.id, updatedPermission) : Promise.resolve(null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['core', 'module_permissions'] });
      setEditing(null);
      setForm({
        profile_id: '',
        module_name: '',
        can_read: false,
        can_create: false,
        can_edit: false,
        can_delete: false
      });
      toast({ title: 'Permissão de módulo atualizada com sucesso!' });
    },
    onError: (error: any) => toast({ 
      title: 'Erro ao atualizar permissão', 
      description: error?.message || String(error), 
      variant: 'destructive' 
    })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ModulePermissionsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['core', 'module_permissions'] });
      toast({ title: 'Permissão de módulo removida com sucesso!' });
    },
    onError: (error: any) => toast({ 
      title: 'Erro ao remover permissão', 
      description: error?.message || String(error), 
      variant: 'destructive' 
    })
  });

  const filtered = useMemo(() => data || [], [data]);

  const getProfileName = (profileId: string) => {
    const profile = profiles?.find(p => p.id === profileId);
    return profile?.nome || 'Perfil não encontrado';
  };

  if (canRead === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Permissões por Módulo</CardTitle>
        </CardHeader>
        <CardContent>
          Você não tem permissão para visualizar permissões de módulo.
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissões por Módulo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Input 
              placeholder="Buscar por módulo" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="max-w-sm"
            />
            <Select value={selectedProfile} onValueChange={setSelectedProfile}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os perfis</SelectItem>
                {profiles?.map(profile => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canCreate && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setForm({
                      profile_id: '',
                      module_name: '',
                      can_read: false,
                      can_create: false,
                      can_edit: false,
                      can_delete: false
                    });
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Permissão
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Permissão de Módulo</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <Select value={form.profile_id || ''} onValueChange={(value) => setForm(s => ({ ...s, profile_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar perfil" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles?.map(profile => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={form.module_name || ''} onValueChange={(value) => setForm(s => ({ ...s, module_name: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar módulo" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModules.map(module => (
                          <SelectItem key={module} value={module}>
                            {module}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={form.can_read || false} 
                          onCheckedChange={(checked) => setForm(s => ({ ...s, can_read: checked }))} 
                        />
                        <label>Ler</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={form.can_create || false} 
                          onCheckedChange={(checked) => setForm(s => ({ ...s, can_create: checked }))} 
                        />
                        <label>Criar</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={form.can_edit || false} 
                          onCheckedChange={(checked) => setForm(s => ({ ...s, can_edit: checked }))} 
                        />
                        <label>Editar</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={form.can_delete || false} 
                          onCheckedChange={(checked) => setForm(s => ({ ...s, can_delete: checked }))} 
                        />
                        <label>Excluir</label>
                      </div>
                    </div>
                    <Button 
                      onClick={() => createMutation.mutate(form)} 
                      disabled={createMutation.isPending || !form.profile_id || !form.module_name}
                    >
                      Salvar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Perfil</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>Ler</TableHead>
                <TableHead>Criar</TableHead>
                <TableHead>Editar</TableHead>
                <TableHead>Excluir</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7}>Carregando...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>Nenhuma permissão encontrada</TableCell>
                </TableRow>
              ) : (
                filtered.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell>{getProfileName(permission.profile_id || '')}</TableCell>
                    <TableCell>{permission.module_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${permission.can_read ? 'bg-green-500' : 'bg-gray-300'}`} />
                        {permission.can_read ? 'Sim' : 'Não'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${permission.can_create ? 'bg-green-500' : 'bg-gray-300'}`} />
                        {permission.can_create ? 'Sim' : 'Não'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${permission.can_edit ? 'bg-green-500' : 'bg-gray-300'}`} />
                        {permission.can_edit ? 'Sim' : 'Não'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${permission.can_delete ? 'bg-green-500' : 'bg-gray-300'}`} />
                        {permission.can_delete ? 'Sim' : 'Não'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {canEdit && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setEditing(permission);
                              setForm(permission);
                            }}
                          >
                            Editar
                          </Button>
                        )}
                        {canDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover esta permissão de módulo?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMutation.mutate(permission.id)}>
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(open) => {
        if (!open) {
          setEditing(null);
          setForm({
            profile_id: '',
            module_name: '',
            can_read: false,
            can_create: false,
            can_edit: false,
            can_delete: false
          });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Permissão de Módulo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Select value={form.profile_id || ''} onValueChange={(value) => setForm(s => ({ ...s, profile_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar perfil" />
              </SelectTrigger>
              <SelectContent>
                {profiles?.map(profile => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={form.module_name || ''} onValueChange={(value) => setForm(s => ({ ...s, module_name: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar módulo" />
              </SelectTrigger>
              <SelectContent>
                {availableModules.map(module => (
                  <SelectItem key={module} value={module}>
                    {module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={form.can_read || false} 
                  onCheckedChange={(checked) => setForm(s => ({ ...s, can_read: checked }))} 
                />
                <label>Ler</label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={form.can_create || false} 
                  onCheckedChange={(checked) => setForm(s => ({ ...s, can_create: checked }))} 
                />
                <label>Criar</label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={form.can_edit || false} 
                  onCheckedChange={(checked) => setForm(s => ({ ...s, can_edit: checked }))} 
                />
                <label>Editar</label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={form.can_delete || false} 
                  onCheckedChange={(checked) => setForm(s => ({ ...s, can_delete: checked }))} 
                />
                <label>Excluir</label>
              </div>
            </div>
            <Button 
              onClick={() => updateMutation.mutate(form)} 
              disabled={!canEdit || updateMutation.isPending || !form.profile_id || !form.module_name}
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModulePermissionsManagement;
