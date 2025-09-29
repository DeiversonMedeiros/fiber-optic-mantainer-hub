-- =====================================================
-- DADOS DE TESTE PARA SCHEMA RH (CORRIGIDO)
-- =====================================================

-- 1. PRIMEIRO, VAMOS CRIAR UMA EMPRESA DE EXEMPLO NO CORE
INSERT INTO core.companies (id, razao_social, nome_fantasia, cnpj, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Estratégic Engenharia Ltda', 'Estratégic Engenharia', '00.000.000/0001-00', true)
ON CONFLICT (id) DO NOTHING;

-- 2. INSERIR CARGOS DE EXEMPLO
INSERT INTO rh.positions (company_id, codigo, nome, descricao, nivel_hierarquico, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'DEV001', 'Desenvolvedor Full Stack', 'Desenvolvedor responsável por aplicações web completas', 3, true),
('550e8400-e29b-41d4-a716-446655440000', 'GER001', 'Gerente de Projetos', 'Gerencia projetos de desenvolvimento e equipes', 5, true),
('550e8400-e29b-41d4-a716-446655440000', 'ANA001', 'Analista de Sistemas', 'Analisa requisitos e especifica soluções', 2, true),
('550e8400-e29b-41d4-a716-446655440000', 'DES001', 'Designer UX/UI', 'Responsável pelo design de interfaces e experiência do usuário', 2, true),
('550e8400-e29b-41d4-a716-446655440000', 'DIR001', 'Diretor Técnico', 'Direção técnica e estratégica da área de tecnologia', 7, true);

-- 3. INSERIR FUNCIONÁRIOS DE EXEMPLO
INSERT INTO rh.employees (company_id, matricula, nome, cpf, rg, data_nascimento, data_admissao, status) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'EMP001', 'João Silva', '123.456.789-00', '12.345.678-9', '1990-05-15', '2023-01-15', 'ativo'),
('550e8400-e29b-41d4-a716-446655440000', 'EMP002', 'Maria Santos', '987.654.321-00', '98.765.432-1', '1985-08-22', '2022-06-01', 'ativo'),
('550e8400-e29b-41d4-a716-446655440000', 'EMP003', 'Pedro Oliveira', '456.789.123-00', '45.678.912-3', '1992-12-10', '2023-03-20', 'ativo'),
('550e8400-e29b-41d4-a716-446655440000', 'EMP004', 'Ana Costa', '789.123.456-00', '78.912.345-6', '1988-03-05', '2021-11-10', 'ativo'),
('550e8400-e29b-41d4-a716-446655440000', 'EMP005', 'Carlos Ferreira', '321.654.987-00', '32.165.498-7', '1995-07-18', '2023-08-01', 'ativo');

