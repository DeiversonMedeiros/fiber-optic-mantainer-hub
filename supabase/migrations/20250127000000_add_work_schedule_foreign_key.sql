-- Adicionar foreign key entre employment_contracts.work_schedule_id e work_shifts.id
-- Esta migração corrige o relacionamento que estava faltando

-- Adicionar a foreign key constraint
ALTER TABLE rh.employment_contracts 
ADD CONSTRAINT employment_contracts_work_schedule_id_fkey 
FOREIGN KEY (work_schedule_id) REFERENCES rh.work_shifts(id) ON DELETE SET NULL;
