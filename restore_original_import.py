#!/usr/bin/env python3
"""
Script para restaurar o import original do EmployeeDetailsTabs
"""

def restore_original_import():
    file_path = 'src/components/rh/EmployeeManagement.tsx'
    
    # Ler o arquivo
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Substituir o import de teste pelo original
    old_import = "import { EmployeeDetailsTabsTest as EmployeeDetailsTabs } from './EmployeeDetailsTabsTest';"
    new_import = "import { EmployeeDetailsTabs } from './EmployeeDetailsTabs';"
    
    # Aplicar a correção
    new_content = content.replace(old_import, new_import)
    
    # Salvar o arquivo corrigido
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("✅ Import original restaurado!")

if __name__ == "__main__":
    restore_original_import()



























