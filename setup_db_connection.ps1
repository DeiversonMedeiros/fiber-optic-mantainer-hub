# Script para configurar acesso ao banco de dados Supabase
# Execute este script sempre que abrir uma nova sessão do Cursor

# Configurar variável de ambiente para senha
$env:PGPASSWORD = "81hbcoNDXaGiPIpp!"

# Configurar string de conexão
$env:DATABASE_URL = "postgresql://postgres:81hbcoNDXaGiPIpp!@db.nhvlgnmpbihamgvdbmwa.supabase.co:5432/postgres"

Write-Host "✅ Acesso ao banco de dados configurado!" -ForegroundColor Green
Write-Host "Agora você pode usar comandos psql sem digitar senha" -ForegroundColor Yellow

# Testar conexão
Write-Host "`n🔍 Testando conexão..." -ForegroundColor Cyan
psql "postgresql://postgres@db.nhvlgnmpbihamgvdbmwa.supabase.co:5432/postgres" -c "SELECT 'Conexão OK!' as status;"
