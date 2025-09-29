import type { Database } from './types';
import { rhSupabase as rhClient } from './client';

// Cliente RH configurado para usar o schema rh
export { rhClient as rhSupabase };

// Função helper simplificada para acessar tabelas do schema RH
export const rhTable = <T extends keyof Database['rh']['Tables']>(tableName: T) => {
  return rhClient.from(tableName);
};

// Função helper para acessar tabelas do schema Core
export const coreTable = <T extends keyof Database['core']['Tables']>(tableName: T) => {
  return rhClient.from(`core.${tableName}`);
};

// Função helper para acessar qualquer schema
export const schemaTable = (schema: string, tableName: string) => {
  return rhClient.from(`${schema}.${tableName}`);
};
