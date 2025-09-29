-- =====================================================
-- FASE 5: INTEGRAÇÃO BANCÁRIA AVANÇADA - BRADESCO
-- =====================================================

-- 1. Tabela de configuração da integração Bradesco
CREATE TABLE financeiro.bradesco_integration_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES core.companies(id),
  
  -- Credenciais API
  client_id VARCHAR(255) NOT NULL,
  client_secret VARCHAR(255) NOT NULL,
  certificate_path TEXT NOT NULL,
  certificate_password VARCHAR(255),
  
  -- Configurações de ambiente
  environment VARCHAR(20) DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  api_base_url VARCHAR(255) NOT NULL,
  api_version VARCHAR(10) DEFAULT 'v1',
  
  -- Configurações de conta
  bank_code VARCHAR(10) DEFAULT '237', -- Código do Bradesco
  bank_name VARCHAR(100) DEFAULT 'Banco Bradesco S.A.',
  agency_number VARCHAR(10) NOT NULL,
  account_number VARCHAR(20) NOT NULL,
  account_digit VARCHAR(2) NOT NULL,
  account_type VARCHAR(20) DEFAULT 'checking' CHECK (account_type IN ('checking', 'savings', 'business')),
  
  -- Configurações de CNAB
  cnab_layout VARCHAR(10) DEFAULT '240' CHECK (cnab_layout IN ('240', '400')),
  cnab_remessa_path TEXT NOT NULL,
  cnab_retorno_path TEXT NOT NULL,
  cnab_sequence VARCHAR(20) DEFAULT '000001',
  
  -- Configurações de segurança
  encryption_key VARCHAR(255),
  webhook_url TEXT,
  webhook_secret VARCHAR(255),
  
  -- Configurações de notificação
  notify_success BOOLEAN DEFAULT true,
  notify_errors BOOLEAN DEFAULT true,
  notification_emails TEXT[],
  
  -- Status e controle
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  error_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de tokens de autenticação
CREATE TABLE financeiro.bradesco_auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES core.companies(id),
  config_id UUID NOT NULL REFERENCES financeiro.bradesco_integration_config(id),
  
  -- Dados do token
  access_token TEXT NOT NULL,
  token_type VARCHAR(50) DEFAULT 'Bearer',
  expires_in INTEGER NOT NULL,
  scope TEXT,
  
  -- Controle de validade
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_valid BOOLEAN DEFAULT true,
  
  -- Dados de renovação
  refresh_token TEXT,
  refresh_expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de transações bancárias
CREATE TABLE financeiro.bradesco_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES core.companies(id),
  config_id UUID NOT NULL REFERENCES financeiro.bradesco_integration_config(id),
  
  -- Dados da transação
  transaction_id VARCHAR(100) NOT NULL,
  external_id VARCHAR(100),
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('transfer', 'pix', 'payment', 'deposit', 'withdrawal')),
  
  -- Dados financeiros
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  description TEXT,
  
  -- Dados de origem/destino
  from_account VARCHAR(50),
  to_account VARCHAR(50),
  to_name VARCHAR(255),
  to_document VARCHAR(20),
  to_bank_code VARCHAR(10),
  to_agency VARCHAR(10),
  to_account_number VARCHAR(20),
  
  -- Dados de PIX
  pix_key VARCHAR(255),
  pix_key_type VARCHAR(20) CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
  
  -- Status e controle
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  status_message TEXT,
  
  -- Dados de processamento
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  
  -- Dados de retorno
  bank_response JSONB,
  error_code VARCHAR(50),
  error_message TEXT,
  
  -- Dados de conciliação
  reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMP WITH TIME ZONE,
  reconciliation_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de extratos bancários
CREATE TABLE financeiro.bradesco_bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES core.companies(id),
  config_id UUID NOT NULL REFERENCES financeiro.bradesco_integration_config(id),
  
  -- Dados do extrato
  statement_date DATE NOT NULL,
  opening_balance DECIMAL(15,2) NOT NULL,
  closing_balance DECIMAL(15,2) NOT NULL,
  total_credits DECIMAL(15,2) DEFAULT 0,
  total_debits DECIMAL(15,2) DEFAULT 0,
  
  -- Dados de sincronização
  sync_type VARCHAR(20) DEFAULT 'api' CHECK (sync_type IN ('api', 'cnab', 'manual')),
  sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'processing', 'completed', 'failed')),
  sync_started_at TIMESTAMP WITH TIME ZONE,
  sync_completed_at TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  
  -- Dados do arquivo (se CNAB)
  file_name VARCHAR(255),
  file_path TEXT,
  file_size INTEGER,
  
  -- Controle
  is_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de movimentações do extrato