-- 4. INSERIR BENEFÍCIOS DE EXEMPLO (usando enum correto)
INSERT INTO rh.benefits (company_id, nome, tipo, valor, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Vale Refeição', 'VR', 500.00, true),
('550e8400-e29b-41d4-a716-446655440000', 'Vale Transporte', 'transporte', 200.00, true),
('550e8400-e29b-41d4-a716-446655440000', 'Plano de Saúde', 'convenio', 300.00, true),
('550e8400-e29b-41d4-a716-446655440000', 'Gympass', 'outros', 100.00, true),
('550e8400-e29b-41d4-a716-446655440000', 'Participação nos Lucros', 'outros', 10.00, true);

-- 5. INSERIR SINDICATOS DE EXEMPLO
INSERT INTO rh.unions (company_id, nome, cnpj, endereco, contato, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Sindicato dos Trabalhadores em Informática', '12.345.678/0001-90', 'Rua da Tecnologia, 123', 'contato@sindicato-info.org.br', true),
('550e8400-e29b-41d4-a716-446655440000', 'Sindicato dos Engenheiros', '98.765.432/0001-10', 'Av. Engenharia, 456', 'contato@sindicato-eng.org.br', true);

-- 6. INSERIR ESCALAS DE TRABALHO DE EXEMPLO
INSERT INTO rh.work_schedules (company_id, nome, hora_entrada, hora_saida, intervalo_inicio, intervalo_fim, carga_horaria_semanal, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Escala Comercial', '08:00:00', '17:00:00', '12:00:00', '13:00:00', 40, true),
('550e8400-e29b-41d4-a716-446655440000', 'Escala Noturna', '22:00:00', '06:00:00', '02:00:00', '02:30:00', 40, true),
('550e8400-e29b-41d4-a716-446655440000', 'Escala Flexível', '09:00:00', '18:00:00', '12:00:00', '13:00:00', 40, true);

-- 7. INSERIR TURNOS DE TRABALHO DE EXEMPLO
INSERT INTO rh.work_shifts (company_id, nome, hora_inicio, hora_fim, dias_semana, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Turno Manhã', '08:00:00', '16:00:00', '{1,2,3,4,5}', true),
('550e8400-e29b-41d4-a716-446655440000', 'Turno Tarde', '14:00:00', '22:00:00', '{1,2,3,4,5}', true),
('550e8400-e29b-41d4-a716-446655440000', 'Turno Noite', '22:00:00', '06:00:00', '{1,2,3,4,5}', true);

-- 8. INSERIR FOLHA DE PAGAMENTO DE EXEMPLO
INSERT INTO rh.payroll (company_id, competencia, data_processamento, status, total_proventos, total_descontos, total_liquido) VALUES
('550e8400-e29b-41d4-a716-446655440000', '2024-01', '2024-01-31', 'processado', 50000.00, 15000.00, 35000.00),
('550e8400-e29b-41d4-a716-446655440000', '2024-02', '2024-02-29', 'processado', 52000.00, 15600.00, 36400.00);

-- 9. INSERIR FÉRIAS DE EXEMPLO
INSERT INTO rh.vacations (company_id, employee_id, ano, periodo, data_inicio, data_fim, dias_ferias, dias_abono, status) VALUES
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM rh.employees WHERE matricula = 'EMP001' LIMIT 1), 2024, '1º Período', '2024-03-01', '2024-03-15', 15, 3, 'aprovado'),
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM rh.employees WHERE matricula = 'EMP002' LIMIT 1), 2024, '2º Período', '2024-06-01', '2024-06-20', 20, 0, 'solicitado');

-- 10. INSERIR REGISTROS DE PONTO DE EXEMPLO
INSERT INTO rh.time_records (company_id, employee_id, data, hora_entrada, hora_saida, intervalo_inicio, intervalo_fim, tipo) VALUES
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM rh.employees WHERE matricula = 'EMP001' LIMIT 1), '2024-01-15', '08:00:00', '17:00:00', '12:00:00', '13:00:00', 'normal'),
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM rh.employees WHERE matricula = 'EMP002' LIMIT 1), '2024-01-15', '08:15:00', '17:15:00', '12:00:00', '13:00:00', 'normal'),
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM rh.employees WHERE matricula = 'EMP003' LIMIT 1), '2024-01-15', '08:30:00', '17:30:00', '12:00:00', '13:00:00', 'normal');

-- 11. INSERIR BANCO DE HORAS DE EXEMPLO
INSERT INTO rh.time_bank (company_id, employee_id, tipo, quantidade, data_registro, justificativa, status) VALUES
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM rh.employees WHERE matricula = 'EMP001' LIMIT 1), 'credito', 2.0, '2024-01-15', 'Hora extra trabalhada', 'aprovado'),
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM rh.employees WHERE matricula = 'EMP002' LIMIT 1), 'debito', 1.5, '2024-01-16', 'Saída antecipada', 'pendente');

-- 12. INSERIR EXAMES PERIÓDICOS DE EXEMPLO
INSERT INTO rh.periodic_exams (company_id, employee_id, tipo_exame, data_agendada, data_realizacao, resultado, status) VALUES
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM rh.employees WHERE matricula = 'EMP001' LIMIT 1), 'Admissional', '2023-01-10', '2023-01-10', 'Apto', 'processado'),
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM rh.employees WHERE matricula = 'EMP002' LIMIT 1), 'Periódico', '2024-01-20', NULL, NULL, 'agendado');

