import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UsersService, CoreUser, UserCompany } from '@/services/core/usersService';
import { ProfilesService, Profile } from '@/services/core/profilesService';
import { CompaniesService, Company } from '@/services/core/companiesService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useToast } from '@/components/ui/use-toast';

const AccessManagement: React.FC = () => {
  const qc = useQueryClient();
  const { checkModule } = useAuthorization();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<CoreUser | null>(null);
  const [userCompaniesOpen, setUserCompaniesOpen] = useState(false);
  const [ucForm, setUcForm] = useState<Partial<UserCompany>>({});
  const [toDeleteCompanyId, setToDeleteCompanyId] = useState<string | null>(null);

  const { data: canRead } = useQuery({ queryKey: ['perm', 'access', 'read'], queryFn: () => checkModule('core','read') });
  const { data: canEdit } = useQuery({ queryKey: ['perm', 'access', 'edit'], queryFn: () => checkModule('core','edit') });

  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { data: usersPage, isLoading } = useQuery({
    queryKey: ['core','users', search, page],
    queryFn: () => UsersService.list({ search, page, pageSize }),
    enabled: canRead !== false,
  });

  const { data: companies } = useQuery({ queryKey: ['core','companies','all'], queryFn: () => CompaniesService.list(), enabled: userCompaniesOpen });
  const { data: profiles } = useQuery({ queryKey: ['core','profiles','all'], queryFn: () => ProfilesService.list(), enabled: userCompaniesOpen });
  const { data: userCompanies } = useQuery({
    queryKey: ['core','user_companies', selectedUser?.id],
    queryFn: () => selectedUser ? UsersService.getUserCompanies(selectedUser.id) : Promise.resolve([]),
    enabled: userCompaniesOpen && !!selectedUser,
  });

  const upsertUc = useMutation({
    mutationFn: () => UsersService.upsertUserCompany({
      user_id: selectedUser!.id,
      company_id: ucForm.company_id!,
      profile_id: ucForm.profile_id || null,
      is_primary: ucForm.is_primary ?? false,
    } as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['core','user_companies', selectedUser?.id] }); toast({ title: 'Vínculo salvo' }); },
    onError: (error: any) => toast({ title: 'Erro ao salvar vínculo', description: error?.message || String(error), variant: 'destructive' })
  });

  const deleteUc = useMutation({
    mutationFn: ({ company_id }: { company_id: string }) => UsersService.deleteUserCompany(selectedUser!.id, company_id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['core','user_companies', selectedUser?.id] }); toast({ title: 'Vínculo removido' }); },
    onError: (error: any) => toast({ title: 'Erro ao remover vínculo', description: error?.message || String(error), variant: 'destructive' })
  });

  const setPrimary = useMutation({
    mutationFn: ({ company_id }: { company_id: string }) => UsersService.setPrimaryCompany(selectedUser!.id, company_id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['core','user_companies', selectedUser?.id] }); toast({ title: 'Empresa principal atualizada' }); },
    onError: (error: any) => toast({ title: 'Erro ao definir empresa principal', description: error?.message || String(error), variant: 'destructive' })
  });

  const items = useMemo(() => usersPage?.data || [], [usersPage]);
  const total = usersPage?.count || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (canRead === false) return (<Card><CardHeader><CardTitle>Acessos</CardTitle></CardHeader><CardContent>Sem permissão.</CardContent></Card>);

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Acessos (Usuários x Empresas)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <div className="border rounded-md p-3"><div className="text-xs text-gray-500">Total</div><div className="text-xl font-semibold">{total}</div></div>
            <div className="border rounded-md p-3"><div className="text-xs text-gray-500">Página</div><div className="text-xl font-semibold">{items.length}</div></div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Input placeholder="Buscar por nome/email" value={search} onChange={(e)=>setSearch(e.target.value)} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="text-sm text-gray-600">{total} usuários</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Anterior</Button>
              <div className="text-sm">{page}/{totalPages}</div>
              <Button variant="outline" size="sm" disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Próximo</Button>
            </div>
          </div>
          <div className="space-y-2">
            {isLoading ? 'Carregando...' : items.length === 0 ? 'Nenhum usuário' : items.map(u => (
              <div key={u.id} className="flex items-center justify-between border rounded-md p-2">
                <div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-sm text-gray-600">{u.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={()=>{ setSelectedUser(u); setUserCompaniesOpen(true); }}>Vínculos</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={userCompaniesOpen} onOpenChange={(o)=>{ if(!o){ setUserCompaniesOpen(false); setSelectedUser(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Vínculos de {selectedUser?.name}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Select value={ucForm.company_id || undefined} onValueChange={(v)=>setUcForm(s=>({...s, company_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Empresa" /></SelectTrigger>
                <SelectContent>
                  {(companies || []).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome_fantasia || c.razao_social}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={ucForm.profile_id || undefined} onValueChange={(v)=>setUcForm(s=>({...s, profile_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Perfil" /></SelectTrigger>
                <SelectContent>
                  {(profiles || []).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <span>Primária</span>
                <Switch checked={ucForm.is_primary ?? false} onCheckedChange={(v)=>setUcForm(s=>({...s, is_primary: v }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button disabled={!canEdit || !ucForm.company_id} onClick={()=>upsertUc.mutate()}>Salvar vínculo</Button>
            </div>

            <div className="border-t pt-2 space-y-2">
              {(userCompanies || []).length === 0 ? 'Sem vínculos' : (userCompanies || []).map(vc => (
                <div key={vc.company_id} className="flex items-center justify-between border rounded-md p-2">
                  <div>
                    <div className="text-sm">Empresa: {(companies || []).find(c=>c.id===vc.company_id)?.nome_fantasia || vc.company_id}</div>
                    <div className="text-xs text-gray-600">Perfil: {(profiles || []).find(p=>p.id===vc.profile_id)?.nome || '—'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={!canEdit} onClick={()=>setPrimary.mutate({ company_id: vc.company_id })}>Tornar primária</Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={!canEdit} onClick={()=>setToDeleteCompanyId(vc.company_id)}>Remover</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover vínculo?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação é irreversível. Confirme a remoção do vínculo.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={()=>{ if(toDeleteCompanyId){ deleteUc.mutate({ company_id: toDeleteCompanyId }); setToDeleteCompanyId(null); } }}>Remover</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccessManagement;


