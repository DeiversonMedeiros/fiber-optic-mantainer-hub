# 🔧 Configuração do Supabase - NOVO BANCO

## 📋 Credenciais Atualizadas

### **URL do Projeto**
```
https://nhvlgnmpbihamgvdbmwa.supabase.co
```

### **Chave Anônima (anon key)**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5odmxnbm1wYmloYW1ndmRibXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTQ3NjUsImV4cCI6MjA3MTk5MDc2NX0.NwSwIZ8MPMaJcYJzQz7mofqT2-_pQI8aisgX5HChJN8
```

### **Chave de Serviço (service role key)**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5odmxnbm1wYmloYW1ndmRibXdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQxNDc2NSwiZXhwIjoyMDcxOTkwNzY1fQ.f8IMpicmBIpHFZPXgOLE4ulS8DuAKWVmUfAa6gGMQrQ
```

### **ID do Projeto**
```
nhvlgnmpbihamgvdbmwa
```

### **URL do Banco de Dados**
```
postgresql://postgres:81hbcoNDXaGiPIpp@db.nhvlgnmpbihamgvdbmwa.supabase.co:5432/postgres
```

## ✅ **Arquivos Já Atualizados**

1. ✅ `src/integrations/supabase/client.ts` - Cliente principal
2. ✅ `supabase/config.toml` - Configuração do projeto
3. ✅ `.gitignore` - Proteção de credenciais

## 🔄 **Próximos Passos**

### **1. Criar arquivo .env.local**
Crie um arquivo `.env.local` na raiz do projeto com:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://nhvlgnmpbihamgvdbmwa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5odmxnbm1wYmloYW1ndmRibXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTQ3NjUsImV4cCI6MjA3MTk5MDc2NX0.NwSwIZ8MPMaJcYJzQz7mofqT2-_pQI8aisgX5HChJN8

# Database Connection (for reference)
SUPABASE_DB_URL=postgresql://postgres:81hbcoNDXaGiPIpp@db.nhvlgnmpbihamgvdbmwa.supabase.co:5432/postgres

# Service Role Key (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5odmxnbm1wYmloYW1ndmRibXdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQxNDc2NSwiZXhwIjoyMDcxOTkwNzY1fQ.f8IMpicmBIpHFZPXgOLE4ulS8DuAKWVmUfAa6gGMQrQ
```

### **2. Configurar Variáveis de Ambiente no Supabase Dashboard**
No painel do Supabase, vá em **Settings > API** e configure:

- **Project URL**: `https://nhvlgnmpbihamgvdbmwa.supabase.co`
- **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5odmxnbm1wYmloYW1ndmRibXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MTQ3NjUsImV4cCI6MjA3MTk5MDc2NX0.NwSwIZ8MPMaJcYJzQz7mofqT2-_pQI8aisgX5HChJN8`
- **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5odmxnbm1wYmloYW1ndmRibXdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQxNDc2NSwiZXhwIjoyMDcxOTkwNzY1fQ.f8IMpicmBIpHFZPXgOLE4ulS8DuAKWVmUfAa6gGMQrQ`

### **3. Configurar Edge Functions (se necessário)**
Se estiver usando edge functions, configure as variáveis de ambiente:

- `SUPABASE_URL`: `https://nhvlgnmpbihamgvdbmwa.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5odmxnbm1wYmloYW1ndmRibXdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQxNDc2NSwiZXhwIjoyMDcxOTkwNzY1fQ.f8IMpicmBIpHFZPXgOLE4ulS8DuAKWVmUfAa6gGMQrQ`

## 🧪 **Testando a Conexão**

1. **Reinicie o servidor**: `npm run dev`
2. **Teste o login** no sistema
3. **Verifique se as consultas** ao banco estão funcionando
4. **Teste as funcionalidades** principais

## ⚠️ **Importante**

- ✅ **Nunca commite** o arquivo `.env.local`
- ✅ **Mantenha backup** das credenciais antigas
- ✅ **Teste todas as funcionalidades** após a mudança
- ✅ **Verifique as permissões RLS** no novo banco

## 🆘 **Em Caso de Problemas**

Se encontrar algum erro:
1. Verifique se as credenciais estão corretas
2. Confirme se o banco está acessível
3. Verifique os logs do console do navegador
4. Teste a conexão direta no painel do Supabase


