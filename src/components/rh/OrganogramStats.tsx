import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, Building, TreePine, TrendingUp } from 'lucide-react';

interface OrganogramStatsProps {
  stats: {
    totalEmployees: number;
    totalPositions: number;
    totalCostCenters: number;
    totalDepartments: number;
    maxHierarchyLevel: number;
  };
}

export function OrganogramStats({ stats }: OrganogramStatsProps) {
  const statCards = [
    {
      title: 'Total de Funcionários',
      value: stats.totalEmployees,
      icon: <Users className="h-4 w-4 text-blue-600" />,
      color: 'text-blue-600',
      description: 'Funcionários ativos'
    },
    {
      title: 'Cargos',
      value: stats.totalPositions,
      icon: <Briefcase className="h-4 w-4 text-green-600" />,
      color: 'text-green-600',
      description: 'Posições ativas'
    },
    {
      title: 'Centros de Custo',
      value: stats.totalCostCenters,
      icon: <Building className="h-4 w-4 text-purple-600" />,
      color: 'text-purple-600',
      description: 'Centros ativos'
    },
    {
      title: 'Departamentos',
      value: stats.totalDepartments,
      icon: <TreePine className="h-4 w-4 text-orange-600" />,
      color: 'text-orange-600',
      description: 'Departamentos ativos'
    },
    {
      title: 'Níveis Hierárquicos',
      value: stats.maxHierarchyLevel,
      icon: <TrendingUp className="h-4 w-4 text-indigo-600" />,
      color: 'text-indigo-600',
      description: 'Profundidade máxima'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
