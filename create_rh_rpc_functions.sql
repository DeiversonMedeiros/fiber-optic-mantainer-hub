-- Script para criar funções RPC que acessam o schema RH
-- Execute este script no SQL Editor do Supabase

-- 1. Função para buscar funcionários
CREATE OR REPLACE FUNCTION get_employees(
    company_id_param text DEFAULT NULL,
    limit_param integer DEFAULT 100,
    offset_param integer DEFAULT 0
)
RETURNS TABLE (
    id text,
    company_id text,
    matricula text,
    nome text,
    cpf text,
    rg text,
    data_nascimento text,
    data_admissao text,
    data_demissao text,
    status text,
    cost_center_id text,
    project_id text,
    created_at text,
    updated_at text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.company_id,
        e.matricula,
        e.nome,
        e.cpf,
        e.rg,
        e.data_nascimento,
        e.data_admissao,
        e.data_demissao,
        e.status,
        e.cost_center_id,
        e.project_id,
        e.created_at,
        e.updated_at
    FROM rh.employees e
    WHERE (company_id_param IS NULL OR e.company_id = company_id_param)
    ORDER BY e.nome
    LIMIT limit_param
    OFFSET offset_param;
END;
$$;

-- 2. Função para inserir funcionário
CREATE OR REPLACE FUNCTION insert_employee(
    employee_data jsonb
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_id text;
BEGIN
    INSERT INTO rh.employees (
        company_id,
        matricula,
        nome,
        cpf,
        rg,
        data_nascimento,
        data_admissao,
        data_demissao,
        status,
        cost_center_id,
        project_id
    ) VALUES (
        (employee_data->>'company_id'),
        (employee_data->>'matricula'),
        (employee_data->>'nome'),
        (employee_data->>'cpf'),
        (employee_data->>'rg'),
        (employee_data->>'data_nascimento'),
        (employee_data->>'data_admissao'),
        (employee_data->>'data_demissao'),
        (employee_data->>'status'),
        (employee_data->>'cost_center_id'),
        (employee_data->>'project_id')
    ) RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$;

-- 3. Função para atualizar funcionário
CREATE OR REPLACE FUNCTION update_employee(
    employee_id text,
    employee_data jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE rh.employees SET
        company_id = COALESCE((employee_data->>'company_id'), company_id),
        matricula = COALESCE((employee_data->>'matricula'), matricula),
        nome = COALESCE((employee_data->>'nome'), nome),
        cpf = COALESCE((employee_data->>'cpf'), cpf),
        rg = COALESCE((employee_data->>'rg'), rg),
        data_nascimento = COALESCE((employee_data->>'data_nascimento'), data_nascimento),
        data_admissao = COALESCE((employee_data->>'data_admissao'), data_admissao),
        data_demissao = COALESCE((employee_data->>'data_demissao'), data_demissao),
        status = COALESCE((employee_data->>'status'), status),
        cost_center_id = COALESCE((employee_data->>'cost_center_id'), cost_center_id),
        project_id = COALESCE((employee_data->>'project_id'), project_id),
        updated_at = NOW()
    WHERE id = employee_id;
    
    RETURN FOUND;
END;
$$;

-- 4. Função para deletar funcionário
CREATE OR REPLACE FUNCTION delete_employee(
    employee_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM rh.employees WHERE id = employee_id;
    RETURN FOUND;
END;
$$;

-- 5. Função para buscar cargos
CREATE OR REPLACE FUNCTION get_positions(
    company_id_param text DEFAULT NULL,
    limit_param integer DEFAULT 100,
    offset_param integer DEFAULT 0
)
RETURNS TABLE (
    id text,
    company_id text,
    name text,
    description text,
    is_active boolean,
    created_at text,
    updated_at text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.company_id,
        p.name,
        p.description,
        p.is_active,
        p.created_at,
        p.updated_at
    FROM rh.positions p
    WHERE (company_id_param IS NULL OR p.company_id = company_id_param)
    ORDER BY p.name
    LIMIT limit_param
    OFFSET offset_param;
END;
$$;

-- 6. Conceder permissões para executar as funções
GRANT EXECUTE ON FUNCTION get_employees TO anon;
GRANT EXECUTE ON FUNCTION get_employees TO authenticated;
GRANT EXECUTE ON FUNCTION get_employees TO service_role;
GRANT EXECUTE ON FUNCTION get_employees TO public;

GRANT EXECUTE ON FUNCTION insert_employee TO anon;
GRANT EXECUTE ON FUNCTION insert_employee TO authenticated;
GRANT EXECUTE ON FUNCTION insert_employee TO service_role;
GRANT EXECUTE ON FUNCTION insert_employee TO public;

GRANT EXECUTE ON FUNCTION update_employee TO anon;
GRANT EXECUTE ON FUNCTION update_employee TO authenticated;
GRANT EXECUTE ON FUNCTION update_employee TO service_role;
GRANT EXECUTE ON FUNCTION update_employee TO public;

GRANT EXECUTE ON FUNCTION delete_employee TO anon;
GRANT EXECUTE ON FUNCTION delete_employee TO authenticated;
GRANT EXECUTE ON FUNCTION delete_employee TO service_role;
GRANT EXECUTE ON FUNCTION delete_employee TO public;

GRANT EXECUTE ON FUNCTION get_positions TO anon;
GRANT EXECUTE ON FUNCTION get_positions TO authenticated;
GRANT EXECUTE ON FUNCTION get_positions TO service_role;
GRANT EXECUTE ON FUNCTION get_positions TO public;


