SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: absence_types; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."absence_types" ("id", "codigo", "descricao", "categoria", "is_paid", "requires_medical_certificate", "requires_approval", "max_days", "is_active", "company_id", "created_at", "updated_at", "created_by", "updated_by") VALUES
	('eb2bb2ec-90cb-42c5-b4dc-6cc642b52ac3', 'FERIAS', 'Férias anuais', 'FERIAS', true, false, true, 30, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:35:16.001971+00', '2025-09-09 13:35:16.001971+00', NULL, NULL),
	('2c048dbd-0a31-4d95-9abe-ac82efee97bf', 'FERIAS_1_3', 'Férias 1/3', 'FERIAS', true, false, true, 10, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:35:16.001971+00', '2025-09-09 13:35:16.001971+00', NULL, NULL),
	('86f4d8c4-de3a-4009-8578-6d72ed8a56ab', 'LIC_MEDICA', 'Licença médica', 'LICENCA_MEDICA', true, true, true, 120, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:35:16.001971+00', '2025-09-09 13:35:16.001971+00', NULL, NULL),
	('255b24e6-6104-4efe-a851-1b927ae8a007', 'ACIDE_TRAB', 'Acidente de trabalho', 'LICENCA_MEDICA', true, true, true, 365, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:35:16.001971+00', '2025-09-09 13:35:16.001971+00', NULL, NULL),
	('a56b0274-8f2b-4994-8d50-23d97bde7342', 'DOENC_OCUP', 'Doença ocupacional', 'LICENCA_MEDICA', true, true, true, 365, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:35:16.001971+00', '2025-09-09 13:35:16.001971+00', NULL, NULL),
	('5d4e9639-8241-4f9b-94ce-be3c79551622', 'LIC_MATERN', 'Licença maternidade', 'LICENCA_MATERNIDADE', true, true, true, 120, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:35:16.001971+00', '2025-09-09 13:35:16.001971+00', NULL, NULL),
	('790936ef-3115-41eb-9f8a-005657f58e65', 'LIC_PATERN', 'Licença paternidade', 'LICENCA_PATERNIDADE', true, false, true, 20, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:35:16.001971+00', '2025-09-09 13:35:16.001971+00', NULL, NULL),
	('122414d2-d190-4f0d-81f2-75b0b4d49642', 'LIC_LUTO', 'Licença por luto', 'LICENCA_SEM_VENCIMENTO', true, false, true, 8, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:35:16.001971+00', '2025-09-09 13:35:16.001971+00', NULL, NULL),
	('2a6f9ff1-587b-465a-ad18-8a6deb1d2ea8', 'LIC_SEM_VC', 'Licença sem vencimento', 'LICENCA_SEM_VENCIMENTO', false, false, true, 90, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:35:16.001971+00', '2025-09-09 13:35:16.001971+00', NULL, NULL),
	('9210ff9f-51fc-41fd-a303-a80d4b1bea45', 'SUSPENSAO', 'Suspensão disciplinar', 'AFASTAMENTO', false, false, true, 30, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:35:16.001971+00', '2025-09-09 13:35:16.001971+00', NULL, NULL);


--
-- Data for Name: allowance_types; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."allowance_types" ("id", "codigo", "descricao", "tipo", "valor", "unidade", "base_calculo", "is_cumulative", "requires_approval", "is_active", "company_id", "created_at", "updated_at", "created_by", "updated_by") VALUES
	('3eb3394a-9981-460a-b336-174160d447a8', 'PERICULOS', 'Adicional de periculosidade', 'PERCENTUAL', 30.0000, 'PERCENTUAL', 'SALARIO_BASE', false, true, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:35:16.001971+00', '2025-09-09 13:35:16.001971+00', NULL, NULL),
	('00eb2fe5-f1c6-4771-be86-c15f6501ed10', 'INSALUBRID', 'Adicional de insalubridade', 'PERCENTUAL', 20.0000, 'PERCENTUAL', 'SALARIO_BASE', false, true, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:35:16.001971+00', '2025-09-09 13:35:16.001971+00', NULL, NULL),
	('b30b60e8-ff88-4dda-92aa-c44bb57dfe3c', 'NOTURNO', 'Adicional noturno', 'PERCENTUAL', 20.0000, 'PERCENTUAL', 'SALARIO_BASE', true, false, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:35:16.001971+00', '2025-09-09 13:35:16.001971+00', NULL, NULL),
	('6a735abd-651e-4482-9dcb-fef14e333741', 'SOBREAVISO', 'Adicional de sobreaviso', 'PERCENTUAL', 33.3333, 'PERCENTUAL', 'SALARIO_BASE', true, false, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:35:16.001971+00', '2025-09-09 13:35:16.001971+00', NULL, NULL),
	('315b8ec7-1932-4645-85f8-5826e7683748', 'HORA_EXTRA', 'Hora extra', 'PERCENTUAL', 50.0000, 'PERCENTUAL', 'SALARIO_BASE', true, false, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:35:16.001971+00', '2025-09-09 13:35:16.001971+00', NULL, NULL),
	('9b6dbf4c-4c54-4d54-bc01-0a0a10e18cf2', 'FUNCAO', 'Adicional de função', 'PERCENTUAL', 10.0000, 'PERCENTUAL', 'SALARIO_BASE', true, true, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:35:16.001971+00', '2025-09-09 13:35:16.001971+00', NULL, NULL),
	('ff031f43-cb53-49a9-8caa-dfc14d735531', 'GRATIFICA', 'Gratificação', 'VALOR_FIXO', 500.0000, 'REAIS', 'SALARIO_BASE', true, true, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:35:16.001971+00', '2025-09-09 13:35:16.001971+00', NULL, NULL),
	('6e5c71e5-3803-4f93-9702-d7906092e09d', 'LOCALIZA', 'Adicional de localização', 'VALOR_FIXO', 200.0000, 'REAIS', 'SALARIO_BASE', true, true, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:35:16.001971+00', '2025-09-09 13:35:16.001971+00', NULL, NULL),
	('10f1f901-43ed-4ab7-ab6a-f7da68950fbb', 'TRANSPORTE', 'Adicional de transporte', 'VALOR_FIXO', 100.0000, 'REAIS', 'SALARIO_BASE', true, false, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:35:16.001971+00', '2025-09-09 13:35:16.001971+00', NULL, NULL),
	('c3243402-1ae0-41d7-a3e9-c76d8f768cde', 'PRODUTIVID', 'Adicional de produtividade', 'PERCENTUAL', 15.0000, 'PERCENTUAL', 'SALARIO_TOTAL', true, true, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:35:16.001971+00', '2025-09-09 13:35:16.001971+00', NULL, NULL),
	('c3ef1db5-2762-4d58-8a3a-c0b0ca26cef0', 'COMISSAO', 'Comissão', 'PERCENTUAL', 5.0000, 'PERCENTUAL', 'SALARIO_TOTAL', true, false, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:35:16.001971+00', '2025-09-09 13:35:16.001971+00', NULL, NULL);


--
-- Data for Name: analytics_cache; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: positions; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."positions" ("id", "company_id", "codigo", "nome", "descricao", "nivel_hierarquico", "is_active", "created_at") VALUES
	('506c1630-90e3-4fea-b39b-16f6f0784294', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'DEV001', 'Desenvolvedor Full Stack', 'Desenvolvedor responsável por aplicações web completas', 3, true, '2025-09-03 11:38:41.647577+00'),
	('5cd95834-1a44-4fdc-9810-241f868c40f1', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'GER001', 'Gerente de Projetos', 'Gerencia projetos de desenvolvimento e equipes', 5, true, '2025-09-03 11:38:41.647577+00'),
	('1fda544a-d1cf-4e63-83f6-c98abe6a50a2', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'ANA001', 'Analista de Sistemas', 'Analisa requisitos e especifica soluções', 2, true, '2025-09-03 11:38:41.647577+00'),
	('1a005761-9c36-46af-ae0e-39463626217a', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'DES001', 'Designer UX/UI', 'Responsável pelo design de interfaces e experiência do usuário', 2, true, '2025-09-03 11:38:41.647577+00'),
	('c0a42923-65ce-4c7b-9c6f-53ae91967649', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'DIR001', 'Diretor Técnico', 'Direção técnica e estratégica da área de tecnologia', 7, true, '2025-09-03 11:38:41.647577+00');


--
-- Data for Name: employees; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."employees" ("id", "company_id", "matricula", "nome", "cpf", "rg", "data_nascimento", "data_admissao", "data_demissao", "status", "cost_center_id", "project_id", "created_at", "position_id", "work_schedule_id", "department_id", "manager_id", "salario_base", "telefone", "email", "estado_civil", "nacionalidade", "naturalidade", "nome_mae", "nome_pai", "precisa_registrar_ponto", "tipo_banco_horas", "is_pcd", "deficiency_type", "deficiency_degree", "periculosidade", "insalubridade") VALUES
	('fc0ba118-76d7-4dc0-8574-dc43ea6934c5', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'TESTE001', 'Funcionário Teste Locação', '12345678901', NULL, '1990-01-01', '2025-09-11', NULL, 'ativo', NULL, NULL, '2025-09-11 23:17:00.522464+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Brasileira', NULL, NULL, NULL, true, 'compensatorio', false, NULL, NULL, false, false),
	('25594519-67fe-412e-97fd-9ababe0849f0', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '010001', 'Jo?o Silva Teste', '98765432100', NULL, NULL, '2025-09-25', NULL, 'ativo', NULL, NULL, '2025-09-25 23:03:47.506239+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Brasileira', NULL, NULL, NULL, true, 'compensatorio', false, NULL, NULL, false, false),
	('47f83704-7c39-4a1c-a5bc-65e5552f12ee', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '010002', 'Maria Santos Teste', '11122233344', NULL, NULL, '2025-09-25', NULL, 'ativo', NULL, NULL, '2025-09-25 23:03:52.196539+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Brasileira', NULL, NULL, NULL, true, 'compensatorio', false, NULL, NULL, false, false),
	('71ed9f15-0390-4da5-bc2a-4650622770f6', '5e21e392-86b4-48a7-a5d9-c9070bb3b786', '020001', 'Pedro Costa Teste', '55566677788', NULL, NULL, '2025-09-25', NULL, 'ativo', NULL, NULL, '2025-09-25 23:03:56.466439+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Brasileira', NULL, NULL, NULL, true, 'compensatorio', false, NULL, NULL, false, false),
	('211dad80-bfad-4efe-b3f1-76947179ab21', '5e21e392-86b4-48a7-a5d9-c9070bb3b786', '020002', 'Ana Lima Teste', '99988877766', NULL, NULL, '2025-09-25', NULL, 'ativo', NULL, NULL, '2025-09-25 23:05:13.554463+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Brasileira', NULL, NULL, NULL, true, 'compensatorio', false, NULL, NULL, false, false);


--
-- Data for Name: time_records; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: attendance_corrections; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: beneficio_tipos; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: beneficio_elegibilidade; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: beneficio_elegibilidade_cargos; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: beneficio_elegibilidade_departamentos; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: beneficio_rateios; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: beneficio_rateio_departamentos; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: beneficio_rateio_historico; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: benefits; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."benefits" ("id", "company_id", "nome", "tipo", "valor", "percentual", "is_active", "created_at") VALUES
	('1d94a6a9-254b-4d74-b853-5799a4910cf5', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'Produtividade', 'outros', 100.00, NULL, true, '2025-09-26 11:38:42.978996+00'),
	('0cb3eec4-2e79-4a27-aa7f-83c3dd0afcdf', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'Vale Refeição', 'VR', NULL, NULL, true, '2025-09-27 14:55:17.844612+00'),
	('a386b8ed-ea7e-4443-92fe-508560188100', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'Vale Alimentação', 'VA', NULL, NULL, true, '2025-09-27 14:55:17.844612+00'),
	('5c8e3d61-2259-45ee-9c99-458680ff01ac', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'Vale Transporte', 'transporte', NULL, NULL, true, '2025-09-27 14:55:17.844612+00');


--
-- Data for Name: beneficios_descontos_afastamento; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: beneficios_elegibilidade; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: beneficios_rateios; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: benefit_payment_configs; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."benefit_payment_configs" ("id", "company_id", "benefit_type", "allowed_payment_methods", "flash_api_key", "flash_company_id", "is_active", "created_at", "updated_at") VALUES
	('7aec196c-4254-4c54-a0c1-0bfe6aad53d5', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'VR', '["flash"]', NULL, NULL, true, '2025-09-27 16:37:41.417854+00', '2025-09-27 16:37:41.417854+00'),
	('e8fba601-c8ac-4806-8905-09c78687d157', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'VA', '["flash"]', NULL, NULL, true, '2025-09-27 16:37:41.417854+00', '2025-09-27 16:37:41.417854+00'),
	('5aea6b63-702a-44e9-8fac-2e21c46efa96', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'transporte', '["flash", "transfer", "pix"]', NULL, NULL, true, '2025-09-27 16:37:41.417854+00', '2025-09-27 16:37:41.417854+00'),
	('8f110089-41c1-49f0-ad81-77c47202fd79', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'premiacao', '["flash", "transfer", "pix"]', NULL, NULL, true, '2025-09-27 16:37:41.417854+00', '2025-09-27 16:37:41.417854+00'),
	('ecafacd8-6d60-4714-823c-9ff49335fcac', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'producao', '["flash", "transfer", "pix"]', NULL, NULL, true, '2025-09-27 16:37:41.417854+00', '2025-09-27 16:37:41.417854+00');


--
-- Data for Name: benefit_payments; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: candidates; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: job_requests; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: job_openings; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: selection_processes; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: selection_stages; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: job_applications; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: candidate_upload_links; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: cid_codes; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."cid_codes" ("id", "codigo", "descricao", "categoria", "is_active", "requires_work_restriction", "max_absence_days", "company_id", "created_at", "updated_at", "created_by", "updated_by") VALUES
	('dc5a7d7f-7878-4049-b696-1e6c777daef3', 'J00', 'Resfriado comum', 'Doenças respiratórias', true, false, 2, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL),
	('8fe3965b-15a0-4652-8ffa-9e97732aca50', 'J06', 'Infecções agudas das vias aéreas superiores', 'Doenças respiratórias', true, false, 3, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL),
	('3f925e9e-800e-4393-8316-bffe45354e4c', 'J11', 'Gripe', 'Doenças respiratórias', true, true, 5, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL),
	('b3301857-12f6-4b9b-b4f6-86b8673dac2a', 'J44', 'Doença pulmonar obstrutiva crônica', 'Doenças respiratórias', true, true, 7, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL),
	('09fb5f55-8554-4a7b-8d32-a3e3191799b7', 'K59', 'Constipação', 'Doenças gastrointestinais', true, false, 1, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL),
	('4d43c45e-ef75-4a79-b3df-3c7bc8367856', 'K92', 'Sangramento gastrointestinal', 'Doenças gastrointestinais', true, true, 3, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL),
	('3fb2a7ed-6570-4325-a790-d70492bafc9b', 'A09', 'Diarreia e gastroenterite', 'Doenças gastrointestinais', true, true, 2, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL),
	('f6bb41c4-a828-4d8f-a719-5ddfeba3fb44', 'M79', 'Reumatismo não especificado', 'Doenças musculoesqueléticas', true, true, 3, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL),
	('12bb3208-20bf-41b5-b9d9-e85d489b2a80', 'M54', 'Dorsalgia', 'Doenças musculoesqueléticas', true, true, 5, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL),
	('3c4aa4ad-80bc-46e4-986a-77f3202942d2', 'M25', 'Outros transtornos articulares', 'Doenças musculoesqueléticas', true, true, 3, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL),
	('e0432140-78d4-41bd-b1a0-ac28a8ad628e', 'F32', 'Episódio depressivo', 'Transtornos mentais', true, true, 7, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL),
	('32a92fd6-8e8d-46c6-8602-20dd2df17069', 'F41', 'Outros transtornos ansiosos', 'Transtornos mentais', true, true, 5, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL),
	('e537814f-1311-4cd8-b598-36fff7ceb828', 'F43', 'Reação ao estresse grave', 'Transtornos mentais', true, true, 10, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL),
	('77c94b3a-bd3b-46a1-b24f-10151202e121', 'I10', 'Hipertensão essencial', 'Doenças cardiovasculares', true, true, 3, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL),
	('95a4246b-55fe-4ffc-84b6-cc4159c920ea', 'I25', 'Doença isquêmica do coração', 'Doenças cardiovasculares', true, true, 7, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL),
	('0e4d4e49-0eff-4055-a2fa-abfea1694ad1', 'B34', 'Infecção viral não especificada', 'Doenças infecciosas', true, true, 3, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL),
	('75f6df52-e4b5-47dc-9b16-f413ecc9d32a', 'A41', 'Sepse', 'Doenças infecciosas', true, true, 10, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL);


--
-- Data for Name: compensation_requests; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: convenios_empresas; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: convenios_planos; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: dashboard_alerts; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: dashboard_configs; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: deficiency_degrees; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."deficiency_degrees" ("id", "codigo", "descricao", "is_active", "company_id", "created_at", "updated_at", "created_by", "updated_by") VALUES
	('0654d82e-0481-4ac3-a678-20a30a4034cc', 'LEVE', 'Deficiência Leve', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL),
	('6962ca28-9ef7-4366-8e07-1c618944c915', 'MODERADA', 'Deficiência Moderada', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL),
	('a3b0a0e9-ebe4-4a7d-a558-760be6b3becc', 'SEVERA', 'Deficiência Severa', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL),
	('7e91bf16-0347-4ffa-8c79-17b6a327a4ae', 'PROFUNDA', 'Deficiência Profunda', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL);


--
-- Data for Name: deficiency_types; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."deficiency_types" ("id", "codigo", "descricao", "is_active", "company_id", "created_at", "updated_at", "created_by", "updated_by") VALUES
	('26427c5b-2b3b-402b-baf0-673466e2daf9', 'FISICA', 'Deficiência Física', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL),
	('face66b3-2b4b-40ca-9359-7b1ed710b6d4', 'VISUAL', 'Deficiência Visual', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL),
	('7a37f98a-91d2-44db-a96c-1109457a5fb8', 'AUDITIVA', 'Deficiência Auditiva', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL),
	('2d3f6448-6966-40bf-b06b-5d5c04b02d61', 'INTELECT', 'Deficiência Intelectual', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL),
	('05911051-d2f2-4fa8-bc66-505f1d5e1c11', 'MULTIPLA', 'Deficiência Múltipla', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL),
	('1395866c-082a-4f32-b7f5-c323d2dfe94f', 'TRANSTORNO', 'Transtorno do Espectro Autista', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL);


--
-- Data for Name: delay_reasons; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."delay_reasons" ("id", "codigo", "descricao", "categoria", "is_active", "requires_justification", "requires_medical_certificate", "company_id", "created_at", "updated_at", "created_by", "updated_by") VALUES
	('3501aefe-a394-4722-9dae-01db0670c8be', 'DOENCA', 'Doença/Problema de saúde', 'JUSTIFICADO', true, true, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL),
	('a46dc3ba-3264-4e4c-8afd-b2565ba72ad3', 'FAMILIA', 'Problema familiar urgente', 'JUSTIFICADO', true, true, false, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL),
	('3df8cdee-fdb8-4838-a8d6-311e8544f30f', 'TRANSPORTE', 'Problema no transporte público', 'JUSTIFICADO', true, true, false, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL),
	('70778c6f-5a49-4373-9689-854f0d9d7bb2', 'ACIDENTE', 'Acidente de trânsito', 'JUSTIFICADO', true, true, false, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL),
	('9c63138f-e5b5-4f50-91be-e0d3b20fe760', 'FUNERAL', 'Falecimento na família', 'JUSTIFICADO', true, true, false, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL),
	('f693af31-1165-4d65-bda9-db41fceefa44', 'SONO', 'Dormiu demais', 'INJUSTIFICADO', true, false, false, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL),
	('b632e252-fd7a-4fee-a332-3c7d096ebfaa', 'ESQUECEU', 'Esqueceu do horário', 'INJUSTIFICADO', true, false, false, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL),
	('6cf8e883-6841-435c-972c-5dfc3b5eebc7', 'PESSOAL', 'Questão pessoal', 'INJUSTIFICADO', true, false, false, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL),
	('5fc18617-99ce-40c9-bd5f-635cc9b4f6a2', 'SEM_MOTIVO', 'Sem motivo aparente', 'INJUSTIFICADO', true, false, false, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 12:46:47.68135+00', '2025-09-09 12:46:47.68135+00', NULL, NULL);


--
-- Data for Name: dependent_types; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."dependent_types" ("id", "codigo", "descricao", "is_active", "company_id", "created_at", "updated_at", "created_by", "updated_by") VALUES
	('1183b657-9950-4f3c-960c-2a5d7ee9c9d4', 'FILHO', 'Filho(a)', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL),
	('ce036b3c-6f85-489c-b245-89655058a582', 'CONJUGE', 'Cônjuge/Companheiro(a)', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL),
	('9285744b-5ee7-4d64-bc61-d09f4f4087b2', 'PAI', 'Pai', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL),
	('883fb615-6b7a-4bb2-aece-b4f49614c84a', 'MAE', 'Mãe', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL),
	('c537ef11-e951-4c75-bdf8-3df51b50dd0a', 'IRMAO', 'Irmão(ã)', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL),
	('445af7ea-08de-455a-8f32-eee868a8ab3b', 'NETO', 'Neto(a)', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL),
	('75340657-75b4-4fbf-9700-08c2edb313b7', 'BISNETO', 'Bisneto(a)', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL),
	('f7a51761-ec93-4e2e-9a63-02f23985f5e4', 'SOGRO', 'Sogro(a)', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL),
	('40672029-585e-4d3b-853d-7594b12232cf', 'ENTEADO', 'Enteado(a)', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL),
	('ef038ff6-b994-4220-8fd4-e03c85c0206b', 'TUTELADO', 'Tutelado(a)', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL),
	('3738b774-27d0-4101-a368-0f85980d2066', 'CURATELA', 'Curatelado(a)', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL);


--
-- Data for Name: employee_absences; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: employee_addresses; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: employee_allowances; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: employee_bank_accounts; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: transporte_configs; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: vr_va_configs; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."vr_va_configs" ("id", "company_id", "tipo", "valor_diario", "valor_mensal", "dias_uteis_mes", "desconto_por_ausencia", "desconto_por_ferias", "desconto_por_licenca", "is_active", "created_at", "updated_at") VALUES
	('651eda2a-a6aa-4355-bc03-4d128f7fe9a7', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'VA', 20.00, 440.00, 22, false, true, true, true, '2025-09-21 21:31:09.376+00', '2025-09-21 21:33:01.073+00'),
	('7861787f-6430-4d87-933c-18255b9a4cd5', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'VA', 22.00, 484.00, 22, false, true, true, true, '2025-09-21 21:34:05.531+00', '2025-09-21 21:34:05.531+00');


--
-- Data for Name: employee_benefit_assignments; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: employee_benefits; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: employee_delay_records; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: kinship_degrees; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."kinship_degrees" ("id", "codigo", "descricao", "is_active", "company_id", "created_at", "updated_at", "created_by", "updated_by") VALUES
	('86db187b-1159-4cb4-9e0e-c4a78419e38e', '1GRAU', '1º Grau', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL),
	('1ce9062b-1c6e-4114-b179-7c7c733d1a64', '2GRAU', '2º Grau', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL),
	('7a3011a0-f8e1-460f-9676-7fa88fdab261', '3GRAU', '3º Grau', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL),
	('ee89802d-62b8-40e0-8340-de40ddae526a', '4GRAU', '4º Grau', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL),
	('a62ceaaf-2491-4f2b-8bf5-6262301f0481', 'AFINIDADE', 'Afinidade', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL),
	('e0308699-5716-42c0-a816-e66cea06c608', 'TUTELA', 'Tutela', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL),
	('1c2b63b1-ca34-4f82-b994-6dd242208f09', 'CURATELA', 'Curatela', true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 01:03:59.210877+00', '2025-09-09 01:03:59.210877+00', NULL, NULL);


--
-- Data for Name: employee_dependents; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: employee_discounts; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: employee_documents; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: employee_education; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: employee_movement_types; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."employee_movement_types" ("id", "codigo", "nome", "descricao", "is_active", "created_at", "updated_at") VALUES
	('e7902761-620d-4e42-9529-0a16f061aa48', 'ADMISSAO', 'AdmissÃ£o', 'ContrataÃ§Ã£o do funcionÃ¡rio', true, '2025-09-25 23:40:24.13746+00', '2025-09-25 23:40:24.13746+00'),
	('17426459-c81a-40bd-82ba-a5e62ec32c22', 'PROMOCAO', 'PromoÃ§Ã£o', 'PromoÃ§Ã£o de cargo', true, '2025-09-25 23:40:24.13746+00', '2025-09-25 23:40:24.13746+00'),
	('35ac97f1-3a69-4e2f-a6a7-d41340c1ab9b', 'REBAIXAMENTO', 'Rebaixamento', 'Rebaixamento de cargo', true, '2025-09-25 23:40:24.13746+00', '2025-09-25 23:40:24.13746+00'),
	('72b4e8e9-8d90-4831-9f73-b8af183d07d0', 'MUDANCA_FUNCAO', 'MudanÃ§a de FunÃ§Ã£o', 'MudanÃ§a de funÃ§Ã£o/cargo', true, '2025-09-25 23:40:24.13746+00', '2025-09-25 23:40:24.13746+00'),
	('74617ba3-1cba-4b21-aeaf-909ba6eaef04', 'MUDANCA_CC', 'MudanÃ§a de Centro de Custo', 'TransferÃªncia de centro de custo', true, '2025-09-25 23:40:24.13746+00', '2025-09-25 23:40:24.13746+00'),
	('4173a457-4ec6-457d-b979-d28f97ff7f57', 'MUDANCA_PROJETO', 'MudanÃ§a de Projeto', 'TransferÃªncia de projeto', true, '2025-09-25 23:40:24.13746+00', '2025-09-25 23:40:24.13746+00'),
	('d9b366a8-52fd-43b6-bacf-d58dcd431528', 'MUDANCA_TURNO', 'MudanÃ§a de Turno', 'MudanÃ§a de turno de trabalho', true, '2025-09-25 23:40:24.13746+00', '2025-09-25 23:40:24.13746+00'),
	('b9402e60-266e-4ee4-be80-e12a7cdb87c7', 'MUDANCA_DEPARTAMENTO', 'MudanÃ§a de Departamento', 'TransferÃªncia de departamento', true, '2025-09-25 23:40:24.13746+00', '2025-09-25 23:40:24.13746+00'),
	('78e4647a-1c4c-4045-a3c9-f63e526bb8ea', 'MUDANCA_SALARIO', 'MudanÃ§a de SalÃ¡rio', 'AlteraÃ§Ã£o de salÃ¡rio', true, '2025-09-25 23:40:24.13746+00', '2025-09-25 23:40:24.13746+00'),
	('9b683b44-36df-45f6-9f7d-134b764a2487', 'MUDANCA_STATUS', 'MudanÃ§a de Status', 'MudanÃ§a de status do funcionÃ¡rio', true, '2025-09-25 23:40:24.13746+00', '2025-09-25 23:40:24.13746+00'),
	('976c996a-c19c-4d01-b125-9885de831779', 'FERIAS', 'FÃ©rias', 'PerÃ­odo de fÃ©rias', true, '2025-09-25 23:40:24.13746+00', '2025-09-25 23:40:24.13746+00'),
	('d58ee643-e4a4-4650-a52e-8ceae08aff4f', 'LICENCA', 'LicenÃ§a', 'PerÃ­odo de licenÃ§a', true, '2025-09-25 23:40:24.13746+00', '2025-09-25 23:40:24.13746+00'),
	('0d76a593-179b-4967-9d58-37d4e39e5e5d', 'DEMISSAO', 'DemissÃ£o', 'Desligamento do funcionÃ¡rio', true, '2025-09-25 23:40:24.13746+00', '2025-09-25 23:40:24.13746+00'),
	('0afdd81e-51d5-4910-b68a-d599e43c0b4d', 'APOSENTADORIA', 'Aposentadoria', 'Aposentadoria do funcionÃ¡rio', true, '2025-09-25 23:40:24.13746+00', '2025-09-25 23:40:24.13746+00'),
	('165bc619-0b1c-48fe-8305-baf46b4ee5b6', 'TRANSFERENCIA', 'TransferÃªncia', 'TransferÃªncia interna ou externa', true, '2025-09-25 23:40:24.13746+00', '2025-09-25 23:40:24.13746+00');


--
-- Data for Name: work_shifts; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: employee_history; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."employee_history" ("id", "employee_id", "company_id", "movement_type_id", "previous_position_id", "previous_cost_center_id", "previous_project_id", "previous_work_shift_id", "previous_manager_id", "previous_salario_base", "previous_status", "new_position_id", "new_cost_center_id", "new_project_id", "new_work_shift_id", "new_manager_id", "new_salario_base", "new_status", "effective_date", "reason", "description", "attachment_url", "created_at", "created_by", "updated_at", "updated_by") VALUES
	('0251c8a4-460e-47d9-bf6d-4b42beabf4eb', 'fc0ba118-76d7-4dc0-8574-dc43ea6934c5', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'e7902761-620d-4e42-9529-0a16f061aa48', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '506c1630-90e3-4fea-b39b-16f6f0784294', NULL, NULL, NULL, NULL, 5000.00, 'ativo', '2025-09-25', NULL, 'Registro de teste do sistema de hist?rico', NULL, '2025-09-25 23:52:39.127038+00', '9a47048d-12f0-4456-9927-7a54e333eb8c', '2025-09-25 23:52:39.127038+00', NULL);


--
-- Data for Name: employee_pcd_info; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: employee_shifts; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: employee_spouses; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: fgts_config; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."fgts_config" ("id", "codigo", "descricao", "aliquota", "valor_maximo", "valor_minimo", "is_active", "company_id", "created_at", "updated_at", "created_by", "updated_by") VALUES
	('b05ee83a-c85d-420d-8d20-3e2d2357cfde', 'FGTS_NORMA', 'FGTS Normal', 0.0800, 999999.99, 0.00, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:46:12.976168+00', '2025-09-09 13:46:12.976168+00', NULL, NULL),
	('08861bc0-e70d-413a-aff8-5757d137b87a', 'FGTS_APREN', 'FGTS Aprendiz', 0.0200, 999999.99, 0.00, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:46:12.976168+00', '2025-09-09 13:46:12.976168+00', NULL, NULL),
	('8b320edc-e67a-4475-b567-43d9cbeee89e', 'FGTS_DOMES', 'FGTS Doméstico', 0.0800, 999999.99, 0.00, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:46:12.976168+00', '2025-09-09 13:46:12.976168+00', NULL, NULL);


--
-- Data for Name: inss_brackets; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."inss_brackets" ("id", "codigo", "descricao", "salario_minimo", "salario_maximo", "aliquota", "valor_deducao", "is_active", "company_id", "created_at", "updated_at", "created_by", "updated_by") VALUES
	('93cc690c-e0f2-49dc-8d13-ef0e702a8c93', 'INSS_1', '1ª Faixa INSS', 0.00, 1320.00, 0.0750, 0.00, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:46:12.976168+00', '2025-09-09 13:46:12.976168+00', NULL, NULL),
	('24bfd923-2a86-4d5e-8227-d9f31f9c670c', 'INSS_2', '2ª Faixa INSS', 1320.01, 2571.29, 0.0900, 19.80, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:46:12.976168+00', '2025-09-09 13:46:12.976168+00', NULL, NULL),
	('380e1bb1-09fb-41ba-a6ef-0acf8d855c61', 'INSS_3', '3ª Faixa INSS', 2571.30, 3856.94, 0.1200, 96.94, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:46:12.976168+00', '2025-09-09 13:46:12.976168+00', NULL, NULL),
	('2de9c479-1cf6-490b-90c0-250abea4dd68', 'INSS_4', '4ª Faixa INSS', 3856.95, 7507.49, 0.1400, 174.08, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:46:12.976168+00', '2025-09-09 13:46:12.976168+00', NULL, NULL),
	('87cb2406-f82e-4c62-bfc5-d01b372ad874', 'INSS_TETO', 'Teto INSS', 7507.49, 999999.99, 0.1400, 174.08, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:46:12.976168+00', '2025-09-09 13:46:12.976168+00', NULL, NULL);


--
-- Data for Name: irrf_brackets; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."irrf_brackets" ("id", "codigo", "descricao", "salario_minimo", "salario_maximo", "aliquota", "valor_deducao", "dependentes_deducao", "is_active", "company_id", "created_at", "updated_at", "created_by", "updated_by") VALUES
	('4552808c-e9dc-4660-a95a-2d74df2a4650', 'IRRF_1', '1ª Faixa IRRF', 0.00, 2282.00, 0.0000, 0.00, 227.50, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:46:12.976168+00', '2025-09-09 13:46:12.976168+00', NULL, NULL),
	('1ba126f9-b9d3-483b-bdf2-7c8f5f2b0488', 'IRRF_2', '2ª Faixa IRRF', 2282.01, 3391.00, 0.0750, 171.15, 227.50, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:46:12.976168+00', '2025-09-09 13:46:12.976168+00', NULL, NULL),
	('f9d8b835-e270-42b9-bc29-670240b0f325', 'IRRF_3', '3ª Faixa IRRF', 3391.01, 4500.00, 0.1500, 512.10, 227.50, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:46:12.976168+00', '2025-09-09 13:46:12.976168+00', NULL, NULL),
	('71782a92-bd1e-4bcf-830d-d4f85cb35487', 'IRRF_4', '4ª Faixa IRRF', 4500.01, 5597.00, 0.2250, 923.58, 227.50, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:46:12.976168+00', '2025-09-09 13:46:12.976168+00', NULL, NULL),
	('c8a9c1e4-9958-46b7-a160-5eb313e39704', 'IRRF_5', '5ª Faixa IRRF', 5597.01, 999999.99, 0.2750, 1251.20, 227.50, true, '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-09 13:46:12.976168+00', '2025-09-09 13:46:12.976168+00', NULL, NULL);


--
-- Data for Name: employee_tax_calculations; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: employment_contracts; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: equipment_rentals; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."equipment_rentals" ("id", "company_id", "employee_id", "equipment_type", "equipment_name", "equipment_description", "brand", "model", "serial_number", "license_plate", "monthly_value", "start_date", "end_date", "status", "created_at", "updated_at", "created_by", "updated_by") VALUES
	('e2977432-67f2-4274-a8fd-158efb344b6e', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'fc0ba118-76d7-4dc0-8574-dc43ea6934c5', 'computer', 'Notebook Teste', '', '', '', '', '', 100.00, '2025-09-12', NULL, 'active', '2025-09-12 12:14:30.827496+00', '2025-09-27 15:51:43.320229+00', '15d314e8-5251-4651-8863-46fc755f6220', NULL);


--
-- Data for Name: equipment_rental_approvals; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."equipment_rental_approvals" ("id", "company_id", "employee_id", "equipment_rental_id", "mes_referencia", "ano_referencia", "valor_aprovado", "status", "aprovado_por", "data_aprovacao", "observacoes", "created_at", "updated_at") VALUES
	('b6ebcf98-efaa-4a7c-aedf-ba97c29c3669', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'fc0ba118-76d7-4dc0-8574-dc43ea6934c5', 'e2977432-67f2-4274-a8fd-158efb344b6e', 1, 2025, 500.00, 'pendente', NULL, NULL, 'Teste de aprovação', '2025-09-23 22:36:15.279335+00', '2025-09-23 22:36:15.279335+00');


--
-- Data for Name: equipment_rental_payments; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."equipment_rental_payments" ("id", "company_id", "equipment_rental_id", "payment_month", "payment_year", "amount", "payment_date", "status", "payment_method", "payment_reference", "notes", "created_at", "updated_at", "created_by", "updated_by") VALUES
	('418666b9-3ab0-464a-902c-5547387bee5a', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'e2977432-67f2-4274-a8fd-158efb344b6e', '2025-09', 2025, 500.00, NULL, 'pending', NULL, NULL, NULL, '2025-09-12 12:14:30.827496+00', '2025-09-12 12:14:30.827496+00', '15d314e8-5251-4651-8863-46fc755f6220', NULL),
	('2ffd2965-d78b-4735-9929-3738e8136805', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'e2977432-67f2-4274-a8fd-158efb344b6e', '10', 2025, 133.33, NULL, 'pending', NULL, NULL, 'Processado do período 2025-09. Ausências: 22. Valor diário: 16.67.', '2025-09-23 18:13:11.737924+00', '2025-09-23 18:13:11.737924+00', '15d314e8-5251-4651-8863-46fc755f6220', NULL),
	('402c4c6f-5418-4182-b918-9585702fc9e8', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'e2977432-67f2-4274-a8fd-158efb344b6e', '09', 2025, 150.00, NULL, 'pending', NULL, NULL, 'Processado do período 2025-08. Ausências: 21. Valor diário: 16.67.', '2025-09-23 18:37:50.725279+00', '2025-09-23 18:37:50.725279+00', '15d314e8-5251-4651-8863-46fc755f6220', NULL),
	('8fba47c8-ba40-4a0c-b014-dbd8b00a00f3', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'e2977432-67f2-4274-a8fd-158efb344b6e', '08', 2025, 0.00, NULL, 'pending', NULL, NULL, 'Processado do período 2025-07. Ausências: undefined. Valor diário: 3.33.', '2025-09-27 16:06:15.673184+00', '2025-09-27 16:06:15.673184+00', '15d314e8-5251-4651-8863-46fc755f6220', NULL);


--
-- Data for Name: esocial_batches; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: esocial_benefit_types; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: esocial_categories; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."esocial_categories" ("id", "company_id", "codigo", "descricao", "is_active", "created_at") VALUES
	('e792e959-ada4-4f13-8617-1fb3e03e5766', NULL, '101', 'Empregado - Geral, inclusive o empregado público da administração direta ou indireta contratado pela CLT', true, '2025-09-08 23:26:16.382592+00'),
	('a291d361-e61e-459f-80f5-f20d425e9607', NULL, '102', 'Empregado - Trabalhador rural por pequeno prazo da Lei 11.718/2008', true, '2025-09-08 23:26:16.382592+00'),
	('85d35a9e-048d-4b54-b33b-853c315183dd', NULL, '103', 'Empregado - Trabalhador avulso portuário', true, '2025-09-08 23:26:16.382592+00'),
	('7f8da877-130d-45ed-9a01-d5c79b041468', NULL, '104', 'Empregado - Trabalhador avulso não portuário', true, '2025-09-08 23:26:16.382592+00'),
	('0635159d-40ad-4fbd-a081-aa276cd63bd3', NULL, '105', 'Empregado - Trabalhador temporário - Lei 6.019/1974', true, '2025-09-08 23:26:16.382592+00'),
	('85388762-4fd2-40af-9553-e4f343f551e7', NULL, '106', 'Empregado - Trabalhador terceirizado - Lei 6.019/1974', true, '2025-09-08 23:26:16.382592+00'),
	('e7ca4cf9-c82d-49fe-bd17-d4aa7d05e4a7', NULL, '107', 'Empregado - Trabalhador cedido', true, '2025-09-08 23:26:16.382592+00'),
	('5cd3cb0c-016f-43fc-93bd-59e36e9d2c62', NULL, '108', 'Empregado - Trabalhador doméstico', true, '2025-09-08 23:26:16.382592+00'),
	('d8aebe6b-3150-4584-a25d-be32b26fc557', NULL, '111', 'Empregado - Trabalhador rural por pequeno prazo da Lei 11.718/2008 - Segurado especial', true, '2025-09-08 23:26:16.382592+00'),
	('8d4fe4cf-f490-40a2-ab67-48b3a7f6479f', NULL, '112', 'Empregado - Trabalhador rural por pequeno prazo da Lei 11.718/2008 - Segurado especial - Contribuinte individual', true, '2025-09-08 23:26:16.382592+00');


--
-- Data for Name: esocial_events; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: esocial_integration_config; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: esocial_leave_types; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: esocial_naturezas_rubricas; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."esocial_naturezas_rubricas" ("id", "company_id", "codigo", "descricao", "is_active", "created_at") VALUES
	('3b427f6d-353f-4c3e-994d-c72b74573095', NULL, '1001', 'Salário', true, '2025-09-08 23:26:16.382592+00'),
	('6b26382d-8d7c-49d7-a2dc-20b21232e872', NULL, '1002', 'Adicional de insalubridade', true, '2025-09-08 23:26:16.382592+00'),
	('8125bb8c-e938-4c70-820c-ad3062ca3881', NULL, '1003', 'Adicional de periculosidade', true, '2025-09-08 23:26:16.382592+00'),
	('69f5496c-9df2-4c33-bce7-af7ede1ae334', NULL, '1004', 'Adicional noturno', true, '2025-09-08 23:26:16.382592+00'),
	('e2205586-f370-4758-bd66-2acd4bb97b43', NULL, '1006', 'DSR', true, '2025-09-08 23:26:16.382592+00'),
	('5422605d-5f74-4b3a-9a9a-0e0a540b5fb9', NULL, '1007', 'Gratificação', true, '2025-09-08 23:26:16.382592+00'),
	('410e10c8-a437-4152-8e80-a05579820b02', NULL, '1008', 'Comissão', true, '2025-09-08 23:26:16.382592+00'),
	('4c98107a-171e-475e-af88-91fc87efd9a4', NULL, '1010', '13º salário', true, '2025-09-08 23:26:16.382592+00'),
	('0f46ccdc-d07b-4506-9a11-0cbd0701f7e3', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '1009', 'Prêmio', true, '2025-09-08 23:26:16.382592+00'),
	('3aeba0e5-1d51-4aa3-b62e-69ec02f9f915', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '1005', 'Horas extras', true, '2025-09-08 23:26:16.382592+00');


--
-- Data for Name: esocial_processed_events; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: esocial_validations; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: esocial_validation_history; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: funcionario_beneficios_historico; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."funcionario_beneficios_historico" ("id", "employee_id", "benefit_id", "convenio_id", "vr_va_config_id", "transporte_config_id", "valor_beneficio", "valor_desconto", "valor_final", "motivo_desconto", "mes_referencia", "ano_referencia", "status", "data_inicio", "data_fim", "created_at", "updated_at", "company_id", "payment_method", "payment_status", "payment_transaction_id", "payment_date") VALUES
	('dd104c7b-431e-448f-b7d2-f2399f1ea932', 'fc0ba118-76d7-4dc0-8574-dc43ea6934c5', 'a386b8ed-ea7e-4443-92fe-508560188100', NULL, '651eda2a-a6aa-4355-bc03-4d128f7fe9a7', NULL, 440.00, 0.00, 440.00, NULL, 9, 2025, 'ativo', '2025-09-01', NULL, '2025-09-27 14:55:17.844612+00', '2025-09-27 14:55:17.844612+00', NULL, NULL, 'pending', NULL, NULL),
	('53004e1d-c9f3-4a95-8cb4-b90a310f55ff', 'fc0ba118-76d7-4dc0-8574-dc43ea6934c5', 'a386b8ed-ea7e-4443-92fe-508560188100', NULL, '7861787f-6430-4d87-933c-18255b9a4cd5', NULL, 484.00, 0.00, 484.00, NULL, 9, 2025, 'ativo', '2025-09-01', NULL, '2025-09-27 14:55:17.844612+00', '2025-09-27 14:55:17.844612+00', NULL, NULL, 'pending', NULL, NULL),
	('3196640c-02ee-4d8a-9504-ef605d36c3ff', '25594519-67fe-412e-97fd-9ababe0849f0', 'a386b8ed-ea7e-4443-92fe-508560188100', NULL, '651eda2a-a6aa-4355-bc03-4d128f7fe9a7', NULL, 440.00, 0.00, 440.00, NULL, 9, 2025, 'ativo', '2025-09-01', NULL, '2025-09-27 14:55:17.844612+00', '2025-09-27 14:55:17.844612+00', NULL, NULL, 'pending', NULL, NULL),
	('e0315a96-3aa4-4419-a0f3-75875da02acf', '25594519-67fe-412e-97fd-9ababe0849f0', 'a386b8ed-ea7e-4443-92fe-508560188100', NULL, '7861787f-6430-4d87-933c-18255b9a4cd5', NULL, 484.00, 0.00, 484.00, NULL, 9, 2025, 'ativo', '2025-09-01', NULL, '2025-09-27 14:55:17.844612+00', '2025-09-27 14:55:17.844612+00', NULL, NULL, 'pending', NULL, NULL),
	('29236f9c-01bd-451c-85c9-597f4a2b37cc', '47f83704-7c39-4a1c-a5bc-65e5552f12ee', 'a386b8ed-ea7e-4443-92fe-508560188100', NULL, '651eda2a-a6aa-4355-bc03-4d128f7fe9a7', NULL, 440.00, 0.00, 440.00, NULL, 9, 2025, 'ativo', '2025-09-01', NULL, '2025-09-27 14:55:17.844612+00', '2025-09-27 14:55:17.844612+00', NULL, NULL, 'pending', NULL, NULL),
	('2aa83afb-f79a-4bdb-8857-88fd9b6e0cfd', '47f83704-7c39-4a1c-a5bc-65e5552f12ee', 'a386b8ed-ea7e-4443-92fe-508560188100', NULL, '7861787f-6430-4d87-933c-18255b9a4cd5', NULL, 484.00, 0.00, 484.00, NULL, 9, 2025, 'ativo', '2025-09-01', NULL, '2025-09-27 14:55:17.844612+00', '2025-09-27 14:55:17.844612+00', NULL, NULL, 'pending', NULL, NULL);


--
-- Data for Name: funcionario_convenios; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: funcionario_convenio_dependentes; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: funcionario_elegibilidade; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: hiring_documents; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: holidays; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."holidays" ("id", "company_id", "data", "nome", "tipo", "estado", "cidade", "is_active", "created_at") VALUES
	('335b6e9e-f100-47eb-9096-0eba76bca50b', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2024-01-01', 'Confraternização Universal', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('e3bbf375-b185-4aa6-8f21-990332ea1e60', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2024-04-21', 'Tiradentes', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('b95e222d-acdf-46a6-8931-275c478b5560', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2024-05-01', 'Dia do Trabalhador', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('cdaa4702-6dd2-474c-8740-396db42ddb15', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2024-09-07', 'Independência do Brasil', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('9c7c659c-ed61-4e22-a3c7-ec7d811dce4f', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2024-10-12', 'Nossa Senhora Aparecida', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('0e82e5ac-4efa-41b0-a9f3-1b19ae1071ce', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2024-11-02', 'Finados', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('bdf922b0-31a3-47b0-9a62-05053b5aceec', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2024-11-15', 'Proclamação da República', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('3fcfdbbb-234c-42e5-8359-94aec3d69a7c', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2024-12-25', 'Natal', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('fdded3dd-7198-4678-83f3-ef48800840d2', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-01-01', 'Confraternização Universal', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('52b0421e-f0ac-4564-90da-a7eab0a648ae', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-04-21', 'Tiradentes', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('842314ed-b53a-4664-9f9d-d076d70f1d80', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-05-01', 'Dia do Trabalhador', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('98ed4578-2ceb-4a32-8c06-0e2570c7e2c6', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-09-07', 'Independência do Brasil', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('d622cda4-faf3-4f41-b89e-2a2317977876', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-10-12', 'Nossa Senhora Aparecida', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('36f5978a-9262-4696-b674-7676ff8b4e57', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-11-02', 'Finados', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('b15e879c-4718-47d3-ae5e-0ecd28a0a7e4', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-11-15', 'Proclamação da República', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('d29f9a7c-f344-40fd-849b-82200a78d50e', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-12-25', 'Natal', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('290952cf-1daf-4673-9185-74fd93b4d6da', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2026-01-01', 'Confraternização Universal', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('7e9346b2-aa93-490d-9e7b-3847fc37278a', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2026-04-21', 'Tiradentes', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('6b319f51-dbab-478a-8914-7cb140fee52f', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2026-05-01', 'Dia do Trabalhador', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('9fecd22f-ead4-49a3-855a-21c800c3bd68', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2026-09-07', 'Independência do Brasil', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('851d841f-d49f-4a42-881b-f67cfa11d9d7', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2026-10-12', 'Nossa Senhora Aparecida', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('52d0af59-4e72-4068-83d1-0252ee7bc41d', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2026-11-02', 'Finados', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('2dd46e6a-7b0d-4fa9-9b59-cfa57a64742e', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2026-11-15', 'Proclamação da República', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('5b00e7aa-3484-4e2e-8548-8aba977b13ef', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2026-12-25', 'Natal', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('51f10b99-3a85-42c3-843d-17736dfa8e4b', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2024-02-13', 'Carnaval', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('0606f6c1-90d5-4dba-a2c7-2141cdc3f69a', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2024-02-14', 'Carnaval', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('15dd056c-c14f-4549-8e63-788d94468180', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2024-03-29', 'Sexta-feira Santa', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('ad5bc11c-51f6-4037-9e5e-5773d4719bc3', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2024-05-30', 'Corpus Christi', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('8d49ab2b-d012-4fff-b836-592ad7e36fce', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-03-04', 'Carnaval', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('85437df2-b1b1-480b-a9dc-d422595cb1a7', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-03-05', 'Carnaval', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('752314de-60b8-41c5-b05b-ce78e6bce0cc', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-04-18', 'Sexta-feira Santa', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00'),
	('5a1b5abb-80f5-43b5-870f-c9b2610a0518', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', '2025-06-19', 'Corpus Christi', 'nacional', NULL, NULL, true, '2025-09-16 20:34:03.060969+00');


--
-- Data for Name: income_statements; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: medical_certificates; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: notification_history; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: payroll; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: payroll_calculations; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: payroll_accounting_provisions; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: payroll_calculation_config; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: payroll_rubricas; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: payroll_calculation_items; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: payroll_payment_batches; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: payroll_cnab_files; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: payroll_config; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: payroll_consolidation_config; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: payroll_consolidation_history; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: payroll_event_validations; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: payroll_events; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: payroll_financial_config; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: payroll_generated_titles; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: payroll_items; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: payroll_slips; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: payroll_tax_guides; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: payroll_validations; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: payroll_validation_history; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: periodic_exams; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: premiacao_configs; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: premiacao_assignments; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: report_templates; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: report_history; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: rubricas; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: schedule_entries; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: stage_results; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: talent_pool; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: time_bank; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: time_record_correction_control; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."time_record_correction_control" ("id", "company_id", "year", "month", "correction_enabled", "created_at", "updated_at", "created_by", "updated_by") VALUES
	('5c6765cf-7b37-4f99-b11f-5bafcb00c330', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 2025, 9, true, '2025-09-21 11:54:55.305382+00', '2025-09-21 11:54:55.305382+00', '15d314e8-5251-4651-8863-46fc755f6220', '15d314e8-5251-4651-8863-46fc755f6220'),
	('ca2885f4-0db1-431f-8bfb-aa24fe7125f1', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 2025, 8, false, '2025-09-22 20:02:15.368678+00', '2025-09-22 20:03:08.614263+00', '15d314e8-5251-4651-8863-46fc755f6220', '15d314e8-5251-4651-8863-46fc755f6220');


--
-- Data for Name: unions; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: units; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: user_dashboard_preferences; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: user_settings; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: vacation_notifications; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: vacations; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: vacation_periods; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: work_shift_patterns; Type: TABLE DATA; Schema: rh; Owner: postgres
--



--
-- Data for Name: work_shift_templates; Type: TABLE DATA; Schema: rh; Owner: postgres
--

INSERT INTO "rh"."work_shift_templates" ("id", "company_id", "nome", "tipo_escala", "dias_trabalho", "dias_folga", "ciclo_dias", "descricao", "regras_clt", "is_active", "created_at") VALUES
	('f7e14a46-3382-47a8-ac22-0a3a7bed3027', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'Escala 5x2 (Segunda a Sexta)', 'flexivel_5x2', 5, 2, 7, 'Trabalho de segunda a sexta, folga sábado e domingo', '{"max_horas_diarias": 8, "intervalo_refeicao": 60, "max_horas_semanais": 44}', true, '2025-09-27 13:53:02.255351+00'),
	('9406cc55-627e-43f3-a707-a0abd11580a4', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'Escala 6x1 (Flexível)', 'flexivel_6x1', 6, 1, 7, '6 dias de trabalho, 1 dia de folga (não consecutivos)', '{"max_horas_diarias": 8, "intervalo_refeicao": 60, "max_horas_semanais": 44}', true, '2025-09-27 13:53:02.255351+00'),
	('3b2ad1a5-78c0-4472-9344-1a34904ca423', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'Escala 12x36', 'escala_12x36', 1, 2, 3, '12 horas de trabalho, 36 horas de folga', '{"max_horas_diarias": 12, "intervalo_refeicao": 60, "max_horas_semanais": 44}', true, '2025-09-27 13:53:02.255351+00'),
	('3057d99a-40a1-4f44-a4ac-86aab6e4b89a', '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0', 'Escala 24x48', 'escala_24x48', 1, 2, 3, '24 horas de trabalho, 48 horas de folga', '{"max_horas_diarias": 24, "intervalo_refeicao": 60, "max_horas_semanais": 44}', true, '2025-09-27 13:53:02.255351+00');


--
-- PostgreSQL database dump complete
--

RESET ALL;
