import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://nhvlgnmpbihamgvdbmwa.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5odmxnbm1wYmloYW1ndmRibXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTQ3NjUsImV4cCI6MjA3MTk5MDc2NX0.NwSwIZ8MPMaJcYJzQz7mofqT2-_pQI8aisgX5HChJN8";

// Cliente Supabase com configurações específicas para resolver problemas de schema
export const createRHClient = () => {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'X-Client-Info': 'fiber-optic-mantainer-hub',
        'Accept-Profile': 'rh', // Tenta definir o schema padrão como 'rh'
        'Content-Profile': 'rh'
      }
    }
  });
};

// Função para testar diferentes configurações de cliente
export const testClientConfigurations = async () => {
  console.log('🔧 Testando diferentes configurações de cliente Supabase...');
  
  // Cliente padrão
  const defaultClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  
  // Cliente com headers de schema
  const rhClient = createRHClient();
  
  const tests = [
    {
      name: 'Cliente padrão - employees',
      client: defaultClient,
      query: () => defaultClient.from('employees').select('*').limit(1)
    },
    {
      name: 'Cliente padrão - rh.employees',
      client: defaultClient,
      query: () => (defaultClient as any).from('rh.employees').select('*').limit(1)
    },
    {
      name: 'Cliente RH - employees',
      client: rhClient,
      query: () => rhClient.from('employees').select('*').limit(1)
    },
    {
      name: 'Cliente RH - rh.employees',
      client: rhClient,
      query: () => (rhClient as any).from('rh.employees').select('*').limit(1)
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

// Função para verificar se o schema 'rh' está disponível
export const checkSchemaAvailability = async () => {
  console.log('🔍 Verificando disponibilidade do schema RH...');
  
  const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  
  try {
    // Tentar listar as tabelas do schema 'rh'
    const { data, error } = await (client as any).rpc('list_tables', { schema_name: 'rh' });
    
    if (error) {
      console.log('❌ Erro ao listar tabelas do schema RH:', error);
      
      // Tentar uma abordagem alternativa
      const { data: altData, error: altError } = await (client as any).rpc('get_schema_info');
      
      if (altError) {
        console.log('❌ Erro na abordagem alternativa:', altError);
      } else {
        console.log('✅ Informações do schema:', altData);
      }
    } else {
      console.log('✅ Tabelas disponíveis no schema RH:', data);
    }
  } catch (err) {
    console.log('💥 Exceção ao verificar schema:', err);
  }
};


















































