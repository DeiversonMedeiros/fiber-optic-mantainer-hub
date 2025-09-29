import { supabase } from '@/integrations/supabase/client';
import { testClientConfigurations, checkSchemaAvailability } from './supabaseConfig';

export const testSchemaAccess = async () => {
  console.log('🔍 Testando acesso às tabelas do schema RH...');
  
  // Primeiro, verificar a disponibilidade do schema
  await checkSchemaAvailability();
  
  // Depois, testar diferentes configurações de cliente
  await testClientConfigurations();
  
  // Por fim, testar diferentes formas de acesso
  const tests = [
    {
      name: 'Teste 1: employees (sem schema)',
      query: () => supabase.from('employees').select('*').limit(1)
    },
    {
      name: 'Teste 2: rh.employees (com schema)',
      query: () => (supabase as any).from('rh.employees').select('*').limit(1)
    },
    {
      name: 'Teste 3: "rh"."employees" (com aspas)',
      query: () => (supabase as any).from('"rh"."employees"').select('*').limit(1)
    },
    {
      name: 'Teste 4: RPC get_employees',
      query: () => (supabase as any).rpc('get_employees', { company_id: null })
    },
    {
      name: 'Teste 5: Verificar schemas disponíveis',
      query: () => (supabase as any).rpc('get_schemas')
    }
  ];

  for (const test of tests) {
    try {
      console.log(`\n📋 ${test.name}`);
      const { data, error } = await test.query();
      
      if (error) {
        console.log(`❌ Erro:`, error);
      } else {
        console.log(`✅ Sucesso:`, data);
      }
    } catch (err) {
      console.log(`💥 Exceção:`, err);
    }
  }
  
  // Teste adicional: verificar se conseguimos listar as tabelas
  try {
    console.log('\n📋 Teste 6: Listar tabelas disponíveis');
    const { data, error } = await (supabase as any).rpc('list_tables');
    
    if (error) {
      console.log(`❌ Erro ao listar tabelas:`, error);
    } else {
      console.log(`✅ Tabelas disponíveis:`, data);
    }
  } catch (err) {
    console.log(`💥 Exceção ao listar tabelas:`, err);
  }
};

export const testSpecificTable = async (tableName: string) => {
  console.log(`🔍 Testando acesso específico à tabela: ${tableName}`);
  
  const tests = [
    {
      name: `Teste 1: ${tableName} (sem schema)`,
      query: () => supabase.from(tableName).select('*').limit(1)
    },
    {
      name: `Teste 2: rh.${tableName} (com schema)`,
      query: () => (supabase as any).from(`rh.${tableName}`).select('*').limit(1)
    },
    {
      name: `Teste 3: "rh"."${tableName}" (com aspas)`,
      query: () => (supabase as any).from(`"rh"."${tableName}"`).select('*').limit(1)
    }
  ];

  for (const test of tests) {
    try {
      console.log(`\n📋 ${test.name}`);
      const { data, error } = await test.query();
      
      if (error) {
        console.log(`❌ Erro:`, error);
      } else {
        console.log(`✅ Sucesso:`, data);
      }
    } catch (err) {
      console.log(`💥 Exceção:`, err);
    }
  }
};
