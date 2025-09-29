import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CompaniesService, Company } from '@/services/core/companiesService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuthorization } from '@/hooks/useAuthorization';

const CompaniesManagement: React.FC = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState<Partial<Company>>({ razao_social: '' });

  const { checkModule } = useAuthorization();

  const { data: canRead } = useQuery({
    queryKey: ['auth', 'perm', 'core', 'companies', 'read'],
    queryFn: () => checkModule('core', 'read'),
  });
  const { data: canCreate } = useQuery({
    queryKey: ['auth', 'perm', 'core', 'companies', 'create'],
    queryFn: () => checkModule('core', 'create'),
  });
  const { data: canEdit } = useQuery({
    queryKey: ['auth', 'perm', 'core', 'companies', 'edit'],
    queryFn: () => checkModule('core', 'edit'),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['core', 'companies', { search }],
    queryFn: () => CompaniesService.list({ search }),
    enabled: canRead !== false,
  });

  const createMutation = useMutation({
    mutationFn: () => CompaniesService.create({
      razao_social: form.razao_social || '',
      nome_fantasia: form.nome_fantasia || null,
      codigo_empresa: form.codigo_empresa || null,
      cnpj: form.cnpj || null,
      inscricao_estadual: form.inscricao_estadual || null,
      endereco: form.endereco || null,
      contato: form.contato || null,
      is_active: form.is_active ?? true,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['core', 'companies'] });
      setForm({ razao_social: '' });
      toast({ title: 'Empresa criada com sucesso' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar empresa', description: error?.message || String(error), variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: () => editing ? CompaniesService.update(editing.id, form) : Promise.resolve(null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['core', 'companies'] });
      setEditing(null);
      setForm({ razao_social: '' });
      toast({ title: 'Empresa atualizada' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar empresa', description: error?.message || String(error), variant: 'destructive' });
    }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => CompaniesService.toggleActive(id, is_active),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['core', 'companies'] }); toast({ title: 'Status atualizado' }); },
    onError: (error: any) => toast({ title: 'Erro ao alterar status', description: error?.message || String(error), variant: 'destructive' })
  });

  const filtered = useMemo(() => data || [], [data]);

  if (canRead === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Empresas</CardTitle>
        </CardHeader>
        <CardContent>Você não tem permissão para visualizar empresas.</CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Empresas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <div className="border rounded-md p-3">
              <div className="text-xs text-gray-500">Total</div>
              <div className="text-xl font-semibold">{filtered.length}</div>
            </div>
            <div className="border rounded-md p-3">
              <div className="text-xs text-gray-500">Ativas (na página)</div>
              <div className="text-xl font-semibold">{filtered.filter(c=>c.is_active).length}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Input placeholder="Buscar por razão social, fantasia ou CNPJ" value={search} onChange={(e) => setSearch(e.target.value)} />
            {canCreate && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>Novo</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Empresa</DialogTitle>
                </DialogHeader>
                <div className="grid gap-2">
                  <Input placeholder="Razão social" value={form.razao_social || ''} onChange={(e) => setForm(s => ({ ...s, razao_social: e.target.value }))} />
                  <Input placeholder="Nome fantasia" value={form.nome_fantasia || ''} onChange={(e) => setForm(s => ({ ...s, nome_fantasia: e.target.value }))} />
                  <Input 
                    placeholder="Código da empresa (ex: 01)" 
                    value={form.codigo_empresa || ''} 
                    onChange={(e) => setForm(s => ({ ...s, codigo_empresa: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                    maxLength={2}
                    className="text-center font-mono"
                  />
                  <Input placeholder="CNPJ" value={form.cnpj || ''} onChange={(e) => setForm(s => ({ ...s, cnpj: e.target.value }))} />
                  <Input placeholder="Inscrição estadual" value={form.inscricao_estadual || ''} onChange={(e) => setForm(s => ({ ...s, inscricao_estadual: e.target.value }))} />
                  <Input placeholder="Endereço" value={form.endereco || ''} onChange={(e) => setForm(s => ({ ...s, endereco: e.target.value }))} />
                  <Input placeholder="Contato" value={form.contato || ''} onChange={(e) => setForm(s => ({ ...s, contato: e.target.value }))} />
                  <div className="flex items-center gap-2">
                    <span>Ativa</span>
                    <Switch checked={form.is_active ?? true} onCheckedChange={(v) => setForm(s => ({ ...s, is_active: v }))} />
                  </div>
                  <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !(form.razao_social || '').trim()}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Razão Social</TableHead>
                <TableHead>Fantasia</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6}>Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6}>Nenhum registro encontrado</TableCell></TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <span className="font-mono text-lg font-bold text-blue-600">
                        {c.codigo_empresa || '--'}
                      </span>
                    </TableCell>
                    <TableCell>{c.razao_social}</TableCell>
                    <TableCell>{c.nome_fantasia}</TableCell>
                    <TableCell>{c.cnpj}</TableCell>
                    <TableCell>
                      <Switch disabled={!canEdit} checked={!!c.is_active} onCheckedChange={(v) => {
                        if (!canEdit) return;
                        if (!v) {
                          const confirmed = window.confirm('Desativar esta empresa?');
                          if (!confirmed) return;
                        }
                        toggleMutation.mutate({ id: c.id, is_active: v });
                      }} />
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" disabled={!canEdit} onClick={() => { setEditing(c); setForm(c); }}>Editar</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) { setEditing(null); setForm({ razao_social: '' }); }}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Input placeholder="Razão social" value={form.razao_social || ''} onChange={(e) => setForm(s => ({ ...s, razao_social: e.target.value }))} />
            <Input placeholder="Nome fantasia" value={form.nome_fantasia || ''} onChange={(e) => setForm(s => ({ ...s, nome_fantasia: e.target.value }))} />
            <Input 
              placeholder="Código da empresa (ex: 01)" 
              value={form.codigo_empresa || ''} 
              onChange={(e) => setForm(s => ({ ...s, codigo_empresa: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
              maxLength={2}
              className="text-center font-mono"
            />
            <Input placeholder="CNPJ" value={form.cnpj || ''} onChange={(e) => setForm(s => ({ ...s, cnpj: e.target.value }))} />
            <Input placeholder="Inscrição estadual" value={form.inscricao_estadual || ''} onChange={(e) => setForm(s => ({ ...s, inscricao_estadual: e.target.value }))} />
            <Input placeholder="Endereço" value={form.endereco || ''} onChange={(e) => setForm(s => ({ ...s, endereco: e.target.value }))} />
            <Input placeholder="Contato" value={form.contato || ''} onChange={(e) => setForm(s => ({ ...s, contato: e.target.value }))} />
            <div className="flex items-center gap-2">
              <span>Ativa</span>
              <Switch checked={form.is_active ?? true} onCheckedChange={(v) => setForm(s => ({ ...s, is_active: v }))} />
            </div>
            <Button onClick={() => updateMutation.mutate()} disabled={!canEdit || updateMutation.isPending || !(form.razao_social || '').trim()}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompaniesManagement;


