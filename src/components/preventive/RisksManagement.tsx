
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, Eye, UserCheck } from "lucide-react";
import * as XLSX from 'xlsx';

interface Risk {
  id: string;
  risk_number: string;
  title: string;
  description: string;
  location: string;
  severity: number;
  status: 'enviado' | 'direcionado' | 'concluido' | 'aberto';
  risk_type: string;
  cable_client_site: string;
  city: string;
  photos: any[];
  directed_to: string;
  directed_at: string;
  status_updated_at: string;
  created_at: string;
  reported_by: string;
  profiles?: {
    name: string;
  };
  directed_profile?: {
    name: string;
  };
}

const RisksManagement = () => {
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [directionDialog, setDirectionDialog] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [filters, setFilters] = useState({
    user: '',
    riskNumber: '',
    status: '',
    cableClientSite: '',
    city: '',
    dateFrom: '',
    dateTo: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar riscos
  const { data: risks = [], isLoading } = useQuery({
    queryKey: ['risks', filters],
    queryFn: async () => {
      let query = supabase
        .from('risks')
        .select(`
          *,
          profiles:reported_by(name),
          directed_profile:directed_to(name)
        `)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.riskNumber) {
        query = query.ilike('risk_number', `%${filters.riskNumber}%`);
      }
      if (filters.cableClientSite) {
        query = query.ilike('cable_client_site', `%${filters.cableClientSite}%`);
      }
      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  // Buscar técnicos para direcionamento
  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('is_active', true)
        .in('role', ['tecnico', 'supervisor']);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Direcionar risco
  const directionMutation = useMutation({
    mutationFn: async ({ riskId, technicianId }: { riskId: string; technicianId: string }) => {
      const { error } = await supabase
        .from('risks')
        .update({
          directed_to: technicianId,
          directed_at: new Date().toISOString(),
          status: 'direcionado'
        })
        .eq('id', riskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Risco direcionado",
        description: "O risco foi direcionado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['risks'] });
      setDirectionDialog(false);
      setSelectedRisk(null);
      setSelectedTechnician('');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao direcionar risco",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enviado': return 'bg-blue-100 text-blue-800';
      case 'direcionado': return 'bg-yellow-100 text-yellow-800';
      case 'concluido': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'enviado': return 'Enviado';
      case 'direcionado': return 'Direcionado';
      case 'concluido': return 'Concluído';
      case 'aberto': return 'Aberto';
      default: return status;
    }
  };

  const exportToExcel = () => {
    const exportData = risks.map(risk => ({
      'Nº Risco': risk.risk_number,
      'Título': risk.title,
      'Descrição': risk.description,
      'Localização': risk.location,
      'Tipo': risk.risk_type,
      'Cabo/Cliente/Site': risk.cable_client_site,
      'Cidade': risk.city,
      'Severidade': risk.severity,
      'Status': getStatusLabel(risk.status),
      'Reportado por': risk.profiles?.name,
      'Direcionado para': risk.directed_profile?.name || '',
      'Data Direcionamento': risk.directed_at ? format(new Date(risk.directed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '',
      'Data Criação': format(new Date(risk.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Riscos');
    XLSX.writeFile(wb, `riscos_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const handleDirection = () => {
    if (selectedRisk && selectedTechnician) {
      directionMutation.mutate({
        riskId: selectedRisk.id,
        technicianId: selectedTechnician
      });
    }
  };

  if (isLoading) {
    return <div>Carregando riscos...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <Label htmlFor="riskNumber">Nº Risco</Label>
          <Input
            id="riskNumber"
            placeholder="Ex: R-000001"
            value={filters.riskNumber}
            onChange={(e) => setFilters(prev => ({ ...prev, riskNumber: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
              <SelectItem value="direcionado">Direcionado</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="aberto">Aberto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="cableClientSite">Cabo/Cliente/Site</Label>
          <Input
            id="cableClientSite"
            placeholder="Buscar por cabo/cliente/site"
            value={filters.cableClientSite}
            onChange={(e) => setFilters(prev => ({ ...prev, cableClientSite: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            placeholder="Buscar por cidade"
            value={filters.city}
            onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
          />
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-end">
        <Button onClick={exportToExcel} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar Excel
        </Button>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº Risco</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cabo/Cliente/Site</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Direcionado para</TableHead>
              <TableHead>Data Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {risks.map((risk) => (
              <TableRow key={risk.id}>
                <TableCell className="font-medium">{risk.risk_number}</TableCell>
                <TableCell>{risk.title}</TableCell>
                <TableCell>{risk.risk_type}</TableCell>
                <TableCell>{risk.cable_client_site}</TableCell>
                <TableCell>{risk.city}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(risk.status)}>
                    {getStatusLabel(risk.status)}
                  </Badge>
                </TableCell>
                <TableCell>{risk.directed_profile?.name || '-'}</TableCell>
                <TableCell>
                  {risk.status_updated_at ? 
                    format(new Date(risk.status_updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) 
                    : '-'
                  }
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedRisk(risk)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detalhes do Risco - {risk.risk_number}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Título</Label>
                            <p>{risk.title}</p>
                          </div>
                          <div>
                            <Label>Descrição</Label>
                            <p>{risk.description}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Localização</Label>
                              <p>{risk.location}</p>
                            </div>
                            <div>
                              <Label>Severidade</Label>
                              <p>{risk.severity}</p>
                            </div>
                          </div>
                          {risk.photos && risk.photos.length > 0 && (
                            <div>
                              <Label>Fotos</Label>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {risk.photos.map((photo, index) => (
                                  <img key={index} src={photo} alt={`Foto ${index + 1}`} className="w-full h-32 object-cover rounded" />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    {risk.status === 'enviado' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedRisk(risk);
                          setDirectionDialog(true);
                        }}
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de direcionamento */}
      <Dialog open={directionDialog} onOpenChange={setDirectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Direcionar Risco</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Risco: {selectedRisk?.risk_number}</Label>
              <p className="text-sm text-muted-foreground">{selectedRisk?.title}</p>
            </div>
            <div>
              <Label htmlFor="technician">Direcionar para</Label>
              <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um técnico" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDirectionDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleDirection}
                disabled={!selectedTechnician || directionMutation.isPending}
              >
                {directionMutation.isPending ? 'Direcionando...' : 'Direcionar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RisksManagement;
