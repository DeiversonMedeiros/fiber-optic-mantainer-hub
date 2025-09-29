import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectsService, Project } from '@/services/core/projectsService';
import { CostCentersService } from '@/services/core/costCentersService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useToast } from '@/components/ui/use-toast';

const ProjectsManagement: React.FC = () => {
  const qc = useQueryClient();
  const { activeCompanyId } = useActiveCompany();
  const { checkModule } = useAuthorization();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [costCenterId, setCostCenterId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<Partial<Project>>({ codigo: '', nome: '' });

  const { data: canRead } = useQuery({ queryKey: ['perm', 'proj', 'read'], queryFn: () => checkModule('core','read') });
  const { data: canCreate } = useQuery({ queryKey: ['perm', 'proj', 'create'], queryFn: () => checkModule('core','create') });
  const { data: canEdit } = useQuery({ queryKey: ['perm', 'proj', 'edit'], queryFn: () => checkModule('core','edit') });

  const { data: costCenters } = useQuery({
    queryKey: ['core','cost_centers','for-projects', activeCompanyId],
    queryFn: () => CostCentersService.list({ companyId: activeCompanyId || undefined }),
    enabled: !!activeCompanyId && canRead !== false,
  });

  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { data: projectsPage, isLoading } = useQuery({
    queryKey: ['core', 'projects', activeCompanyId, costCenterId, status, search, page],
    queryFn: () => ProjectsService.list({ companyId: activeCompanyId || undefined, costCenterId: costCenterId || undefined, status: status || undefined, search, page, pageSize }),
    enabled: canRead !== false,
  });

  const createMutation = useMutation({
    mutationFn: () => ProjectsService.create({
      company_id: activeCompanyId || null,
      cost_center_id: form.cost_center_id || null,
      codigo: form.codigo || '', nome: form.nome || '',
      descricao: form.descricao || null,
      data_inicio: form.data_inicio || null,
      data_fim: form.data_fim || null,
      status: form.status || 'ativo',
      is_active: form.is_active ?? true,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['core','projects'] }); setForm({ codigo:'', nome:'' }); toast({ title: 'Projeto criado' }); },
    onError: (error: any) => toast({ title: 'Erro ao criar projeto', description: error?.message || String(error), variant: 'destructive' })
  });

  const updateMutation = useMutation({
    mutationFn: () => editing ? ProjectsService.update(editing.id, {
      cost_center_id: form.cost_center_id || null,
      codigo: form.codigo, nome: form.nome,
      descricao: form.descricao,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim,
      status: form.status,
      is_active: form.is_active,
    }) : Promise.resolve(null),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['core','projects'] }); setEditing(null); setForm({ codigo:'', nome:'' }); toast({ title: 'Projeto atualizado' }); },
    onError: (error: any) => toast({ title: 'Erro ao atualizar projeto', description: error?.message || String(error), variant: 'destructive' })
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => ProjectsService.toggleActive(id, is_active),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['core','projects'] }); toast({ title: 'Status atualizado' }); },
    onError: (error: any) => toast({ title: 'Erro ao alterar status', description: error?.message || String(error), variant: 'destructive' })
  });

  const items = useMemo(() => projectsPage?.data || [], [projectsPage]);
  const total = projectsPage?.count || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (canRead === false) {
    return (<Card><CardHeader><CardTitle>Projetos</CardTitle></CardHeader><CardContent>Sem permissão para visualizar.</CardContent></Card>);
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Projetos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
            <div className="border rounded-md p-3"><div className="text-xs text-gray-500">Total</div><div className="text-xl font-semibold">{items.length + (total - items.length) /* placeholder count */}</div></div>
            <div className="border rounded-md p-3"><div className="text-xs text-gray-500">Ativos (página)</div><div className="text-xl font-semibold">{items.filter(i=>i.is_active).length}</div></div>
            <div className="border rounded-md p-3"><div className="text-xs text-gray-500">Concluídos (página)</div><div className="text-xl font-semibold">{items.filter(i=>i.status==='concluido').length}</div></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
            <Input placeholder="Buscar por código ou nome" value={search} onChange={(e)=>setSearch(e.target.value)} />
            <Select value={status || undefined} onValueChange={(v)=>setStatus(v)}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
              </SelectContent>
            </Select>
            <Select value={costCenterId || undefined} onValueChange={(v)=>setCostCenterId(v)}>
              <SelectTrigger><SelectValue placeholder="Centro de Custo" /></SelectTrigger>
              <SelectContent>
                {(costCenters || []).map(cc => (
                  <SelectItem key={cc.id} value={cc.id}>{cc.codigo} - {cc.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canCreate && (
              <Dialog>
                <DialogTrigger asChild><Button>Novo</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Novo Projeto</DialogTitle></DialogHeader>
                  <div className="grid gap-2">
                    <Input placeholder="Código" value={form.codigo || ''} onChange={(e)=>setForm(s=>({...s, codigo:e.target.value}))} />
                    <Input placeholder="Nome" value={form.nome || ''} onChange={(e)=>setForm(s=>({...s, nome:e.target.value}))} />
                    <Input placeholder="Descrição" value={form.descricao || ''} onChange={(e)=>setForm(s=>({...s, descricao:e.target.value}))} />
                    <Select value={form.cost_center_id || undefined} onValueChange={(v)=>setForm(s=>({...s, cost_center_id:v}))}>
                      <SelectTrigger><SelectValue placeholder="Centro de Custo" /></SelectTrigger>
                      <SelectContent>
                        {(costCenters || []).map(cc => (
                          <SelectItem key={cc.id} value={cc.id}>{cc.codigo} - {cc.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={form.status || undefined} onValueChange={(v)=>setForm(s=>({...s, status:v}))}>
                      <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <span>Ativo</span>
                      <Switch checked={form.is_active ?? true} onCheckedChange={(v)=>setForm(s=>({...s, is_active:v}))} />
                    </div>
                    <Button onClick={()=>createMutation.mutate()} disabled={createMutation.isPending || !(form.codigo||'').trim() || !(form.nome||'').trim()}>Salvar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="text-sm text-gray-600">{total} projetos</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Anterior</Button>
              <div className="text-sm">{page}/{totalPages}</div>
              <Button variant="outline" size="sm" disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Próximo</Button>
            </div>
          </div>

          <div className="space-y-2">
            {isLoading ? 'Carregando...' : items.length === 0 ? 'Nenhum registro' : items.map(p => (
              <div key={p.id} className="flex items-center justify-between border rounded-md p-2">
                <div>
                  <div className="font-medium">{p.codigo} - {p.nome}</div>
                  {p.descricao && <div className="text-sm text-gray-600">{p.descricao}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <Switch disabled={!canEdit} checked={!!p.is_active} onCheckedChange={(v)=>{
                    if (!canEdit) return;
                    if (!v) {
                      const confirmed = window.confirm('Desativar este projeto?');
                      if (!confirmed) return;
                    }
                    toggleMutation.mutate({ id: p.id, is_active: v })
                  }} />
                  <Button variant="outline" size="sm" disabled={!canEdit} onClick={()=>{ setEditing(p); setForm(p); }}>Editar</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o)=>{ if(!o){ setEditing(null); setForm({ codigo:'', nome:'' }); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Projeto</DialogTitle></DialogHeader>
          <div className="grid gap-2">
            <Input placeholder="Código" value={form.codigo || ''} onChange={(e)=>setForm(s=>({...s, codigo:e.target.value}))} />
            <Input placeholder="Nome" value={form.nome || ''} onChange={(e)=>setForm(s=>({...s, nome:e.target.value}))} />
            <Input placeholder="Descrição" value={form.descricao || ''} onChange={(e)=>setForm(s=>({...s, descricao:e.target.value}))} />
            <Select value={form.cost_center_id || undefined} onValueChange={(v)=>setForm(s=>({...s, cost_center_id:v}))}>
              <SelectTrigger><SelectValue placeholder="Centro de Custo" /></SelectTrigger>
              <SelectContent>
                {(costCenters || []).map(cc => (
                  <SelectItem key={cc.id} value={cc.id}>{cc.codigo} - {cc.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={form.status || undefined} onValueChange={(v)=>setForm(s=>({...s, status:v}))}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <span>Ativo</span>
              <Switch checked={form.is_active ?? true} onCheckedChange={(v)=>setForm(s=>({...s, is_active:v}))} />
            </div>
            <Button onClick={()=>updateMutation.mutate()} disabled={!canEdit || updateMutation.isPending || !(form.codigo||'').trim() || !(form.nome||'').trim()}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsManagement;


