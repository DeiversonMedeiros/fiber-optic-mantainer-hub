// @ts-nocheck
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Briefcase, 
  Building, 
  Users, 
  ChevronRight, 
  ChevronDown
} from 'lucide-react';
import { OrganogramNode, OrganogramView } from '@/services/rh/organogramService';
import { OrganogramActionsMenu } from './OrganogramActionsMenu';
import { cn } from '@/lib/utils';

interface OrganogramTreeProps {
  nodes: OrganogramNode[];
  view: OrganogramView;
  showInactive?: boolean;
  level?: number;
  onNodeClick?: (node: OrganogramNode) => void;
  onNodeAction?: (action: string, node: OrganogramNode) => void;
}

interface OrganogramNodeProps {
  node: OrganogramNode;
  view: OrganogramView;
  showInactive?: boolean;
  level: number;
  onNodeClick?: (node: OrganogramNode) => void;
  onNodeAction?: (action: string, node: OrganogramNode) => void;
}

function OrganogramNodeComponent({ 
  node, 
  view, 
  showInactive = false, 
  level, 
  onNodeClick,
  onNodeAction
}: OrganogramNodeProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  const getNodeIcon = () => {
    switch (view) {
      case 'person':
        return <User className="h-4 w-4" />;
      case 'position':
        return <Briefcase className="h-4 w-4" />;
      case 'cost_center':
        return <Building className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getNodeColor = () => {
    if (!node.metadata.is_active && !showInactive) return 'opacity-50';
    
    switch (level % 4) {
      case 0: return 'border-blue-200 bg-blue-50';
      case 1: return 'border-green-200 bg-green-50';
      case 2: return 'border-purple-200 bg-purple-50';
      case 3: return 'border-orange-200 bg-orange-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Nó principal */}
      <div className="relative">
        <Card 
          className={cn(
            "w-64 min-w-64 cursor-pointer transition-all duration-200 hover:shadow-md",
            getNodeColor(),
            level > 0 && "mt-4"
          )}
          onClick={() => onNodeClick?.(node)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getNodeIcon()}
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-sm truncate" title={node.name}>
                    {node.name}
                  </h3>
                  
                  {/* Metadados específicos por tipo */}
                  {view === 'person' && (
                    <div className="text-xs text-muted-foreground space-y-1 mt-1">
                      {node.metadata.position && (
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          <span className="truncate">{node.metadata.position}</span>
                        </div>
                      )}
                      {node.metadata.cost_center && (
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          <span className="truncate">{node.metadata.cost_center}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {view === 'position' && node.metadata.employee_count !== undefined && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Users className="h-3 w-3" />
                      <span>{node.metadata.employee_count} funcionário(s)</span>
                    </div>
                  )}
                  
                  {(view === 'cost_center' || view === 'department') && node.metadata.employee_count !== undefined && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Users className="h-3 w-3" />
                      <span>{node.metadata.employee_count} funcionário(s)</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 ml-2">
                {!node.metadata.is_active && (
                  <Badge variant="secondary" className="text-xs">
                    Inativo
                  </Badge>
                )}
                
                {hasChildren && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </Button>
                )}
                
                <OrganogramActionsMenu
                  node={node}
                  onView={() => onNodeAction?.('view', node)}
                  onEdit={() => onNodeAction?.('edit', node)}
                  onDelete={() => onNodeAction?.('delete', node)}
                  onMoveUp={() => onNodeAction?.('moveUp', node)}
                  onMoveDown={() => onNodeAction?.('moveDown', node)}
                  onMoveTo={() => onNodeAction?.('moveTo', node)}
                  onManageSubordinates={() => onNodeAction?.('manageSubordinates', node)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Linha conectora para filhos */}
        {hasChildren && isExpanded && (
          <div className="absolute left-1/2 top-full w-px h-4 bg-gray-300 transform -translate-x-1/2" />
        )}
      </div>

      {/* Filhos */}
      {hasChildren && isExpanded && (
        <div className="flex gap-4 mt-4 relative">
          {/* Linha horizontal conectando os filhos */}
          <div className="absolute left-0 right-0 top-0 h-px bg-gray-300" />
          
          {node.children.map((child, index) => (
            <div key={child.id} className="relative">
              {/* Linha vertical para cada filho */}
              <div className="absolute left-1/2 -top-4 w-px h-4 bg-gray-300 transform -translate-x-1/2" />
              
              <OrganogramNodeComponent
                node={child}
                view={view}
                showInactive={showInactive}
                level={level + 1}
                onNodeClick={onNodeClick}
                onNodeAction={onNodeAction}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function OrganogramTree({ 
  nodes, 
  view, 
  showInactive = false, 
  level = 0,
  onNodeClick,
  onNodeAction
}: OrganogramTreeProps) {
  if (nodes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Nenhum dado encontrado</h3>
          <p className="text-sm">
            Não há {view === 'person' ? 'funcionários' : 
                      view === 'position' ? 'cargos' : 
                      'centros de custo'} para exibir.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {nodes.map((node) => (
        <OrganogramNodeComponent
          key={node.id}
          node={node}
          view={view}
          showInactive={showInactive}
          level={level}
          onNodeClick={onNodeClick}
          onNodeAction={onNodeAction}
        />
      ))}
    </div>
  );
}
