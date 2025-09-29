import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DepartmentsService, Department } from '@/services/core/departmentsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useToast } from '@/components/ui/use-toast';

const DepartmentsManagement: React.FC = () => {
  const qc = useQueryClient();
  const { activeCompanyId } = useActiveCompany();
  const { checkModule } = useAuthorization();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState<Partial<Department>>({ nome: '' });

  const { data: canRead } = useQuery({ queryKey: ['perm', 'dept', 'read'], queryFn: () => checkModule('core','read') });
  const { data: canCreate } = useQuery({ queryKey: ['perm', 'dept', 'create'], queryFn: () => checkModule('core','create') });
  const { data: canEdit } = useQuery({ queryKey: ['perm', 'dept', 'edit'], queryFn: () => checkModule('core','edit') });

  const { data, isLoading } = useQuery({
    queryKey: ['core', 'departments', activeCompanyId, search],
    queryFn: () => activeCompanyId ? DepartmentsService.list({ companyId: activeCompanyId, search }) : Promise.resolve([]),
    enabled: !!activeCompanyId && canRead !== false,
  });

  const createMutation = useMutation({
    mutationFn: () => DepartmentsService.create({
      company_id: activeCompanyId!,
      nome: form.nome || '',
      codigo: form.codigo || null,
      descricao: form.descricao || null,
      centro_custo: form.centro_custo || null,
      is_active: form.is_active ?? true,
    } as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['core','departments'] }); setForm({ nome:'' }); toast({ title: 'Departamento criado' }); },
    onError: (error: any) => toast({ title: 'Erro ao criar departamento', description: error?.message || String(error), variant: 'destructive' })
  });

  const updateMutation = useMutation({
    mutationFn: () => editing ? DepartmentsService.update(editing.id, {
      nome: form.nome, codigo: form.codigo, descricao: form.descricao, centro_custo: form.centro_custo, is_active: form.is_active
    } as any) : Promise.resolve(null),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['core','departments'] }); setEditing(null); setForm({ nome:'' }); toast({ title: 'Departamento atualizado' }); },
    onError: (error: any) => toast({ title: 'Erro ao atualizar departamento', description: error?.message || String(error), variant: 'destructive' })
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => DepartmentsService.toggleActive(id, is_active),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['core','departments'] }); toast({ title: 'Status atualizado' }); },
    onError: (error: any) => toast({ title: 'Erro ao alterar status', description: error?.message || String(error), variant: 'destructive' })
  });

  const items = useMemo(() => data || [], [data]);

  if (canRead === false) {
    return (
      <Card><CardHeader><CardTitle>Departamentos</CardTitle></CardHeader><CardContent>Sem permissão para visualizar.</CardContent></Card>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Departamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <div className="border rounded-md p-3"><div className="text-xs text-gray-500">Total</div><div className="text-xl font-semibold">{items.length}</div></div>
            <div className="border rounded-md p-3"><div className="text-xs text-gray-500">Ativos</div><div className="text-xl font-semibold">{items.filter(i=>i.is_active).length}</div></div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Input placeholder="Buscar por nome ou código" value={search} onChange={(e)=>setSearch(e.target.value)} />
            {canCreate && (
              <Dialog>
                <DialogTrigger asChild><Button>Novo</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Novo Departamento</DialogTitle></DialogHeader>
                  <div className="grid gap-2">
                    <Input placeholder="Nome" value={form.nome || ''} onChange={(e)=>setForm(s=>({...s, nome:e.target.value}))} />
                    <Input placeholder="Código" value={form.codigo || ''} onChange={(e)=>setForm(s=>({...s, codigo:e.target.value}))} />
                    <Input placeholder="Descrição" value={form.descricao || ''} onChange={(e)=>setForm(s=>({...s, descricao:e.target.value}))} />
                    <Input placeholder="Centro de Custo (texto)" value={form.centro_custo || ''} onChange={(e)=>setForm(s=>({...s, centro_custo:e.target.value}))} />
                    <div className="flex items-center gap-2">
                      <span>Ativo</span>
                      <Switch checked={form.is_active ?? true} onCheckedChange={(v)=>setForm(s=>({...s, is_active:v}))} />
                    </div>
                    <Button onClick={()=>createMutation.mutate()} disabled={createMutation.isPending || !(form.nome||'').trim() }>Salvar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="space-y-2">
            {isLoading ? 'Carregando...' : items.length === 0 ? 'Nenhum registro' : items.map(d => (
              <div key={d.id} className="flex items-center justify-between border rounded-md p-2">
                <div>
                  <div className="font-medium">{d.nome} {d.codigo && `( ${d.codigo} )`}</div>
                  {d.descricao && <div className="text-sm text-gray-600">{d.descricao}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <Switch disabled={!canEdit} checked={!!d.is_active} onCheckedChange={(v)=>{
                    if (!canEdit) return;
                    if (!v) {
                      const confirmed = window.confirm('Desativar este departamento?');
                      if (!confirmed) return;
                    }
                    toggleMutation.mutate({ id: d.id, is_active: v })
                  }} />
                  <Button variant="outline" size="sm" disabled={!canEdit} onClick={()=>{ setEditing(d); setForm(d); }}>Editar</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o)=>{ if(!o){ setEditing(null); setForm({ nome:'' }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Departamento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Input placeholder="Nome" value={form.nome || ''} onChange={(e)=>setForm(s=>({...s, nome:e.target.value}))} />
            <Input placeholder="Código" value={form.codigo || ''} onChange={(e)=>setForm(s=>({...s, codigo:e.target.value}))} />
            <Input placeholder="Descrição" value={form.descricao || ''} onChange={(e)=>setForm(s=>({...s, descricao:e.target.value}))} />
            <Input placeholder="Centro de Custo (texto)" value={form.centro_custo || ''} onChange={(e)=>setForm(s=>({...s, centro_custo:e.target.value}))} />
            <div className="flex items-center gap-2">
              <span>Ativo</span>
              <Switch checked={form.is_active ?? true} onCheckedChange={(v)=>setForm(s=>({...s, is_active:v}))} />
            </div>
            <Button onClick={()=>updateMutation.mutate()} disabled={!canEdit || updateMutation.isPending || !(form.nome||'').trim()}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DepartmentsManagement;


