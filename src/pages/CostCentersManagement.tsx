import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CostCentersService, CostCenter } from '@/services/core/costCentersService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useToast } from '@/components/ui/use-toast';

const CostCentersManagement: React.FC = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { activeCompanyId } = useActiveCompany();
  const { checkModule } = useAuthorization();

  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<CostCenter | null>(null);
  const [form, setForm] = useState<Partial<CostCenter>>({ codigo: '', nome: '', company_id: null });

  const { data: canRead } = useQuery({ queryKey: ['perm', 'cc', 'read'], queryFn: () => checkModule('core','read') });
  const { data: canCreate } = useQuery({ queryKey: ['perm', 'cc', 'create'], queryFn: () => checkModule('core','create') });
  const { data: canEdit } = useQuery({ queryKey: ['perm', 'cc', 'edit'], queryFn: () => checkModule('core','edit') });

  const { data, isLoading } = useQuery({
    queryKey: ['core', 'cost_centers', activeCompanyId, search],
    queryFn: () => CostCentersService.list({ companyId: activeCompanyId || undefined, search }),
    enabled: canRead !== false,
  });

  const createMutation = useMutation({
    mutationFn: () => CostCentersService.create({
      company_id: activeCompanyId || null,
      codigo: form.codigo || '',
      nome: form.nome || '',
      descricao: form.descricao || null,
      parent_id: form.parent_id || null,
      is_active: form.is_active ?? true,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['core','cost_centers'] }); setForm({ codigo:'', nome:'', company_id: activeCompanyId }); toast({ title: 'Centro de custo criado' }); },
    onError: (error: any) => toast({ title: 'Erro ao criar centro de custo', description: error?.message || String(error), variant: 'destructive' })
  });

  const updateMutation = useMutation({
    mutationFn: () => editing ? CostCentersService.update(editing.id, {
      codigo: form.codigo, nome: form.nome, descricao: form.descricao, parent_id: form.parent_id, is_active: form.is_active
    }) : Promise.resolve(null),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['core','cost_centers'] }); setEditing(null); setForm({ codigo:'', nome:'' }); toast({ title: 'Centro de custo atualizado' }); },
    onError: (error: any) => toast({ title: 'Erro ao atualizar centro de custo', description: error?.message || String(error), variant: 'destructive' })
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => CostCentersService.toggleActive(id, is_active),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['core','cost_centers'] }); toast({ title: 'Status atualizado' }); },
    onError: (error: any) => toast({ title: 'Erro ao alterar status', description: error?.message || String(error), variant: 'destructive' })
  });

  const items = useMemo(() => data || [], [data]);

  const renderTree = (nodes: CostCenter[], parentId: string | null = null, level = 0) => {
    const children = nodes.filter(n => (n.parent_id || null) === parentId);
    if (children.length === 0) return null;
    return (
      <div className={level > 0 ? 'ml-4' : ''}>
        {children.map(cc => (
          <div key={cc.id} className="flex items-center justify-between border rounded-md p-2 mb-1">
            <div>
              <div className="font-medium">{cc.codigo} - {cc.nome}</div>
              {cc.descricao && <div className="text-sm text-gray-600">{cc.descricao}</div>}
            </div>
            <div className="flex items-center gap-2">
              <Switch disabled={!canEdit} checked={!!cc.is_active} onCheckedChange={(v)=>{
                if (!canEdit) return;
                if (!v) { const c = window.confirm('Desativar este centro de custo?'); if(!c) return; }
                toggleMutation.mutate({ id: cc.id, is_active: v })
              }} />
              <Button variant="outline" size="sm" disabled={!canEdit} onClick={()=>{ setEditing(cc); setForm(cc); }}>Editar</Button>
            </div>
          </div>
        ))}
        {children.map(cc => (
          <div key={cc.id + '-children'}>
            {renderTree(nodes, cc.id, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  if (canRead === false) {
    return (
      <Card><CardHeader><CardTitle>Centros de Custo</CardTitle></CardHeader><CardContent>Sem permissão para visualizar.</CardContent></Card>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Centros de Custo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <div className="border rounded-md p-3"><div className="text-xs text-gray-500">Total</div><div className="text-xl font-semibold">{items.length}</div></div>
            <div className="border rounded-md p-3"><div className="text-xs text-gray-500">Ativos</div><div className="text-xl font-semibold">{items.filter(i=>i.is_active).length}</div></div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Input placeholder="Buscar por código ou nome" value={search} onChange={(e)=>setSearch(e.target.value)} />
            {canCreate && (
              <Dialog>
                <DialogTrigger asChild><Button>Novo</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Novo Centro de Custo</DialogTitle></DialogHeader>
                  <div className="grid gap-2">
                    <Input placeholder="Código" value={form.codigo || ''} onChange={(e)=>setForm(s=>({...s, codigo:e.target.value}))} />
                    <Input placeholder="Nome" value={form.nome || ''} onChange={(e)=>setForm(s=>({...s, nome:e.target.value}))} />
                    <Input placeholder="Descrição" value={form.descricao || ''} onChange={(e)=>setForm(s=>({...s, descricao:e.target.value}))} />
                    <div className="flex items-center gap-2">
                      <span>Ativo</span>
                      <Switch checked={form.is_active ?? true} onCheckedChange={(v)=>setForm(s=>({...s, is_active:v}))} />
                    </div>
                    <Button onClick={()=>createMutation.mutate()} disabled={createMutation.isPending || !(form.codigo||'').trim() || !(form.nome||'').trim() }>Salvar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="space-y-2">
            {isLoading ? 'Carregando...' : items.length === 0 ? 'Nenhum registro' : renderTree(items)}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o)=>{ if(!o){ setEditing(null); setForm({ codigo:'', nome:'' }); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Centro de Custo</DialogTitle></DialogHeader>
          <div className="grid gap-2">
            <Input placeholder="Código" value={form.codigo || ''} onChange={(e)=>setForm(s=>({...s, codigo:e.target.value}))} />
            <Input placeholder="Nome" value={form.nome || ''} onChange={(e)=>setForm(s=>({...s, nome:e.target.value}))} />
            <Input placeholder="Descrição" value={form.descricao || ''} onChange={(e)=>setForm(s=>({...s, descricao:e.target.value}))} />
            <Select value={form.parent_id || undefined} onValueChange={(v)=>setForm(s=>({...s, parent_id: v || null }))}>
              <SelectTrigger><SelectValue placeholder="Pai (opcional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sem pai</SelectItem>
                {items.filter(i=>i.id!==editing?.id).map(i => (
                  <SelectItem key={i.id} value={i.id}>{i.codigo} - {i.nome}</SelectItem>
                ))}
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

export default CostCentersManagement;