CREATE TABLE financeiro.bradesco_statement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES core.companies(id),
  statement_id UUID NOT NULL REFERENCES financeiro.bradesco_bank_statements(id),
  
  -- Dados da movimentação
  transaction_date DATE NOT NULL,
  value_date DATE,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  balance DECIMAL(15,2) NOT NULL,
  
  -- Dados bancários
  bank_code VARCHAR(10),
  agency VARCHAR(10),
  account VARCHAR(20),
  check_number VARCHAR(20),
  document_number VARCHAR(50),
  
  -- Dados de conciliação
  transaction_type VARCHAR(50),
  category VARCHAR(50),
  subcategory VARCHAR(50),
  
  -- Status de conciliação
  reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMP WITH TIME ZONE,
  reconciliation_notes TEXT,
  
  -- Referências
  external_id VARCHAR(100),
  reference_id UUID,
  reference_type VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de lotes de pagamento
CREATE TABLE financeiro.bradesco_payment_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES core.companies(id),
  config_id UUID NOT NULL REFERENCES financeiro.bradesco_integration_config(id),
  
  -- Dados do lote
  batch_number VARCHAR(50) NOT NULL,
  batch_type VARCHAR(50) NOT NULL CHECK (batch_type IN ('salary', 'supplier', 'tax', 'mixed')),
  description TEXT NOT NULL,
  
  -- Dados financeiros
  total_amount DECIMAL(15,2) NOT NULL,
  total_transactions INTEGER NOT NULL,
  processed_amount DECIMAL(15,2) DEFAULT 0,
  processed_transactions INTEGER DEFAULT 0,
  
  -- Status e controle
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  status_message TEXT,
  
  -- Dados de processamento
  submitted_at TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  
  -- Dados de retorno
  bank_batch_id VARCHAR(100),
  bank_response JSONB,
  error_code VARCHAR(50),
  error_message TEXT,
  
  -- Dados de arquivo
  cnab_file_path TEXT,
  cnab_file_name VARCHAR(255),
  return_file_path TEXT,
  return_file_name VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabela de itens do lote de pagamento
CREATE TABLE financeiro.bradesco_payment_batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES core.companies(id),
  batch_id UUID NOT NULL REFERENCES financeiro.bradesco_payment_batches(id),
  transaction_id UUID REFERENCES financeiro.bradesco_transactions(id),
  
  -- Dados do pagamento
  payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('transfer', 'pix', 'ted', 'doc')),
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  
  -- Dados do beneficiário
  beneficiary_name VARCHAR(255) NOT NULL,
  beneficiary_document VARCHAR(20) NOT NULL,
  beneficiary_bank_code VARCHAR(10),
  beneficiary_agency VARCHAR(10),
  beneficiary_account VARCHAR(20),
  beneficiary_account_digit VARCHAR(2),
  
  -- Dados de PIX
  pix_key VARCHAR(255),
  pix_key_type VARCHAR(20),
  
  -- Status e controle
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  status_message TEXT,
  
  -- Dados de processamento
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  
  -- Dados de retorno
  bank_transaction_id VARCHAR(100),
  bank_response JSONB,
  error_code VARCHAR(50),
  error_message TEXT,
  
  -- Dados de conciliação
  reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabela de logs de integração
