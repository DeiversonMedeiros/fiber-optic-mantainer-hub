import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfilesService, Profile } from '@/services/core/profilesService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useToast } from '@/components/ui/use-toast';
import { Shield, Users, DollarSign, Car, Factory, ShoppingCart, Briefcase, HardHat, Route, Zap, Fuel, Warehouse, ClipboardList, BarChart3, Database, Settings, CheckCircle, XCircle, Building2 } from 'lucide-react';

// Mapeamento de módulos para ícones e nomes amigáveis (baseado no banco de dados)
const MODULE_CONFIG = {
  all: { icon: Shield, label: 'Acesso Total', color: 'text-purple-600' },
  core: { icon: Settings, label: 'Configurações', color: 'text-blue-600' },
  rh: { icon: Users, label: 'Recursos Humanos', color: 'text-indigo-600' },
  financeiro: { icon: DollarSign, label: 'Financeiro', color: 'text-emerald-600' },
  frota: { icon: Car, label: 'Frota', color: 'text-orange-600' },
  producao: { icon: Factory, label: 'Produção', color: 'text-cyan-600' },
  compras: { icon: ShoppingCart, label: 'Compras', color: 'text-pink-600' },
  obras: { icon: HardHat, label: 'Obras', color: 'text-red-600' },
  comercial: { icon: Building2, label: 'Comercial', color: 'text-teal-600' },
  logistica: { icon: Route, label: 'Logística', color: 'text-violet-600' },
  auditoria: { icon: Shield, label: 'Auditoria', color: 'text-gray-600' },
  integracao: { icon: Zap, label: 'Integração', color: 'text-yellow-600' },
  combustivel: { icon: Fuel, label: 'Combustível', color: 'text-orange-500' },
  almoxarifado: { icon: Warehouse, label: 'Almoxarifado', color: 'text-slate-600' },
  projects: { icon: Briefcase, label: 'Projetos', color: 'text-amber-600' }
};

