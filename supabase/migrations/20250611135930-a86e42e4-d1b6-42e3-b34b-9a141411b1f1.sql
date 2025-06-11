
-- Criar enum para tipos de usuário
CREATE TYPE public.user_role AS ENUM ('admin', 'tecnico', 'supervisor', 'gestor');

-- Criar enum para status de ordens de serviço
CREATE TYPE public.os_status AS ENUM ('pendente', 'em_andamento', 'concluida', 'cancelada');

-- Criar enum para tipos de manutenção
CREATE TYPE public.maintenance_type AS ENUM ('preventiva', 'corretiva', 'emergencial');

-- Criar enum para status de relatórios
CREATE TYPE public.report_status AS ENUM ('pendente', 'validado', 'rejeitado');

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'tecnico',
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de ordens de serviço
CREATE TABLE public.service_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  status os_status NOT NULL DEFAULT 'pendente',
  maintenance_type maintenance_type NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  priority INTEGER NOT NULL DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  scheduled_date DATE,
  completed_date DATE,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de relatórios
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_order_id UUID REFERENCES public.service_orders(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status report_status NOT NULL DEFAULT 'pendente',
  validated_by UUID REFERENCES public.profiles(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de materiais
CREATE TABLE public.materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  unit TEXT NOT NULL,
  unit_price DECIMAL(10,2),
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de consumo de materiais
CREATE TABLE public.material_consumption (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_order_id UUID REFERENCES public.service_orders(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.materials(id) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  used_by UUID REFERENCES public.profiles(id) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de riscos
CREATE TABLE public.risks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 5),
  status TEXT NOT NULL DEFAULT 'aberto',
  reported_by UUID REFERENCES public.profiles(id) NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de atividades do sistema (auditoria)
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Função para verificar se o usuário tem uma função específica
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, required_role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = required_role AND is_active = true
  );
$$;

-- Função para verificar se o usuário é admin ou gestor
CREATE OR REPLACE FUNCTION public.is_admin_or_manager(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role IN ('admin', 'gestor') AND is_active = true
  );
$$;

-- Políticas RLS para profiles
CREATE POLICY "Users can view their own profile and active users can view others"
ON public.profiles FOR SELECT
USING (
  id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_active = true)
);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Admins can insert new profiles"
ON public.profiles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para service_orders
CREATE POLICY "Users can view service orders"
ON public.service_orders FOR SELECT
USING (
  assigned_to = auth.uid() OR 
  created_by = auth.uid() OR
  public.is_admin_or_manager(auth.uid())
);

CREATE POLICY "Supervisors and admins can create service orders"
ON public.service_orders FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'supervisor') OR 
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'gestor')
);

CREATE POLICY "Assigned users and managers can update service orders"
ON public.service_orders FOR UPDATE
USING (
  assigned_to = auth.uid() OR 
  created_by = auth.uid() OR
  public.is_admin_or_manager(auth.uid())
);

-- Políticas RLS para reports
CREATE POLICY "Users can view reports they created or are assigned to validate"
ON public.reports FOR SELECT
USING (
  technician_id = auth.uid() OR
  validated_by = auth.uid() OR
  public.is_admin_or_manager(auth.uid())
);

CREATE POLICY "Technicians can create reports"
ON public.reports FOR INSERT
WITH CHECK (technician_id = auth.uid());

CREATE POLICY "Report owners and validators can update reports"
ON public.reports FOR UPDATE
USING (
  technician_id = auth.uid() OR
  validated_by = auth.uid() OR
  public.is_admin_or_manager(auth.uid())
);

-- Políticas RLS para materials
CREATE POLICY "All active users can view materials"
ON public.materials FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_active = true));

CREATE POLICY "Admins and managers can manage materials"
ON public.materials FOR ALL
USING (public.is_admin_or_manager(auth.uid()));

-- Políticas RLS para material_consumption
CREATE POLICY "Users can view material consumption"
ON public.material_consumption FOR SELECT
USING (
  used_by = auth.uid() OR
  public.is_admin_or_manager(auth.uid())
);

CREATE POLICY "Users can record material consumption"
ON public.material_consumption FOR INSERT
WITH CHECK (used_by = auth.uid());

-- Políticas RLS para risks
CREATE POLICY "Users can view risks"
ON public.risks FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_active = true));

CREATE POLICY "Users can create risks"
ON public.risks FOR INSERT
WITH CHECK (reported_by = auth.uid());

CREATE POLICY "Assigned users and managers can update risks"
ON public.risks FOR UPDATE
USING (
  reported_by = auth.uid() OR
  assigned_to = auth.uid() OR
  public.is_admin_or_manager(auth.uid())
);

-- Políticas RLS para activities
CREATE POLICY "Users can view their own activities, admins can view all"
ON public.activities FOR SELECT
USING (
  user_id = auth.uid() OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "System can insert activities"
ON public.activities FOR INSERT
WITH CHECK (true);

-- Trigger para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    'tecnico'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_service_orders
  BEFORE UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_reports
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_materials
  BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_risks
  BEFORE UPDATE ON public.risks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Inserir dados iniciais para demonstração
INSERT INTO public.materials (name, code, description, unit, unit_price, stock_quantity, min_stock) VALUES
('Cabo de Fibra Óptica SM 12F', 'CFO-SM-12F', 'Cabo de fibra óptica single mode 12 fibras', 'metro', 15.50, 1000, 100),
('Conector SC/APC', 'CONN-SC-APC', 'Conector SC/APC para fibra óptica', 'unidade', 8.75, 500, 50),
('Splice Protector', 'SP-40MM', 'Protetor de emenda 40mm', 'unidade', 2.30, 1000, 100),
('DIO 8 Portas', 'DIO-8P', 'Distribuidor Interno Óptico 8 portas', 'unidade', 120.00, 25, 5),
('Cordão Óptico SC/APC-SC/APC 3m', 'CO-SC-3M', 'Cordão óptico SC/APC para SC/APC 3 metros', 'unidade', 25.90, 200, 20);
