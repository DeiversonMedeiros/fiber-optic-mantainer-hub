#!/usr/bin/env python3
"""
Script para adicionar integração com work-schedule manualmente
"""

def add_work_schedule_manual():
    file_path = 'src/components/rh/EmployeeDetailsTabs.tsx'
    
    # Ler o arquivo
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Adicionar import do useWorkShifts após a linha 46
    lines = content.split('\n')
    
    # Encontrar a linha com useEmployeeContracts
    for i, line in enumerate(lines):
        if 'useEmployeeContracts' in line:
            # Adicionar o import na próxima linha
            lines.insert(i + 1, "import { useWorkShifts } from '@/hooks/rh/useWorkShifts';")
            break
    
    # 2. Adicionar o hook useWorkShifts após os outros hooks
    for i, line in enumerate(lines):
        if 'const { data: benefits = [], isLoading: benefitsLoading, createBenefit, updateBenefit, deleteBenefit } = useEmployeeBenefits(employee.id);' in line:
            # Adicionar o hook na próxima linha
            lines.insert(i + 1, "")
            lines.insert(i + 2, "  // Buscar turnos de trabalho disponíveis")
            lines.insert(i + 3, "  const { workShifts = [], isLoading: workShiftsLoading } = useWorkShifts(companyId);")
            break
    
    # 3. Adicionar o campo de turno de trabalho na seção "Configurações de Trabalho"
    for i, line in enumerate(lines):
        if 'Configurações de Trabalho' in line:
            # Encontrar onde inserir o campo (após o h3)
            for j in range(i, min(i + 20, len(lines))):
                if '<div className="grid grid-cols-1 md:grid-cols-2 gap-4">' in lines[j] and 'precisa_registrar_ponto' in lines[j + 1]:
                    # Inserir o campo de turno antes do campo precisa_registrar_ponto
                    work_schedule_field = [
                        '                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">',
                        '                  <div className="space-y-2">',
                        '                    <label htmlFor="work_schedule_id" className="text-sm font-medium text-muted-foreground">',
                        '                      Turno de Trabalho',
                        '                    </label>',
                        '                    <select',
                        '                      id="work_schedule_id"',
                        '                      disabled={!isEditing || workShiftsLoading}',
                        '                      value={employee.work_schedule_id || \'\'}',
                        '                      onChange={(e) => {',
                        '                        if (isEditing) {',
                        '                          console.log(\'Turno de trabalho:\', e.target.value);',
                        '                        }',
                        '                      }}',
                        '                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"',
                        '                    >',
                        '                      <option value="">Selecione o turno</option>',
                        '                      {workShifts.map((shift) => (',
                        '                        <option key={shift.id} value={shift.id}>',
                        '                          {shift.nome} ({shift.hora_inicio} - {shift.hora_fim})',
                        '                        </option>',
                        '                      ))}',
                        '                    </select>',
                        '                  </div>',
                        '                  <div className="flex items-center space-x-2">',
                        '                    <Clock className="h-4 w-4 text-muted-foreground" />',
                        '                    <span className="text-sm text-muted-foreground">',
                        '                      {employee.work_schedule_id ? ',
                        '                        workShifts.find(s => s.id === employee.work_schedule_id)?.nome || \'Turno não encontrado\' : ',
                        '                        \'Não definido\'',
                        '                      }',
                        '                    </span>',
                        '                  </div>',
                        '                </div>',
                        '                '
                    ]
                    
                    # Inserir o campo
                    for k, field_line in enumerate(work_schedule_field):
                        lines.insert(j + k, field_line)
                    break
            break
    
    # Salvar o arquivo modificado
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    
    print("✅ Integração com work-schedule adicionada manualmente!")

if __name__ == "__main__":
    add_work_schedule_manual()

























