import { coreSupabase, supabase, rhSupabase } from '@/integrations/supabase/client';

export const testRHSchemaAccess = async () => {
  console.log('🧪 TESTE DE ACESSO AO SCHEMA RH');
  console.log('=====================================');
  
  // Teste 1: Verificar se o cliente está configurado
  console.log('1️⃣ Verificando configuração do cliente...');
  console.log('URL:', supabase.supabaseUrl);
  console.log('Chave:', supabase.supabaseKey ? '✅ Configurada' : '❌ Não configurada');
  
  // Teste 2: Tentar acessar a tabela employees do schema rh
  console.log('\n2️⃣ Testando acesso à tabela rh.employees...');
  try {
    const { data, error } = await rhSupabase
      .from('employees')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro no acesso ao rh.employees:', error);
    } else {
      console.log('✅ Sucesso no acesso ao rh.employees! Dados:', data);
    }
  } catch (err) {
    console.error('❌ Exceção no acesso ao rh.employees:', err);
  }
  
  // Teste 3: Tentar acessar a tabela positions do schema rh
  console.log('\n3️⃣ Testando acesso à tabela rh.positions...');
  try {
    const { data, error } = await rhSupabase
      .from('positions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro no acesso ao rh.positions:', error);
    } else {
      console.log('✅ Sucesso no acesso ao rh.positions! Dados:', data);
    }
  } catch (err) {
    console.error('❌ Exceção no acesso ao rh.positions:', err);
  }
  
  // Teste 4: Verificar se há algum problema com o schema core
  console.log('\n4️⃣ Verificando configuração do schema core...');
  try {
    const { data: coreData, error: coreError } = await coreSupabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (coreError) {
      console.log('ℹ️ Tabela core.users não acessível:', coreError.message);
    } else {
      console.log('✅ Tabela core.users acessível');
    }
  } catch (err) {
    console.error('❌ Erro ao testar tabela core:', err);
  }
  
  // Teste 5: Verificar se o problema é específico do schema rh
  console.log('\n5️⃣ Testando diferentes abordagens para o schema rh...');
  
  // Tentativa com aspas duplas
  try {
    const { data, error } = await supabase
      .from('"rh"."employees"')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('ℹ️ rh."employees" com aspas:', error.message);
    } else {
      console.log('✅ rh."employees" com aspas funcionou!');
    }
  } catch (err) {
    console.log('ℹ️ rh."employees" com aspas falhou:', err);
  }
  
  // Tentativa com schema explícito
  try {
    const { data, error } = await supabase
      .from('rh.employees')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('ℹ️ rh.employees:', error.message);
    } else {
      console.log('✅ rh.employees funcionou!');
    }
  } catch (err) {
    console.log('ℹ️ rh.employees falhou:', err);
  }
  
  console.log('\n=====================================');
  console.log('🧪 TESTE CONCLUÍDO');
};
