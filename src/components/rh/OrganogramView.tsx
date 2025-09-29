import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Briefcase, 
  Building, 
  TreePine, 
  Eye, 
  EyeOff, 
  ZoomIn, 
  ZoomOut,
  Download,
  Settings
} from 'lucide-react';
import { OrganogramNode, OrganogramView } from '@/services/rh/organogramService';
import { useOrganogram, useOrganogramStats } from '@/hooks/rh/useOrganogram';
import { OrganogramTree } from './OrganogramTree';
import { OrganogramStats } from './OrganogramStats';
import { HierarchyManagementModal } from './HierarchyManagementModal';
import { useToast } from '@/hooks/use-toast';

interface OrganogramViewProps {
  companyId: string;
  className?: string;
}

export function OrganogramViewComponent({ companyId, className = '' }: OrganogramViewProps) {
  const [selectedView, setSelectedView] = useState<OrganogramView>('person');
  const [showInactive, setShowInactive] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedNode, setSelectedNode] = useState<OrganogramNode | null>(null);
  const { toast } = useToast();

  const { data: organogram = [], isLoading, error } = useOrganogram(companyId, selectedView);
  const { data: stats } = useOrganogramStats(companyId);

  const viewOptions = [
    {
      value: 'person' as OrganogramView,
      label: 'Por Pessoa',
      description: 'Hierarquia de funcionários',
      icon: <Users className="h-4 w-4" />,
      color: 'bg-blue-100 text-blue-700'
    },
    {
      value: 'position' as OrganogramView,
      label: 'Por Cargo',
      description: 'Estrutura de posições',
      icon: <Briefcase className="h-4 w-4" />,
      color: 'bg-green-100 text-green-700'
    },
    {
      value: 'cost_center' as OrganogramView,
      label: 'Por Centro de Custo',
      description: 'Hierarquia de centros de custo',
      icon: <Building className="h-4 w-4" />,
      color: 'bg-purple-100 text-purple-700'
    }
  ];

  const currentView = viewOptions.find(v => v.value === selectedView);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleExport = () => {
    // TODO: Implementar exportação
    console.log('Exportar organograma');
  };

  const handleNodeAction = (action: string, node: OrganogramNode) => {
    switch (action) {
      case 'view':
        toast({
          title: 'Visualizar',
          description: `Visualizando detalhes de ${node.name}`,
        });
        break;
      case 'edit':
        toast({
          title: 'Editar',
          description: `Editando ${node.name}`,
        });
        break;
      case 'delete':
        toast({
          title: 'Desativar',
          description: `Desativando ${node.name}`,
        });
        break;
      case 'moveUp':
        toast({
          title: 'Promover',
          description: `Promovendo ${node.name}`,
        });
        break;
      case 'moveDown':
        toast({
          title: 'Reorganizar',
          description: `Reorganizando ${node.name}`,
        });
        break;
      case 'moveTo':
        toast({
          title: 'Mover',
          description: `Movendo ${node.name}`,
        });
        break;
      case 'manageSubordinates':
        setSelectedNode(node);
        break;
      default:
        console.log('Ação não implementada:', action, node);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-full animate-pulse mx-auto mb-2"></div>
          <p className="text-muted-foreground">Carregando organograma...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive">Erro ao carregar organograma: {error.message}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estatísticas */}
      {stats && <OrganogramStats stats={stats} />}

      {/* Controles */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex items-center gap-3">
              <TreePine className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="flex items-center gap-2">
                  Organograma
                  <Badge variant="outline" className={currentView?.color}>
                    {currentView?.label}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentView?.description}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              {/* Seletor de visão */}
              <Select value={selectedView} onValueChange={(value: OrganogramView) => setSelectedView(value)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Selecionar visão" />
                </SelectTrigger>
                <SelectContent>
                  {viewOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Controles de visualização */}
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInactive(!showInactive)}
                >
                  {showInactive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 2}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Abas para diferentes visualizações */}
          <Tabs value={selectedView} onValueChange={(value: OrganogramView) => setSelectedView(value)}>
            <TabsList className="grid w-full grid-cols-3">
              {viewOptions.map((option) => (
                <TabsTrigger key={option.value} value={option.value} className="flex items-center gap-2">
                  {option.icon}
                  <span className="hidden sm:inline">{option.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {viewOptions.map((option) => (
              <TabsContent key={option.value} value={option.value} className="mt-6">
                <div 
                  className="border rounded-lg p-4 overflow-auto bg-background"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
                >
                  <OrganogramTree 
                    nodes={organogram} 
                    view={selectedView}
                    showInactive={showInactive}
                    onNodeAction={handleNodeAction}
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de Gerenciamento de Hierarquia */}
      {selectedNode && (
        <HierarchyManagementModal
          node={selectedNode}
          view={selectedView}
          companyId={companyId}
          onSave={(changes) => {
            console.log('Salvando mudanças de hierarquia:', changes);
            setSelectedNode(null);
          }}
        />
      )}
    </div>
  );
}
