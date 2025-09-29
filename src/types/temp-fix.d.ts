// Temporary type fixes to resolve build errors

declare module 'react-dropzone' {
  export function useDropzone(options?: any): any;
}

declare global {
  interface Window {
    // Add any global window properties if needed
  }
}

// Temporary type overrides
namespace SupabaseTemp {
  interface Client {
    from(table: string): any;
    rpc(fn: string, params?: any): any;
    schema(schema: string): any;
  }
}

// Type assertion helpers
type AnySupabaseClient = any;
type AnyDatabaseRow = any;

export {};