-- 13. INSERIR ATESTADOS MÉDICOS DE EXEMPLO
INSERT INTO rh.medical_certificates (company_id, employee_id, data_inicio, data_fim, dias_afastamento, cid, tipo) VALUES
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM rh.employees WHERE matricula = 'EMP003' LIMIT 1), '2024-01-10', '2024-01-12', 3, 'J06.9', 'Incapacidade temporária'),
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM rh.employees WHERE matricula = 'EMP004' LIMIT 1), '2024-01-15', '2024-01-17', 3, 'M79.3', 'Paniculite');

-- 14. INSERIR EVENTOS E-SOCIAL DE EXEMPLO
INSERT INTO rh.esocial_events (company_id, tipo_evento, numero_recibo, status, data_envio) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'S-1000', 'REC001', 'processado', '2024-01-01 10:00:00'),
('550e8400-e29b-41d4-a716-446655440000', 'S-1005', 'REC002', 'pendente', NULL);

-- 15. INSERIR CONFIGURAÇÕES DE FOLHA DE EXEMPLO
INSERT INTO rh.payroll_config (company_id, employee_id, regime_hora_extra, vigencia_banco_horas) VALUES
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM rh.employees WHERE matricula = 'EMP001' LIMIT 1), 'pagamento_mensal', 12),
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM rh.employees WHERE matricula = 'EMP002' LIMIT 1), 'banco_horas', 6);

-- 16. INSERIR ITENS DE FOLHA DE EXEMPLO
INSERT INTO rh.payroll_items (company_id, payroll_id, employee_id, tipo, codigo, descricao, valor, base_calculo) VALUES
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM rh.payroll WHERE competencia = '2024-01' LIMIT 1), (SELECT id FROM rh.employees WHERE matricula = 'EMP001' LIMIT 1), 'provento', 'SAL', 'Salário Base', 5000.00, 5000.00),
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM rh.payroll WHERE competencia = '2024-01' LIMIT 1), (SELECT id FROM rh.employees WHERE matricula = 'EMP001' LIMIT 1), 'desconto', 'INSS', 'INSS', 500.00, 5000.00);

-- 17. INSERIR BENEFÍCIOS DE FUNCIONÁRIOS DE EXEMPLO
INSERT INTO rh.employee_benefits (company_id, employee_id, benefit_id, valor_beneficio, data_inicio, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM rh.employees WHERE matricula = 'EMP001' LIMIT 1), (SELECT id FROM rh.benefits WHERE nome = 'Vale Refeição' LIMIT 1), 500.00, '2023-01-15', true),
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM rh.employees WHERE matricula = 'EMP002' LIMIT 1), (SELECT id FROM rh.benefits WHERE nome = 'Plano de Saúde' LIMIT 1), 300.00, '2022-06-01', true);

-- 18. INSERIR TURNOS DE FUNCIONÁRIOS DE EXEMPLO
INSERT INTO rh.employee_shifts (company_id, employee_id, shift_id, data_inicio, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM rh.employees WHERE matricula = 'EMP001' LIMIT 1), (SELECT id FROM rh.work_shifts WHERE nome = 'Turno Manhã' LIMIT 1), '2023-01-15', true),
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM rh.employees WHERE matricula = 'EMP002' LIMIT 1), (SELECT id FROM rh.work_shifts WHERE nome = 'Turno Tarde' LIMIT 1), '2022-06-01', true);

-- 19. INSERIR SOLICITAÇÕES DE COMPENSAÇÃO DE EXEMPLO
INSERT INTO rh.compensation_requests (company_id, employee_id, data_solicitacao, data_compensacao, quantidade_horas, justificativa, status) VALUES
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM rh.employees WHERE matricula = 'EMP001' LIMIT 1), '2024-01-15', '2024-01-20', 8.0, 'Compensar horas extras trabalhadas', 'pendente'),
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM rh.employees WHERE matricula = 'EMP002' LIMIT 1), '2024-01-16', '2024-01-22', 4.0, 'Folga para consulta médica', 'aprovado');






















































