const renderPermissoesGerais = (permissoes: any) => {
  if (!permissoes || typeof permissoes !== 'object') {
    return <span className="text-gray-400 text-sm">Nenhuma permissão</span>;
  }

  const permissoesArray = Object.entries(permissoes)
    .filter(([key, value]) => value === true)
    .map(([key, value]) => key);

  if (permissoesArray.length === 0) {
    return <span className="text-gray-400 text-sm">Nenhuma permissão ativa</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {permissoesArray.map((modulo) => {
        const config = MODULE_CONFIG[modulo as keyof typeof MODULE_CONFIG];
        if (!config) return null;

        const IconComponent = config.icon;
        return (
          <div
            key={modulo}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 ${config.color}`}
          >
            <IconComponent className="h-3 w-3" />
            <span>{config.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const ProfilesManagement: React.FC = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Profile | null>(null);
  const [form, setForm] = useState<Partial<Profile>>({ nome: '', permissoes_gerais: {} });
  const [permAll, setPermAll] = useState(false);
  const [permCore, setPermCore] = useState(false);
  const [permFinanceiro, setPermFinanceiro] = useState(false);
  const [permFrota, setPermFrota] = useState(false);
  const [permComercial, setPermComercial] = useState(false);
  const [permObras, setPermObras] = useState(false);
  const [permRH, setPermRH] = useState(false);
  const [permProducao, setPermProducao] = useState(false);
  const [permCompras, setPermCompras] = useState(false);
  const [permLogistica, setPermLogistica] = useState(false);
  const [permAuditoria, setPermAuditoria] = useState(false);
  const [permIntegracao, setPermIntegracao] = useState(false);
  const [permCombustivel, setPermCombustivel] = useState(false);
  const [permAlmoxarifado, setPermAlmoxarifado] = useState(false);
  const [permUsuarios, setPermUsuarios] = useState(false);

  const { checkModule } = useAuthorization();

  const { data: canRead } = useQuery({
    queryKey: ['auth', 'perm', 'core', 'profiles', 'read'],
    queryFn: () => checkModule('core', 'read'),
  });
  const { data: canCreate } = useQuery({
    queryKey: ['auth', 'perm', 'core', 'profiles', 'create'],
    queryFn: () => checkModule('core', 'create'),
  });
  const { data: canEdit } = useQuery({
    queryKey: ['auth', 'perm', 'core', 'profiles', 'edit'],
    queryFn: () => checkModule('core', 'edit'),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['core', 'profiles', { search }],
    queryFn: () => ProfilesService.list({ search }),
    enabled: canRead !== false,
  });

  const createMutation = useMutation({
    mutationFn: () => ProfilesService.create({
      nome: form.nome || '',
      permissoes_gerais: buildPermissoes(),
    } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['core', 'profiles'] });
      setForm({ nome: '', permissoes_gerais: {} });
      toast({ title: 'Perfil criado com sucesso' });
    },
    onError: (error: any) => toast({ title: 'Erro ao criar perfil', description: error?.message || String(error), variant: 'destructive' })
  });

  const updateMutation = useMutation({
    mutationFn: () => editing ? ProfilesService.update(editing.id, { nome: form.nome, permissoes_gerais: buildPermissoes() } as any) : Promise.resolve(null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['core', 'profiles'] });
      setEditing(null);
      setForm({ nome: '', permissoes_gerais: {} });
      toast({ title: 'Perfil atualizado' });
    }
  });

  const filtered = useMemo(() => data || [], [data]);

  const syncFromProfile = (p?: Profile | null) => {
    const perms = (p?.permissoes_gerais || {}) as any;
    setPermAll(Boolean(perms?.all));
    setPermCore(Boolean(perms?.core));
    setPermFinanceiro(Boolean(perms?.financeiro));
    setPermFrota(Boolean(perms?.frota));
    setPermComercial(Boolean(perms?.comercial));
    setPermObras(Boolean(perms?.obras));
    setPermRH(Boolean(perms?.rh));
    setPermProducao(Boolean(perms?.producao));
    setPermCompras(Boolean(perms?.compras));
    setPermLogistica(Boolean(perms?.logistica));
    setPermAuditoria(Boolean(perms?.auditoria) || Boolean(perms?.audit));
    setPermIntegracao(Boolean(perms?.integracao));
    setPermCombustivel(Boolean(perms?.combustivel));
    setPermAlmoxarifado(Boolean(perms?.almoxarifado));
    setPermUsuarios(Boolean(perms?.usuarios));
  };

  const buildPermissoes = () => ({
    all: permAll,
    core: permCore,
    financeiro: permFinanceiro,
    frota: permFrota,
    comercial: permComercial,
    obras: permObras,
    rh: permRH,
    producao: permProducao,
    compras: permCompras,
    logistica: permLogistica,
    auditoria: permAuditoria,
    integracao: permIntegracao,
    combustivel: permCombustivel,
    almoxarifado: permAlmoxarifado,
    usuarios: permUsuarios,
  });

  if (canRead === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Perfis</CardTitle>
        </CardHeader>
        <CardContent>Você não tem permissão para visualizar perfis.</CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Perfis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Input placeholder="Buscar por nome" value={search} onChange={(e) => setSearch(e.target.value)} />
            {canCreate && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>Novo</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Perfil</DialogTitle>
                </DialogHeader>
                <div className="grid gap-2">
                  <Input placeholder="Nome" value={form.nome || ''} onChange={(e) => setForm(s => ({ ...s, nome: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-3 p-2 border rounded-md">
                    <label className="flex items-center justify-between">Acesso total (all)
                      <Switch checked={permAll} onCheckedChange={setPermAll} />
                    </label>
                    <label className="flex items-center justify-between">Core
                      <Switch checked={permCore} onCheckedChange={setPermCore} />
                    </label>
                    <label className="flex items-center justify-between">Usuários
                      <Switch checked={permUsuarios} onCheckedChange={setPermUsuarios} />
                    </label>
                    <label className="flex items-center justify-between">Recursos Humanos
                      <Switch checked={permRH} onCheckedChange={setPermRH} />
                    </label>
                    <label className="flex items-center justify-between">Financeiro
                      <Switch checked={permFinanceiro} onCheckedChange={setPermFinanceiro} />
                    </label>
                    <label className="flex items-center justify-between">Frota
                      <Switch checked={permFrota} onCheckedChange={setPermFrota} />
                    </label>
                    <label className="flex items-center justify-between">Comercial
                      <Switch checked={permComercial} onCheckedChange={setPermComercial} />
                    </label>
                    <label className="flex items-center justify-between">Obras
                      <Switch checked={permObras} onCheckedChange={setPermObras} />
                    </label>
                    <label className="flex items-center justify-between">Produção
                      <Switch checked={permProducao} onCheckedChange={setPermProducao} />
                    </label>
                    <label className="flex items-center justify-between">Compras
                      <Switch checked={permCompras} onCheckedChange={setPermCompras} />
                    </label>
                    <label className="flex items-center justify-between">Logística
                      <Switch checked={permLogistica} onCheckedChange={setPermLogistica} />
                    </label>
                    <label className="flex items-center justify-between">Auditoria
                      <Switch checked={permAuditoria} onCheckedChange={setPermAuditoria} />
                    </label>
                    <label className="flex items-center justify-between">Integração
                      <Switch checked={permIntegracao} onCheckedChange={setPermIntegracao} />
                    </label>
                    <label className="flex items-center justify-between">Combustível
                      <Switch checked={permCombustivel} onCheckedChange={setPermCombustivel} />
                    </label>
                    <label className="flex items-center justify-between">Almoxarifado
                      <Switch checked={permAlmoxarifado} onCheckedChange={setPermAlmoxarifado} />
                    </label>
                  </div>
                  <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !(form.nome || '').trim()}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Permissões Gerais</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3}>Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={3}>Nenhum registro encontrado</TableCell></TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.nome}</TableCell>
                    <TableCell>
                      <div className="max-w-[500px]">
                        {renderPermissoesGerais(p.permissoes_gerais)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" disabled={!canEdit} onClick={() => { setEditing(p); setForm(p); syncFromProfile(p); }}>Editar</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) { setEditing(null); setForm({ nome: '', permissoes_gerais: {} }); }}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Input placeholder="Nome" value={form.nome || ''} onChange={(e) => setForm(s => ({ ...s, nome: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3 p-2 border rounded-md">
              <label className="flex items-center justify-between">Acesso total (all)
                <Switch checked={permAll} onCheckedChange={setPermAll} />
              </label>
              <label className="flex items-center justify-between">Core
                <Switch checked={permCore} onCheckedChange={setPermCore} />
              </label>
              <label className="flex items-center justify-between">Usuários
                <Switch checked={permUsuarios} onCheckedChange={setPermUsuarios} />
              </label>
              <label className="flex items-center justify-between">Recursos Humanos
                <Switch checked={permRH} onCheckedChange={setPermRH} />
              </label>
              <label className="flex items-center justify-between">Financeiro
                <Switch checked={permFinanceiro} onCheckedChange={setPermFinanceiro} />
              </label>
              <label className="flex items-center justify-between">Frota
                <Switch checked={permFrota} onCheckedChange={setPermFrota} />
              </label>
              <label className="flex items-center justify-between">Comercial
                <Switch checked={permComercial} onCheckedChange={setPermComercial} />
              </label>
              <label className="flex items-center justify-between">Obras
                <Switch checked={permObras} onCheckedChange={setPermObras} />
              </label>
              <label className="flex items-center justify-between">Produção
                <Switch checked={permProducao} onCheckedChange={setPermProducao} />
              </label>
              <label className="flex items-center justify-between">Compras
                <Switch checked={permCompras} onCheckedChange={setPermCompras} />
              </label>
              <label className="flex items-center justify-between">Logística
                <Switch checked={permLogistica} onCheckedChange={setPermLogistica} />
              </label>
              <label className="flex items-center justify-between">Auditoria
                <Switch checked={permAuditoria} onCheckedChange={setPermAuditoria} />
              </label>
              <label className="flex items-center justify-between">Integração
                <Switch checked={permIntegracao} onCheckedChange={setPermIntegracao} />
              </label>
              <label className="flex items-center justify-between">Combustível
                <Switch checked={permCombustivel} onCheckedChange={setPermCombustivel} />
              </label>
              <label className="flex items-center justify-between">Almoxarifado
                <Switch checked={permAlmoxarifado} onCheckedChange={setPermAlmoxarifado} />
              </label>
            </div>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending || !(form.nome || '').trim()}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilesManagement;


