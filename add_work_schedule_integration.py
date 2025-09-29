#!/usr/bin/env python3
"""
Script para adicionar integração com work-schedule na aba Pessoal do EmployeeDetailsTabs
"""

import re

def add_work_schedule_integration():
    file_path = 'src/components/rh/EmployeeDetailsTabs.tsx'
    
    # Ler o arquivo
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Adicionar import do useWorkShifts
    import_pattern = r"(import { useEmployeeBenefits } from '@/hooks/rh';)"
    import_replacement = r"""import { useEmployeeBenefits } from '@/hooks/rh';
import { useWorkShifts } from '@/hooks/rh/useWorkShifts';"""
    
    content = re.sub(import_pattern, import_replacement, content)
    
    # 2. Adicionar hook useWorkShifts no componente
    hook_pattern = r"(const { data: benefits = \[\], isLoading: benefitsLoading, createBenefit, updateBenefit, deleteBenefit } = useEmployeeBenefits\(employee\.id\);)"
    hook_replacement = r"""const { data: benefits = [], isLoading: benefitsLoading, createBenefit, updateBenefit, deleteBenefit } = useEmployeeBenefits(employee.id);
  
  // Buscar turnos de trabalho disponíveis
  const { workShifts = [], isLoading: workShiftsLoading } = useWorkShifts(companyId);"""
    
    content = re.sub(hook_pattern, hook_replacement, content)
    
    # 3. Adicionar campo de turno de trabalho na seção "Configurações de Trabalho"
    work_schedule_field = '''                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="work_schedule_id" className="text-sm font-medium text-muted-foreground">
                      Turno de Trabalho
                    </label>
                    <select
                      id="work_schedule_id"
                      disabled={!isEditing || workShiftsLoading}
                      value={employee.work_schedule_id || ''}
                      onChange={(e) => {
                        if (isEditing) {
                          console.log('Turno de trabalho:', e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                    >
                      <option value="">Selecione o turno</option>
                      {workShifts.map((shift) => (
                        <option key={shift.id} value={shift.id}>
                          {shift.nome} ({shift.hora_inicio} - {shift.hora_fim})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {employee.work_schedule_id ? 
                        workShifts.find(s => s.id === employee.work_schedule_id)?.nome || 'Turno não encontrado' : 
                        'Não definido'
                      }
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">'''
    
    # Encontrar onde inserir o campo
    config_pattern = r'(<div className="space-y-4">\s*<h3 className="text-lg font-medium border-b pb-2">Configurações de Trabalho</h3>\s*<div className="grid grid-cols-1 md:grid-cols-2 gap-4">)'
    content = re.sub(config_pattern, r'\1' + work_schedule_field, content)
    
    # Salvar o arquivo modificado
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Integração com work-schedule adicionada com sucesso!")

if __name__ == "__main__":
    add_work_schedule_integration()



























