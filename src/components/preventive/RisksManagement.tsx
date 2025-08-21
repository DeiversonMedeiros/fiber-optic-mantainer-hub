
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThumbnailImage, FullImage } from "@/components/ui/OptimizedImage";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, Eye, UserCheck, FileText, AlertTriangle } from "lucide-react";
import * as XLSX from 'xlsx';
import type { Database } from '@/integrations/supabase/types';
import { useMemo } from 'react';
import ReportViewModal from "@/components/reports/ReportViewModal";
import { exportToCSV } from "@/utils/csvExport";
import { usePagination } from "@/hooks/usePagination";
import { findBestMatch, normalizeText } from "@/utils/textUtils";

type RiskStatus = Database['public']['Enums']['risk_status'];

interface Risk {
  id: string;
  risk_number: string | null;
  title: string;
  description: string;
  location: string;
  severity: number;
  status: RiskStatus;
  risk_type: string | null;
  cable_client_site: string | null;
  city: string | null;
  photos: string[];
  directed_to: string | null;
  directed_at: string | null;
  status_updated_at: string | null;
  created_at: string;
  reported_by: string;
  reporter: {
    name: string;
  } | null;
  directed_profile: {
    name: string;
  } | null;
}

const RisksManagement = () => {
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [directionDialog, setDirectionDialog] = useState(false);
  const [filters, setFilters] = useState({
    user: '',
    riskNumber: '',
    status: '' as RiskStatus | '',
    cableClientSite: '',
    city: '',
    dateFrom: '',
    dateTo: ''
  });
  // Arrays padronizados para filtros
  const RISK_TYPES = [
    "Adequação / Acomodação Caixa De Emenda",
    "Adequação de Reserva Técnica",
    "Cabo Óptico Danificado / Rompido / Vincado",
    "Tampa Caixa Subterrânea Danificada / Sem tampa",
    "Duto Lateral Danificado",
    "Tampa solta",
    "Cabo sem Riscos",
    "Entulho",
    "Roçado / Capinagem",
    "Erosão (buraco)",
    "Obra no trecho",
    "Posteamento Substituido / Abalroado",
    "Cabos Soltos / Bandolados / Pendente Espinamento",
    "Altura Rede Abaixo Da Recomendada Sobre Passeio",
    "Altura Rede Abaixo Da Recomendada Em Travessia",
    "Abraçadeira Bap Danificada / Inexistente",
    "Cordoalha Solta / Rompida",
    "Árvore Danificando Rede (Necessidade Poda)",
    "Rede Próximo A Rede Elétrica (Concessionária Energia)",
    "Rede Próximo A Iluminação Pública (Concessionária Energia)",
    "Existência Pragas Urbanas (Ratos, Abelhas, Formigas, Etc...)",
    "Aterramento Danificado / Inexistente",
    "Instalação de PEAD"
  ];
  const RISK_LEVELS = ["Alto", "Médio", "Baixo"];
  const NETWORK_TYPES = ["Aérea", "Subterrânea"];
  const CITY_OPTIONS = [
    "Camaçari",
    "Candeias",
    "Catu",
    "Dias D'Avila",
    "Lauro de Freitas",
    "Mata de São João",
    "Pojuca",
    "Salvador",
    "São Francisco do Conde",
    "Simões Filho"
  ];


  // Atualizar tipos para incluir 'cancelado'
  type ReportStatus = 'pendente' | 'concluido' | 'cancelado' | 'all';
  const [reportFilters, setReportFilters] = useState({
    status: 'all' as ReportStatus,
    riskType: 'all',
    riskLevel: 'all',
    city: 'all',
    neighborhood: 'all',
    cableNumber: '',
    networkType: 'all',
    dateFrom: '',
    dateTo: '',
    reportNumber: '' // <-- novo campo para número do risco
  });
  
  // Estado separado para o input do número do relatório para evitar perda de foco
  const [reportNumberInput, setReportNumberInput] = useState('');
  
  // Aplicar debounce de 500ms no reportNumber para evitar consultas excessivas
  const debouncedReportNumber = useDebounce(reportNumberInput, 500);
  
  // Sincronizar valor com debounce com o estado de filtros
  useEffect(() => {
    setReportFilters(prev => ({ ...prev, reportNumber: debouncedReportNumber }));
  }, [debouncedReportNumber]);
  
  // 1. Adicionar estado para controle do dialog e relatório selecionado
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<string | undefined>(undefined);
  // Adicionar estado para controlar o dialog de detalhes
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  // Substituir o estado de imagem ampliada:
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null);
  // Buscar relatórios de inspeção
  const { data: allReports = [] } = useQuery({
    queryKey: ['all-inspection-reports-management'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inspection_reports')
        .select(`*, technician:profiles!technician_id(name), assigned_profile:profiles!assigned_to(name)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const TEMPLATE_ID = "4b45c601-e5b7-4a33-98f9-1769aad319e9";

  // Função para obter o número do relatório com prefixo REL-
  const getReportNumber = (report: any) => {
    if (report.report_number) {
      return `REL-${report.report_number}`;
    }
    // Fallback para relatórios antigos que não têm report_number
    return `REL-N/A`;
  };

  // Função para obter o número do relatório de vistoria com prefixo RIS-
  const getInspectionReportNumber = (report: any) => {
    if (report.report_number) {
      return `RIS-${report.report_number}`;
    }
    // Fallback para relatórios antigos que não têm report_number
    return `RIS-N/A`;
  };

  // Relatórios filtrados (ajustar campos para nova tabela)
  // Remover filteredReports e filtrar diretamente em localReports
  // useEffect(() => {
  //   setLocalReports(allReports);
  // }, [allReports]);

  // Buscar riscos
  const { data: risks = [], isLoading } = useQuery({
    queryKey: ['risks', filters],
    queryFn: async () => {
      let query = supabase
        .from('risks')
        .select(`
          *,
          reporter:profiles!reported_by(name),
          directed_profile:profiles!directed_to(name)
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
      
      // Convert Json photos to string array and transform data
      return (data || []).map(risk => ({
        ...risk,
        photos: Array.isArray(risk.photos) 
          ? (risk.photos as any[]).filter(photo => typeof photo === 'string') as string[]
          : []
      })) as Risk[];
    }
  });

  // 2. Buscar técnicos (perfil Técnico)
  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('is_active', true)
        .eq('access_profile_id', '38a5d358-75d6-4ae6-a109-1456a7dba714')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // 3. Mutation para direcionar relatório
  const assignMutation = useMutation({
    mutationFn: async ({ reportId, technicianId }: { reportId: string; technicianId: string }) => {
      const { error } = await supabase
        .from('inspection_reports')
        .update({ assigned_to: technicianId })
        .eq('id', reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Relatório direcionado', description: 'O relatório foi direcionado com sucesso.' });
      queryClient.invalidateQueries({ queryKey: ['all-inspection-reports-management'] });
      setAssignDialogOpen(false);
      setSelectedReport(null);
      setSelectedTechnician(undefined);
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao direcionar', description: error.message, variant: 'destructive' });
    }
  });

  // Direcionar risco
  const directionMutation = useMutation({
    mutationFn: async ({ riskId, technicianId }: { riskId: string; technicianId: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('risks')
        .update({
          directed_to: technicianId,
          directed_at: new Date().toISOString(),
          status: 'direcionado' as RiskStatus
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
      setSelectedTechnician(undefined);
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
      case 'pendente': return 'bg-orange-100 text-orange-800';
      case 'concluido': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-gray-200 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'concluido': return 'Concluído';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const exportToExcel = () => {
    const exportData = risks.map(risk => ({
      'Nº Risco': risk.risk_number || '',
      'Título': risk.title,
      'Descrição': risk.description,
      'Localização': risk.location,
      'Tipo': risk.risk_type || '',
      'Cabo/Cliente/Site': risk.cable_client_site || '',
      'Cidade': risk.city || '',
      'Severidade': risk.severity,
      'Status': getStatusLabel(risk.status),
      'Reportado por': risk.reporter?.name || '',
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

  // Estado para modal do relatório final
  const [finalReport, setFinalReport] = useState<any | null>(null);
  const [showFinalReportModal, setShowFinalReportModal] = useState(false);

  // Função para exportar CSV dos riscos filtrados
  function handleExportCsv() {
    const { dateFrom, dateTo } = reportFilters;
    if (!dateFrom || !dateTo) {
      toast({ title: "Selecione as duas datas.", variant: "destructive" });
      return;
    }
    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    if (diffDays > 92) {
      toast({ title: "O intervalo máximo permitido é de 3 meses.", variant: "destructive" });
      return;
    }
    if (end < start) {
      toast({ title: "A data final deve ser maior que a inicial.", variant: "destructive" });
      return;
    }
    // Filtrar os relatórios conforme os filtros atuais da tela
    const filteredReports = (allReports as any[]).filter((report) => {
      const statusMatch = reportFilters.status === 'all' || report.status === reportFilters.status;
      const riskTypeMatch = reportFilters.riskType === 'all' || report.risk_type === reportFilters.riskType;
      const riskLevelMatch = reportFilters.riskLevel === 'all' || report.risk_level === reportFilters.riskLevel;
      const cityMatch = reportFilters.city === 'all' || report.city === reportFilters.city;
      const neighborhoodMatch = reportFilters.neighborhood === 'all' || report.neighborhood === reportFilters.neighborhood;
      const cableNumberMatch = !reportFilters.cableNumber || (report.cable_number && report.cable_number.toLowerCase().includes(reportFilters.cableNumber.toLowerCase()));
      const networkTypeMatch = reportFilters.networkType === 'all' || report.network_type === reportFilters.networkType;
      const dateFromMatch = !reportFilters.dateFrom || (report.created_at && report.created_at >= reportFilters.dateFrom);
      const dateToMatch = !reportFilters.dateTo || (report.created_at && report.created_at <= reportFilters.dateTo + 'T23:59:59');
      return statusMatch && riskTypeMatch && riskLevelMatch && cityMatch && neighborhoodMatch && cableNumberMatch && networkTypeMatch && dateFromMatch && dateToMatch;
    });
    if (!filteredReports || filteredReports.length === 0) {
      toast({ title: "Nenhum relatório encontrado no período selecionado.", variant: "destructive" });
      return;
    }
    // Mapeia para substituir o technician_id pelo nome do técnico e converte objetos/arrays para string JSON
    const exportData = filteredReports.map((report) => {
      const { technician_id, technician, ...rest } = report;
      // Converta objetos/arrays para string JSON
      const safeRest = Object.fromEntries(
        Object.entries(rest).map(([key, value]) => {
          if (typeof value === "object" && value !== null) {
            return [key, JSON.stringify(value)];
          }
          return [key, value];
        })
      );
      return {
        codigo_unico: getReportNumber(report),
        ...safeRest,
        tecnico_nome: technician?.name || ""
      };
    });
    exportToCSV(exportData, `relatorios_${dateFrom}_a_${dateTo}`);
  }

  // Buscar cidades do banco de dados
  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Buscar bairros do banco de dados
  const { data: neighborhoods = [] } = useQuery({
    queryKey: ['neighborhoods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neighborhoods')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Atualizar a lógica de filtragem para usar busca fuzzy
  const filteredReports = allReports.filter((report: any) => {
    const statusMatch = reportFilters.status === 'all' || report.status === reportFilters.status;
    const riskTypeMatch = reportFilters.riskType === 'all' || report.risk_type === reportFilters.riskType;
    const riskLevelMatch = reportFilters.riskLevel === 'all' || report.risk_level === reportFilters.riskLevel;
    const cityMatch = reportFilters.city === 'all' || report.city === reportFilters.city;
    
    // Busca fuzzy para bairro
    const neighborhoodMatch = reportFilters.neighborhood === 'all' || 
      (report.neighborhood && report.neighborhood === reportFilters.neighborhood);
    
    const cableNumberMatch = !reportFilters.cableNumber || (report.cable_number && report.cable_number.toLowerCase().includes(reportFilters.cableNumber.toLowerCase()));
    const networkTypeMatch = reportFilters.networkType === 'all' || report.network_type === reportFilters.networkType;
    
    // Filtro para número do relatório (número do risco)
    const reportNumberMatch = !reportFilters.reportNumber || 
      (report.report_number && report.report_number.toString().includes(reportFilters.reportNumber.replace(/^RIS-?/i, '')));
    
    const dateFromMatch = !reportFilters.dateFrom || (report.created_at && report.created_at >= reportFilters.dateFrom);
    const dateToMatch = !reportFilters.dateTo || (report.created_at && report.created_at <= reportFilters.dateTo + 'T23:59:59');
    
    return statusMatch && riskTypeMatch && riskLevelMatch && cityMatch && neighborhoodMatch && cableNumberMatch && networkTypeMatch && reportNumberMatch && dateFromMatch && dateToMatch;
  });

  const {
    visibleItems: paginatedReports,
    hasMore: hasMoreReports,
    showMore: showMoreReports,
    reset: resetReports
  } = usePagination(filteredReports, 10, 10);

  // Novo estado para modal de confirmação de cancelamento
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [riskToCancel, setRiskToCancel] = useState<any | null>(null);

  if (isLoading) {
    return <div>Carregando riscos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Relatórios de Vistoria Enviados
        </h2>
        {/* Filtros para relatórios */}
        {/* Primeira linha de filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <Label htmlFor="filter-status">Status</Label>
            <Select
              value={reportFilters.status}
              onValueChange={value => setReportFilters(f => ({ ...f, status: value as ReportStatus }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filter-risk-type">Tipo de Risco</Label>
            <Select
              value={reportFilters.riskType}
              onValueChange={v => setReportFilters(f => ({ ...f, riskType: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {RISK_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filter-risk-level">Grau de Risco</Label>
            <Select
              value={reportFilters.riskLevel}
              onValueChange={v => setReportFilters(f => ({ ...f, riskLevel: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os graus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {RISK_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filter-city">Cidade</Label>
            <Select
              value={reportFilters.city}
              onValueChange={v => setReportFilters(f => ({ ...f, city: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as cidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.name}>
                    {city.name} - {city.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Segunda linha de filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <Label htmlFor="filter-neighborhood">Bairro</Label>
            <Select
              value={reportFilters.neighborhood}
              onValueChange={v => setReportFilters(f => ({ ...f, neighborhood: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os bairros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {neighborhoods.map((neighborhood) => (
                  <SelectItem key={neighborhood.id} value={neighborhood.name}>
                    {neighborhood.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filter-cable-number">Número do Cabo</Label>
            <Input
              id="filter-cable-number"
              placeholder="Buscar número do cabo..."
              value={reportFilters.cableNumber}
              onChange={e => setReportFilters(f => ({ ...f, cableNumber: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="filter-report-number">Número do Risco</Label>
            <Input
              id="filter-report-number"
              placeholder="RIS-123"
              value={reportNumberInput}
              onChange={e => setReportNumberInput(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="filter-network-type">Rede</Label>
            <Select
              value={reportFilters.networkType}
              onValueChange={v => setReportFilters(f => ({ ...f, networkType: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as redes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {NETWORK_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Terceira linha de filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <Label htmlFor="filter-date-from">Data Início</Label>
            <Input
              id="filter-date-from"
              type="date"
              value={reportFilters.dateFrom}
              onChange={e => setReportFilters(f => ({ ...f, dateFrom: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="filter-date-to">Data Fim</Label>
            <Input
              id="filter-date-to"
              type="date"
              value={reportFilters.dateTo}
              onChange={e => setReportFilters(f => ({ ...f, dateTo: e.target.value }))}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setReportFilters({
                  status: 'all',
                  riskType: 'all',
                  riskLevel: 'all',
                  city: 'all',
                  neighborhood: 'all',
                  cableNumber: '',
                  networkType: 'all',
                  dateFrom: '',
                  dateTo: '',
                  reportNumber: ''
                });
                setReportNumberInput('');
              }}
            >
              Limpar Filtros
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={handleExportCsv}
            >
              Exportar CSV
            </Button>
          </div>
        </div>
            {/* Lista de relatórios filtrados */}
            {filteredReports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Nenhum relatório encontrado</h3>
                <p className="text-muted-foreground">
                  Nenhum relatório de vistoria encontrado com os filtros atuais.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedReports.map((report: any) => (
                  <div key={report.id} className="border rounded-lg p-4 mb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          Nº: <span className="text-primary font-mono">{getInspectionReportNumber(report)}</span>
                          {report.title || 'Relatório de Vistoria'}
                        </div>
                        <div className="text-sm text-muted-foreground flex flex-col sm:flex-row flex-wrap whitespace-normal break-words">
                          <span>Cabo: {report.cable_number || '-'}</span>
                          <span>Cliente: {report.technician?.name || '-'}</span>
                          <span>Técnico: {report.technician?.name || '-'}</span>
                          <span>Data: {report.created_at ? new Date(report.created_at).toLocaleDateString('pt-BR') : '-'}</span>
                          <span>Status: <Badge className={getStatusColor(report.status)}>{getStatusLabel(report.status)}</Badge></span>
                          <span>Técnico Direcionado: {report.assigned_profile?.name || 'Não Direcionado'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                        <Button
                          className="w-auto min-w-[120px] self-center"
                          size="sm"
                          variant="outline"
                          onClick={() => { setSelectedReport(report); setAssignDialogOpen(true); }}
                          disabled={report.status === 'concluido' || report.status === 'cancelado'}
                        >
                          Direcionar
                        </Button>
                        <Button
                          className="w-auto min-w-[120px] self-center"
                          size="sm"
                          variant="outline"
                          onClick={() => { setSelectedReport(report); setAssignDialogOpen(false); setShowDetailsDialog(true); }}
                        >
                          Ver Detalhes
                        </Button>
                        {report.status === 'concluido' && (
                          <Button
                            className="w-auto min-w-[120px] self-center"
                            size="sm"
                            variant="secondary"
                            onClick={async () => {
                              const { data, error } = await supabase
                                .from('reports')
                                .select('*')
                                .eq('inspection_report_id', report.id)
                                .order('created_at', { ascending: false })
                                .limit(1)
                                .single();
                              if (data) {
                                setFinalReport(data);
                                setShowFinalReportModal(true);
                              } else {
                                toast({ title: 'Relatório não encontrado', description: error?.message || 'Nenhum relatório técnico encontrado para esta vistoria.', variant: 'destructive' });
                              }
                            }}
                          >
                            Ver Relatório
                          </Button>
                        )}
                        {report.status !== 'cancelado' && (
                          <Button
                            className="w-auto min-w-[120px] self-center"
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setRiskToCancel(report);
                              setCancelDialogOpen(true);
                            }}
                            disabled={report.status === 'concluido'}
                          >
                            Cancelar
                          </Button>
                        )}
                        {report.status === 'cancelado' && (
                          <Button
                            className="w-auto min-w-[120px] self-center bg-green-600 text-white hover:bg-green-700"
                            size="sm"
                            variant="secondary"
                            onClick={async () => {
                              const { error } = await supabase
                                .from('inspection_reports')
                                .update({ status: 'pendente' })
                                .eq('id', report.id);
                              if (!error) {
                                toast({ title: 'Relatório reabilitado', description: 'O relatório foi reabilitado com sucesso.' });
                                setSelectedReport(r => r && r.id === report.id ? { ...r, status: 'pendente' } : r);
                                queryClient.invalidateQueries({ queryKey: ['all-inspection-reports-management'] });
                              } else {
                                toast({ title: 'Erro ao reabilitar', description: error.message, variant: 'destructive' });
                              }
                            }}
                          >
                            Reabilitar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {hasMoreReports && (
                  <div className="flex justify-center mt-4">
                    <Button onClick={showMoreReports} variant="outline">Ver mais</Button>
                  </div>
                )}
                <div className="text-xs text-gray-500 text-center mt-2">
                  Mostrando {paginatedReports.length} de {filteredReports.length} relatórios
                </div>
              </div>
            )}
          </div>

      {/* Dialog de direcionamento */}
      <Dialog open={directionDialog} onOpenChange={setDirectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Direcionar Risco</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="select-technician">Selecione o Técnico</Label>
              <Select
                value={selectedTechnician ?? undefined}
                onValueChange={v => setSelectedTechnician(v || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha o técnico" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((tech: any) => (
                    <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleDirection}
              disabled={!selectedTechnician || !selectedRisk}
              className="w-full"
            >
              Direcionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 5. Dialog para selecionar técnico */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Direcionar Relatório</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="select-technician">Selecione o Técnico</Label>
              <Select
                value={selectedTechnician ?? undefined}
                onValueChange={v => setSelectedTechnician(v || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha o técnico" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((tech: any) => (
                    <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => assignMutation.mutate({ reportId: selectedReport.id, technicianId: selectedTechnician! })}
              disabled={!selectedTechnician || !selectedReport || assignMutation.isPending}
              className="w-full"
            >
              Direcionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de detalhes do relatório */}
      <Dialog open={showDetailsDialog && !!selectedReport} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Relatório de Vistoria</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-2">
                              <div><b>Nº:</b> {getInspectionReportNumber(selectedReport)}</div>
              <div><b>Status:</b> <span className={`inline-block align-middle px-2 py-0.5 rounded ${getStatusColor(selectedReport.status)}`}>{getStatusLabel(selectedReport.status)}</span></div>
              <div><b>Técnico:</b> {selectedReport.technician?.name || '-'}</div>
              <div><b>Técnico Direcionado:</b> {selectedReport.assigned_profile?.name || 'Não Direcionado'}</div>
              <div><b>Data:</b> {selectedReport.created_at ? new Date(selectedReport.created_at).toLocaleDateString('pt-BR') : '-'}</div>
              <div><b>Tipo de Risco:</b> {selectedReport.risk_type || '-'}</div>
              <div><b>Grau de Risco:</b> {selectedReport.risk_level || '-'}</div>
              <div><b>Cidade:</b> {selectedReport.city || '-'}</div>
              <div><b>Bairro:</b> {selectedReport.neighborhood || '-'}</div>
              <div><b>Endereço:</b> {selectedReport.address || '-'}</div>
              <div><b>Número do Cabo:</b> {selectedReport.cable_number || '-'}</div>
              <div><b>Rede:</b> {selectedReport.network_type || '-'}</div>
              <div><b>Descrição:</b> {selectedReport.description || '-'}</div>
              <div><b>Fotos:</b></div>
              <div className="flex flex-wrap gap-2">
                {selectedReport.photos && selectedReport.photos.length > 0 ? (
                  selectedReport.photos.map((url: string, idx: number) => (
                    <ThumbnailImage
                      key={idx}
                      src={url}
                      alt={`Foto ${idx + 1}`}
                      className="w-32 h-32 rounded border"
                      onClick={() => setZoomedIndex(idx)}
                    />
                  ))
                ) : (
                  <span className="text-muted-foreground">Nenhuma foto enviada.</span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de imagem ampliada */}
      <Dialog open={zoomedIndex !== null} onOpenChange={open => !open && setZoomedIndex(null)}>
        <DialogContent className="max-w-3xl flex flex-col items-center">
          {zoomedIndex !== null && (
            <>
              <div className="flex items-center gap-4 mb-4 z-10 bg-white/90 px-4 py-2 rounded shadow">
                <button
                  className="px-2 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                  onClick={e => {
                    e.stopPropagation();
                    setZoomedIndex(prev =>
                      prev !== null
                        ? (prev - 1 + selectedReport.photos.length) % selectedReport.photos.length
                        : 0
                    );
                  }}
                  disabled={selectedReport.photos.length <= 1}
                >
                  &#8592; Anterior
                </button>
                <span className="text-sm text-gray-700 font-medium">
                  {zoomedIndex + 1} / {selectedReport.photos.length}
                </span>
                <button
                  className="px-2 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                  onClick={e => {
                    e.stopPropagation();
                    setZoomedIndex(prev =>
                      prev !== null
                        ? (prev + 1) % selectedReport.photos.length
                        : 0
                    );
                  }}
                  disabled={selectedReport.photos.length <= 1}
                >
                  Próxima &#8594;
                </button>
              </div>
              <FullImage
                src={selectedReport.photos[zoomedIndex]}
                alt={`Foto ampliada ${zoomedIndex + 1}`}
                className="max-h-[70vh] w-auto rounded shadow"
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para visualizar relatório final */}
      <ReportViewModal
        report={finalReport}
        open={showFinalReportModal}
        onClose={() => setShowFinalReportModal(false)}
      />

      {/* Modal de confirmação de cancelamento */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Risco</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Tem certeza que deseja cancelar este risco?
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!riskToCancel) return;
                const { error } = await supabase
                  .from('inspection_reports')
                  .update({ status: 'cancelado' })
                  .eq('id', riskToCancel.id);
                if (!error) {
                  toast({ title: 'Risco cancelado', description: 'O risco foi cancelado com sucesso.' });
                  setSelectedReport(r => r && r.id === riskToCancel.id ? { ...r, status: 'cancelado' } : r);
                  queryClient.invalidateQueries({ queryKey: ['all-inspection-reports-management'] });
                } else {
                  toast({ title: 'Erro ao cancelar', description: error.message, variant: 'destructive' });
                }
                setCancelDialogOpen(false);
                setRiskToCancel(null);
              }}
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RisksManagement;
