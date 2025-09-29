import { rhSupabase, coreSupabase } from '@/integrations/supabase/client';

export type OrganogramNode = {
  id: string;
  name: string;
  type: 'person' | 'position' | 'cost_center' | 'department';
  level: number;
  parentId?: string | null;
  children: OrganogramNode[];
  metadata: {
    position?: string;
    cost_center?: string;
    department?: string;
    manager?: string;
    employee_count?: number;
    is_active?: boolean;
    avatar?: string;
  };
};

export type OrganogramView = 'person' | 'position' | 'cost_center';

export const OrganogramService = {
  // Obter organograma por pessoa (hierarquia de funcionários)
  async getPersonOrganogram(companyId: string): Promise<OrganogramNode[]> {
    const { data: employees, error } = await rhSupabase
      .from('rh.employees')
      .select(`
        id,
        nome,
        manager_id,
        position_id,
        cost_center_id,
        department_id,
        status,
        positions(nome)
      `)
      .eq('company_id', companyId)
      .eq('status', 'ativo')
      .order('nome');

    if (error) throw error;

    // Buscar informações de centro de custo e departamento separadamente
    const employeeIds = employees?.map(emp => emp.id) || [];
    let costCenterData: any[] = [];
    let departmentData: any[] = [];

    if (employeeIds.length > 0) {
      const [costCentersResult, departmentsResult] = await Promise.all([
        coreSupabase
          .from('core.cost_centers')
          .select('id, nome')
          .eq('company_id', companyId)
          .eq('is_active', true),
        coreSupabase
          .from('rh.departments')
          .select('id, nome')
          .eq('company_id', companyId)
          .eq('is_active', true)
      ]);

      costCenterData = costCentersResult.data || [];
      departmentData = departmentsResult.data || [];
    }

    // Construir hierarquia de funcionários
    const employeeMap = new Map();
    const rootEmployees: any[] = [];

    // Criar mapas para lookup rápido
    const costCenterMap = new Map(costCenterData.map(cc => [cc.id, cc.nome]));
    const departmentMap = new Map(departmentData.map(dept => [dept.id, dept.nome]));

    // Primeiro, mapear todos os funcionários
    employees?.forEach(emp => {
      employeeMap.set(emp.id, {
        id: emp.id,
        name: emp.nome,
        type: 'person' as const,
        level: 0,
        parentId: emp.manager_id,
        children: [],
        metadata: {
          position: emp.positions?.nome,
          cost_center: emp.cost_center_id ? costCenterMap.get(emp.cost_center_id) : null,
          department: emp.department_id ? departmentMap.get(emp.department_id) : null,
          is_active: emp.status === 'ativo',
        }
      });
    });

    // Construir árvore hierárquica
    employees?.forEach(emp => {
      const node = employeeMap.get(emp.id);
      if (emp.manager_id) {
        const parent = employeeMap.get(emp.manager_id);
        if (parent) {
          parent.children.push(node);
          node.level = parent.level + 1;
        } else {
          rootEmployees.push(node);
        }
      } else {
        rootEmployees.push(node);
      }
    });

    return rootEmployees;
  },

  // Obter organograma por cargo (estrutura de posições)
  async getPositionOrganogram(companyId: string): Promise<OrganogramNode[]> {
    const { data: positions, error } = await rhSupabase
      .from('rh.positions')
      .select(`
        id,
        nome,
        descricao,
        is_active
      `)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('nome');

    if (error) throw error;

    // Buscar funcionários por posição
    const positionIds = positions?.map(pos => pos.id) || [];
    let employeeData: any[] = [];

    if (positionIds.length > 0) {
      const { data: employees } = await rhSupabase
        .from('rh.employees')
        .select('id, nome, position_id')
        .eq('company_id', companyId)
        .eq('status', 'ativo')
        .in('position_id', positionIds);

      employeeData = employees || [];
    }

    // Contar funcionários por posição
    const employeeCountMap = new Map();
    employeeData.forEach(emp => {
      if (emp.position_id) {
        employeeCountMap.set(emp.position_id, (employeeCountMap.get(emp.position_id) || 0) + 1);
      }
    });

    return positions?.map(pos => ({
      id: pos.id,
      name: pos.nome,
      type: 'position' as const,
      level: 0,
      children: [],
      metadata: {
        position: pos.nome,
        employee_count: employeeCountMap.get(pos.id) || 0,
        is_active: pos.is_active,
      }
    })) || [];
  },

  // Obter organograma por centro de custo
  async getCostCenterOrganogram(companyId: string): Promise<OrganogramNode[]> {
    const { data: costCenters, error } = await coreSupabase
      .from('core.cost_centers')
      .select(`
        id,
        nome,
        codigo,
        descricao,
        parent_id,
        is_active
      `)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('codigo');

    if (error) throw error;

    // Buscar funcionários por centro de custo
    const costCenterIds = costCenters?.map(cc => cc.id) || [];
    let employeeData: any[] = [];

    if (costCenterIds.length > 0) {
      const { data: employees } = await rhSupabase
        .from('rh.employees')
        .select('id, nome, cost_center_id')
        .eq('company_id', companyId)
        .eq('status', 'ativo')
        .in('cost_center_id', costCenterIds);

      employeeData = employees || [];
    }

    // Construir hierarquia de centros de custo
    const costCenterMap = new Map();
    const rootCostCenters: any[] = [];

    // Contar funcionários por centro de custo
    const employeeCountMap = new Map();
    employeeData.forEach(emp => {
      if (emp.cost_center_id) {
        employeeCountMap.set(emp.cost_center_id, (employeeCountMap.get(emp.cost_center_id) || 0) + 1);
      }
    });

    // Mapear todos os centros de custo
    costCenters?.forEach(cc => {
      costCenterMap.set(cc.id, {
        id: cc.id,
        name: `${cc.codigo} - ${cc.nome}`,
        type: 'cost_center' as const,
        level: 0,
        parentId: cc.parent_id,
        children: [],
        metadata: {
          cost_center: cc.nome,
          employee_count: employeeCountMap.get(cc.id) || 0,
          is_active: cc.is_active,
        }
      });
    });

    // Construir árvore hierárquica
    costCenters?.forEach(cc => {
      const node = costCenterMap.get(cc.id);
      if (cc.parent_id) {
        const parent = costCenterMap.get(cc.parent_id);
        if (parent) {
          parent.children.push(node);
          node.level = parent.level + 1;
        } else {
          rootCostCenters.push(node);
        }
      } else {
        rootCostCenters.push(node);
      }
    });

    return rootCostCenters;
  },

  // Obter organograma por departamento
  async getDepartmentOrganogram(companyId: string): Promise<OrganogramNode[]> {
    const { data: departments, error } = await coreSupabase
      .from('rh.departments')
      .select(`
        id,
        nome,
        descricao,
        parent_id,
        is_active
      `)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('nome');

    if (error) throw error;

    // Buscar funcionários por departamento
    const departmentIds = departments?.map(dept => dept.id) || [];
    let employeeData: any[] = [];

    if (departmentIds.length > 0) {
      const { data: employees } = await rhSupabase
        .from('rh.employees')
        .select('id, nome, department_id')
        .eq('company_id', companyId)
        .eq('status', 'ativo')
        .in('department_id', departmentIds);

      employeeData = employees || [];
    }

    // Construir hierarquia de departamentos
    const departmentMap = new Map();
    const rootDepartments: any[] = [];

    // Contar funcionários por departamento
    const employeeCountMap = new Map();
    employeeData.forEach(emp => {
      if (emp.department_id) {
        employeeCountMap.set(emp.department_id, (employeeCountMap.get(emp.department_id) || 0) + 1);
      }
    });

    // Mapear todos os departamentos
    departments?.forEach(dept => {
      departmentMap.set(dept.id, {
        id: dept.id,
        name: dept.nome,
        type: 'department' as const,
        level: 0,
        parentId: dept.parent_id,
        children: [],
        metadata: {
          department: dept.nome,
          employee_count: employeeCountMap.get(dept.id) || 0,
          is_active: dept.is_active,
        }
      });
    });

    // Construir árvore hierárquica
    departments?.forEach(dept => {
      const node = departmentMap.get(dept.id);
      if (dept.parent_id) {
        const parent = departmentMap.get(dept.parent_id);
        if (parent) {
          parent.children.push(node);
          node.level = parent.level + 1;
        } else {
          rootDepartments.push(node);
        }
      } else {
        rootDepartments.push(node);
      }
    });

    return rootDepartments;
  },

  // Obter organograma baseado na visão selecionada
  async getOrganogram(companyId: string, view: OrganogramView): Promise<OrganogramNode[]> {
    switch (view) {
      case 'person':
        return this.getPersonOrganogram(companyId);
      case 'position':
        return this.getPositionOrganogram(companyId);
      case 'cost_center':
        return this.getCostCenterOrganogram(companyId);
      default:
        return this.getPersonOrganogram(companyId);
    }
  },

  // Obter estatísticas do organograma
  async getOrganogramStats(companyId: string): Promise<{
    totalEmployees: number;
    totalPositions: number;
    totalCostCenters: number;
    totalDepartments: number;
    maxHierarchyLevel: number;
  }> {
    const [employeesResult, positionsResult, costCentersResult, departmentsResult] = await Promise.all([
      rhSupabase.from('rh.employees').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'ativo'),
      rhSupabase.from('rh.positions').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('is_active', true),
      coreSupabase.from('core.cost_centers').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('is_active', true),
      coreSupabase.from('rh.departments').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('is_active', true),
    ]);

    if (employeesResult.error) throw employeesResult.error;
    if (positionsResult.error) throw positionsResult.error;
    if (costCentersResult.error) throw costCentersResult.error;
    if (departmentsResult.error) throw departmentsResult.error;

    // Calcular nível máximo de hierarquia
    const { data: maxLevelData } = await rhSupabase
      .from('rh.employees')
      .select('manager_id')
      .eq('company_id', companyId)
      .eq('status', 'ativo');

    // Função simples para calcular profundidade máxima
    const calculateMaxDepth = (employees: any[], parentId: string | null = null, currentDepth = 0): number => {
      const children = employees.filter(emp => emp.manager_id === parentId);
      if (children.length === 0) return currentDepth;
      
      return Math.max(...children.map(child => 
        calculateMaxDepth(employees, child.manager_id, currentDepth + 1)
      ));
    };

    const maxHierarchyLevel = calculateMaxDepth(maxLevelData || []) + 1;

    return {
      totalEmployees: employeesResult.count || 0,
      totalPositions: positionsResult.count || 0,
      totalCostCenters: costCentersResult.count || 0,
      totalDepartments: departmentsResult.count || 0,
      maxHierarchyLevel,
    };
  }
};
