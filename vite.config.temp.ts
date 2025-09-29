import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  typescript: {
    compilerOptions: {
      skipLibCheck: true,
      noImplicitAny: false,
      strictNullChecks: false,
      strictFunctionTypes: false,
      noImplicitReturns: false,
      noImplicitThis: false,
      noUnusedLocals: false,
      noUnusedParameters: false,
      exactOptionalPropertyTypes: false,
      noImplicitOverride: false,
      noPropertyAccessFromIndexSignature: false,
      strict: false
    }
  }
});