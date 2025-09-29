#!/usr/bin/env python3
"""
Script para corrigir a importação duplicada do CreditCard no arquivo EmployeeDetailsTabs.tsx
"""

import re

def fix_duplicate_creditcard():
    file_path = 'src/components/rh/EmployeeDetailsTabs.tsx'
    
    # Ler o arquivo
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Padrão para encontrar a seção de importação
    pattern = r"import \{ \s*User, \s*FileText, \s*MapPin, \s*Heart, \s*CreditCard, \s*GraduationCap,\s*Edit,\s*Trash2,\s*Users,\s*Gift,\s*FileSignature,\s*Calculator,\s*Clock,\s*Shield,\s*CreditCard,\s*Bus\s*\} from 'lucide-react';"
    
    # Substituição corrigida
    replacement = """import { 
  User, 
  FileText, 
  MapPin, 
  Heart, 
  CreditCard, 
  GraduationCap,
  Edit,
  Trash2,
  Users,
  Gift,
  FileSignature,
  Calculator,
  Clock,
  Shield,
  Bus
} from 'lucide-react';"""
    
    # Aplicar a correção
    new_content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)
    
    # Salvar o arquivo corrigido
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("✅ Erro de importação duplicada corrigido!")

if __name__ == "__main__":
    fix_duplicate_creditcard()



























