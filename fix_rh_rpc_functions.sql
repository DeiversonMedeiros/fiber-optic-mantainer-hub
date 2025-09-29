-- Script para corrigir as funções RPC com base no schema real das tabelas
-- Execute este script no SQL Editor do Supabase

-- 1. Corrigir função get_employees (usar tipos corretos do schema)
CREATE OR REPLACE FUNCTION get_employees(
    company_id_param text DEFAULT NULL,
    limit_param integer DEFAULT 100,
    offset_param integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    company_id uuid,
    matricula text,
    nome text,
    cpf text,
    rg text,
    data_nascimento date,
    data_admissao date,
    data_demissao date,
    status text,
    cost_center_id uuid,
    project_id uuid,
    created_at timestamp with time zone
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
        e.data_nascimento::date,
        e.data_admissao::date,
        e.data_demissao::date,
        e.status::text,
        e.cost_center_id,
        e.project_id,
        e.created_at
    FROM rh.employees e
    WHERE (company_id_param IS NULL OR e.company_id::text = company_id_param)
    ORDER BY e.nome
    LIMIT limit_param
    OFFSET offset_param;
END;
$$;

-- 2. Corrigir função insert_employee (usar tipos corretos)
CREATE OR REPLACE FUNCTION insert_employee(
    employee_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_id uuid;
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
        (employee_data->>'company_id')::uuid,
        (employee_data->>'matricula'),
        (employee_data->>'nome'),
        (employee_data->>'cpf'),
        (employee_data->>'rg'),
        (employee_data->>'data_nascimento')::date,
        (employee_data->>'data_admissao')::date,
        (employee_data->>'data_demissao')::date,
        (employee_data->>'status')::rh.employees.status%TYPE,
        (employee_data->>'cost_center_id')::uuid,
        (employee_data->>'project_id')::uuid
    ) RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$;

-- 3. Corrigir função update_employee (usar tipos corretos)
CREATE OR REPLACE FUNCTION update_employee(
    employee_id uuid,
    employee_data jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE rh.employees SET
        company_id = COALESCE((employee_data->>'company_id')::uuid, company_id),
        matricula = COALESCE((employee_data->>'matricula'), matricula),
        nome = COALESCE((employee_data->>'nome'), nome),
        cpf = COALESCE((employee_data->>'cpf'), cpf),
        rg = COALESCE((employee_data->>'rg'), rg),
        data_nascimento = COALESCE((employee_data->>'data_nascimento')::date, data_nascimento),
        data_admissao = COALESCE((employee_data->>'data_admissao')::date, data_admissao),
        data_demissao = COALESCE((employee_data->>'data_demissao')::date, data_demissao),
        status = COALESCE((employee_data->>'status')::rh.employees.status%TYPE, status),
        cost_center_id = COALESCE((employee_data->>'cost_center_id')::uuid, cost_center_id),
        project_id = COALESCE((employee_data->>'project_id')::uuid, project_id)
    WHERE id = employee_id;
    
    RETURN FOUND;
END;
$$;

-- 4. Corrigir função delete_employee (usar uuid)
CREATE OR REPLACE FUNCTION delete_employee(
    employee_id uuid
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

-- 5. Corrigir função get_positions (usar campos corretos do schema)
CREATE OR REPLACE FUNCTION get_positions(
    company_id_param text DEFAULT NULL,
    limit_param integer DEFAULT 100,
    offset_param integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    company_id uuid,
    codigo text,
    nome text,
    descricao text,
    nivel_hierarquico integer,
    is_active boolean,
    created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.company_id,
        p.codigo,
        p.nome,
        p.descricao,
        p.nivel_hierarquico,
        p.is_active,
        p.created_at
    FROM rh.positions p
    WHERE (company_id_param IS NULL OR p.company_id::text = company_id_param)
    ORDER BY p.nome
    LIMIT limit_param
    OFFSET offset_param;
END;
$$;

-- 6. Adicionar funções CRUD para positions
CREATE OR REPLACE FUNCTION insert_position(
    position_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_id uuid;
BEGIN
    INSERT INTO rh.positions (
        company_id,
        codigo,
        nome,
        descricao,
        nivel_hierarquico,
        is_active
    ) VALUES (
        (position_data->>'company_id')::uuid,
        (position_data->>'codigo'),
        (position_data->>'nome'),
        (position_data->>'descricao'),
        COALESCE((position_data->>'nivel_hierarquico')::integer, 1),
        COALESCE((position_data->>'is_active')::boolean, true)
    ) RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_position(
    position_id uuid,
    position_data jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE rh.positions SET
        company_id = COALESCE((position_data->>'company_id')::uuid, company_id),
        codigo = COALESCE((position_data->>'codigo'), codigo),
        nome = COALESCE((position_data->>'nome'), nome),
        descricao = COALESCE((position_data->>'descricao'), descricao),
        nivel_hierarquico = COALESCE((position_data->>'nivel_hierarquico')::integer, nivel_hierarquico),
        is_active = COALESCE((position_data->>'is_active')::boolean, is_active)
    WHERE id = position_id;
    
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION delete_position(
    position_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM rh.positions WHERE id = position_id;
    RETURN FOUND;
END;
$$;

-- 7. Conceder permissões para executar as funções corrigidas
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

GRANT EXECUTE ON FUNCTION insert_position TO anon;
GRANT EXECUTE ON FUNCTION insert_position TO authenticated;
GRANT EXECUTE ON FUNCTION insert_position TO service_role;
GRANT EXECUTE ON FUNCTION insert_position TO public;

GRANT EXECUTE ON FUNCTION update_position TO anon;
GRANT EXECUTE ON FUNCTION update_position TO authenticated;
GRANT EXECUTE ON FUNCTION update_position TO service_role;
GRANT EXECUTE ON FUNCTION update_position TO public;

GRANT EXECUTE ON FUNCTION delete_position TO anon;
GRANT EXECUTE ON FUNCTION delete_position TO authenticated;
GRANT EXECUTE ON FUNCTION delete_position TO service_role;
GRANT EXECUTE ON FUNCTION delete_position TO public;