CREATE TABLE financeiro.bradesco_integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES core.companies(id),
  config_id UUID REFERENCES financeiro.bradesco_integration_config(id),
  
  -- Dados do log
  log_level VARCHAR(20) NOT NULL CHECK (log_level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  log_type VARCHAR(50) NOT NULL CHECK (log_type IN ('auth', 'api', 'cnab', 'webhook', 'sync', 'payment', 'error')),
  message TEXT NOT NULL,
  
  -- Dados da requisição
  request_id VARCHAR(100),
  endpoint VARCHAR(255),
  method VARCHAR(10),
  request_data JSONB,
  response_data JSONB,
  
  -- Dados de erro
  error_code VARCHAR(50),
  error_message TEXT,
  stack_trace TEXT,
  
  -- Dados de contexto
  user_id UUID REFERENCES core.users(id),
  session_id VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  
  -- Dados de tempo
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Tabela de webhooks
CREATE TABLE financeiro.bradesco_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES core.companies(id),
  config_id UUID NOT NULL REFERENCES financeiro.bradesco_integration_config(id),
  
  -- Dados do webhook
  webhook_id VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  
  -- Status e controle
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  
  -- Dados de erro
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Dados de assinatura
  signature VARCHAR(255),
  signature_valid BOOLEAN,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Índices para bradesco_integration_config
CREATE INDEX idx_bradesco_integration_config_company ON financeiro.bradesco_integration_config(company_id);
CREATE INDEX idx_bradesco_integration_config_active ON financeiro.bradesco_integration_config(company_id, is_active) WHERE is_active = true;

-- Índices para bradesco_auth_tokens
CREATE INDEX idx_bradesco_auth_tokens_company ON financeiro.bradesco_auth_tokens(company_id);
CREATE INDEX idx_bradesco_auth_tokens_config ON financeiro.bradesco_auth_tokens(config_id);
CREATE INDEX idx_bradesco_auth_tokens_valid ON financeiro.bradesco_auth_tokens(company_id, is_valid, expires_at) WHERE is_valid = true;

-- Índices para bradesco_transactions
CREATE INDEX idx_bradesco_transactions_company ON financeiro.bradesco_transactions(company_id);
CREATE INDEX idx_bradesco_transactions_config ON financeiro.bradesco_transactions(config_id);
CREATE INDEX idx_bradesco_transactions_type ON financeiro.bradesco_transactions(company_id, transaction_type);
CREATE INDEX idx_bradesco_transactions_status ON financeiro.bradesco_transactions(company_id, status);
CREATE INDEX idx_bradesco_transactions_date ON financeiro.bradesco_transactions(created_at);
CREATE INDEX idx_bradesco_transactions_external ON financeiro.bradesco_transactions(external_id);

-- Índices para bradesco_bank_statements
CREATE INDEX idx_bradesco_bank_statements_company ON financeiro.bradesco_bank_statements(company_id);
CREATE INDEX idx_bradesco_bank_statements_config ON financeiro.bradesco_bank_statements(config_id);
CREATE INDEX idx_bradesco_bank_statements_date ON financeiro.bradesco_bank_statements(statement_date);
CREATE INDEX idx_bradesco_bank_statements_status ON financeiro.bradesco_bank_statements(company_id, sync_status);

-- Índices para bradesco_statement_items
CREATE INDEX idx_bradesco_statement_items_statement ON financeiro.bradesco_statement_items(statement_id);
CREATE INDEX idx_bradesco_statement_items_company ON financeiro.bradesco_statement_items(company_id);
CREATE INDEX idx_bradesco_statement_items_date ON financeiro.bradesco_statement_items(transaction_date);
CREATE INDEX idx_bradesco_statement_items_reconciled ON financeiro.bradesco_statement_items(company_id, reconciled);

-- Índices para bradesco_payment_batches
CREATE INDEX idx_bradesco_payment_batches_company ON financeiro.bradesco_payment_batches(company_id);
CREATE INDEX idx_bradesco_payment_batches_config ON financeiro.bradesco_payment_batches(config_id);
CREATE INDEX idx_bradesco_payment_batches_status ON financeiro.bradesco_payment_batches(company_id, status);
CREATE INDEX idx_bradesco_payment_batches_date ON financeiro.bradesco_payment_batches(created_at);

-- Índices para bradesco_payment_batch_items
CREATE INDEX idx_bradesco_payment_batch_items_batch ON financeiro.bradesco_payment_batch_items(batch_id);
CREATE INDEX idx_bradesco_payment_batch_items_company ON financeiro.bradesco_payment_batch_items(company_id);
CREATE INDEX idx_bradesco_payment_batch_items_status ON financeiro.bradesco_payment_batch_items(company_id, status);
CREATE INDEX idx_bradesco_payment_batch_items_transaction ON financeiro.bradesco_payment_batch_items(transaction_id);

-- Índices para bradesco_integration_logs
CREATE INDEX idx_bradesco_integration_logs_company ON financeiro.bradesco_integration_logs(company_id);
CREATE INDEX idx_bradesco_integration_logs_config ON financeiro.bradesco_integration_logs(config_id);
CREATE INDEX idx_bradesco_integration_logs_level ON financeiro.bradesco_integration_logs(company_id, log_level);
CREATE INDEX idx_bradesco_integration_logs_type ON financeiro.bradesco_integration_logs(company_id, log_type);
CREATE INDEX idx_bradesco_integration_logs_date ON financeiro.bradesco_integration_logs(created_at);

-- Índices para bradesco_webhooks
CREATE INDEX idx_bradesco_webhooks_company ON financeiro.bradesco_webhooks(company_id);
CREATE INDEX idx_bradesco_webhooks_config ON financeiro.bradesco_webhooks(config_id);
CREATE INDEX idx_bradesco_webhooks_status ON financeiro.bradesco_webhooks(company_id, status);
CREATE INDEX idx_bradesco_webhooks_type ON financeiro.bradesco_webhooks(company_id, event_type);
CREATE INDEX idx_bradesco_webhooks_date ON financeiro.bradesco_webhooks(created_at);

-- =====================================================
-- RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS
ALTER TABLE financeiro.bradesco_integration_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro.bradesco_auth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro.bradesco_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro.bradesco_bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro.bradesco_statement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro.bradesco_payment_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro.bradesco_payment_batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro.bradesco_integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro.bradesco_webhooks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para bradesco_integration_config
CREATE POLICY "Users can view Bradesco config for their company" ON financeiro.bradesco_integration_config
  FOR SELECT USING (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert Bradesco config for their company" ON financeiro.bradesco_integration_config
  FOR INSERT WITH CHECK (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update Bradesco config for their company" ON financeiro.bradesco_integration_config
  FOR UPDATE USING (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

-- Políticas RLS para bradesco_auth_tokens
CREATE POLICY "Users can view Bradesco tokens for their company" ON financeiro.bradesco_auth_tokens
  FOR SELECT USING (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert Bradesco tokens for their company" ON financeiro.bradesco_auth_tokens
  FOR INSERT WITH CHECK (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update Bradesco tokens for their company" ON financeiro.bradesco_auth_tokens
  FOR UPDATE USING (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

-- Políticas RLS para bradesco_transactions
CREATE POLICY "Users can view Bradesco transactions for their company" ON financeiro.bradesco_transactions
  FOR SELECT USING (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert Bradesco transactions for their company" ON financeiro.bradesco_transactions
  FOR INSERT WITH CHECK (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update Bradesco transactions for their company" ON financeiro.bradesco_transactions
  FOR UPDATE USING (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

-- Políticas RLS para bradesco_bank_statements
CREATE POLICY "Users can view Bradesco statements for their company" ON financeiro.bradesco_bank_statements
  FOR SELECT USING (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert Bradesco statements for their company" ON financeiro.bradesco_bank_statements
  FOR INSERT WITH CHECK (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update Bradesco statements for their company" ON financeiro.bradesco_bank_statements
  FOR UPDATE USING (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

-- Políticas RLS para bradesco_statement_items
CREATE POLICY "Users can view Bradesco statement items for their company" ON financeiro.bradesco_statement_items
  FOR SELECT USING (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert Bradesco statement items for their company" ON financeiro.bradesco_statement_items
  FOR INSERT WITH CHECK (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update Bradesco statement items for their company" ON financeiro.bradesco_statement_items
  FOR UPDATE USING (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

-- Políticas RLS para bradesco_payment_batches
CREATE POLICY "Users can view Bradesco payment batches for their company" ON financeiro.bradesco_payment_batches
  FOR SELECT USING (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert Bradesco payment batches for their company" ON financeiro.bradesco_payment_batches
  FOR INSERT WITH CHECK (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update Bradesco payment batches for their company" ON financeiro.bradesco_payment_batches
  FOR UPDATE USING (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

-- Políticas RLS para bradesco_payment_batch_items
CREATE POLICY "Users can view Bradesco payment batch items for their company" ON financeiro.bradesco_payment_batch_items
  FOR SELECT USING (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert Bradesco payment batch items for their company" ON financeiro.bradesco_payment_batch_items
  FOR INSERT WITH CHECK (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update Bradesco payment batch items for their company" ON financeiro.bradesco_payment_batch_items
  FOR UPDATE USING (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

-- Políticas RLS para bradesco_integration_logs
CREATE POLICY "Users can view Bradesco logs for their company" ON financeiro.bradesco_integration_logs
  FOR SELECT USING (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert Bradesco logs for their company" ON financeiro.bradesco_integration_logs
  FOR INSERT WITH CHECK (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

-- Políticas RLS para bradesco_webhooks
CREATE POLICY "Users can view Bradesco webhooks for their company" ON financeiro.bradesco_webhooks
  FOR SELECT USING (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert Bradesco webhooks for their company" ON financeiro.bradesco_webhooks
  FOR INSERT WITH CHECK (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update Bradesco webhooks for their company" ON financeiro.bradesco_webhooks
  FOR UPDATE USING (company_id IN (
    SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
  ));

-- =====================================================
-- TRIGGERS DE AUDITORIA
-- =====================================================

-- Triggers para auditoria
CREATE TRIGGER audit_bradesco_integration_config
  AFTER INSERT OR DELETE OR UPDATE ON financeiro.bradesco_integration_config
  FOR EACH ROW EXECUTE FUNCTION core.audit_trigger_function();

CREATE TRIGGER audit_bradesco_auth_tokens
  AFTER INSERT OR DELETE OR UPDATE ON financeiro.bradesco_auth_tokens
  FOR EACH ROW EXECUTE FUNCTION core.audit_trigger_function();

CREATE TRIGGER audit_bradesco_transactions
  AFTER INSERT OR DELETE OR UPDATE ON financeiro.bradesco_transactions
  FOR EACH ROW EXECUTE FUNCTION core.audit_trigger_function();

CREATE TRIGGER audit_bradesco_bank_statements
  AFTER INSERT OR DELETE OR UPDATE ON financeiro.bradesco_bank_statements
  FOR EACH ROW EXECUTE FUNCTION core.audit_trigger_function();

CREATE TRIGGER audit_bradesco_statement_items
  AFTER INSERT OR DELETE OR UPDATE ON financeiro.bradesco_statement_items
  FOR EACH ROW EXECUTE FUNCTION core.audit_trigger_function();

CREATE TRIGGER audit_bradesco_payment_batches
  AFTER INSERT OR DELETE OR UPDATE ON financeiro.bradesco_payment_batches
  FOR EACH ROW EXECUTE FUNCTION core.audit_trigger_function();

CREATE TRIGGER audit_bradesco_payment_batch_items
  AFTER INSERT OR DELETE OR UPDATE ON financeiro.bradesco_payment_batch_items
  FOR EACH ROW EXECUTE FUNCTION core.audit_trigger_function();

CREATE TRIGGER audit_bradesco_integration_logs
  AFTER INSERT OR DELETE OR UPDATE ON financeiro.bradesco_integration_logs
  FOR EACH ROW EXECUTE FUNCTION core.audit_trigger_function();

CREATE TRIGGER audit_bradesco_webhooks
  AFTER INSERT OR DELETE OR UPDATE ON financeiro.bradesco_webhooks
  FOR EACH ROW EXECUTE FUNCTION core.audit_trigger_function();

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE financeiro.bradesco_integration_config IS 'Configurações de integração com o Banco Bradesco';
COMMENT ON TABLE financeiro.bradesco_auth_tokens IS 'Tokens de autenticação da API do Bradesco';
COMMENT ON TABLE financeiro.bradesco_transactions IS 'Transações bancárias do Bradesco';
COMMENT ON TABLE financeiro.bradesco_bank_statements IS 'Extratos bancários do Bradesco';
COMMENT ON TABLE financeiro.bradesco_statement_items IS 'Itens de movimentação dos extratos';
COMMENT ON TABLE financeiro.bradesco_payment_batches IS 'Lotes de pagamento do Bradesco';
COMMENT ON TABLE financeiro.bradesco_payment_batch_items IS 'Itens dos lotes de pagamento';
COMMENT ON TABLE financeiro.bradesco_integration_logs IS 'Logs de integração com o Bradesco';
COMMENT ON TABLE financeiro.bradesco_webhooks IS 'Webhooks recebidos do Bradesco';
