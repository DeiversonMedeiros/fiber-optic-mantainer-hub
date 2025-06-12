
-- Criar tabela para perfis de acesso
CREATE TABLE public.access_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para classes de usuário
CREATE TABLE public.user_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  access_profile_id UUID REFERENCES public.access_profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar enum para categorias de itens do checklist
CREATE TYPE public.checklist_category AS ENUM ('acessorios', 'cabos', 'caixas', 'servicos', 'outros');

-- Criar tabela para itens do checklist
CREATE TABLE public.checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category public.checklist_category NOT NULL,
  user_class_id UUID REFERENCES public.user_classes(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar enum para tipos de campo de relatório
CREATE TYPE public.report_field_type AS ENUM ('texto_curto', 'texto_longo', 'data', 'radio', 'checkbox', 'dropdown', 'upload', 'checklist');

-- Criar tabela para templates de relatório
CREATE TABLE public.report_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  user_class_id UUID REFERENCES public.user_classes(id) ON DELETE SET NULL,
  fields JSONB NOT NULL DEFAULT '[]',
  checklist_enabled BOOLEAN NOT NULL DEFAULT false,
  checklist_class_id UUID REFERENCES public.user_classes(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir alguns perfis de acesso padrão
INSERT INTO public.access_profiles (name, description, permissions) VALUES
('Técnico', 'Perfil para técnicos de campo', '{"dashboard": true, "reports": true, "service_orders": true}'),
('Administrador', 'Perfil com acesso total ao sistema', '{"dashboard": true, "reports": true, "service_orders": true, "settings": true, "users": true}'),
('Vistoriador', 'Perfil para vistoriadores', '{"dashboard": true, "reports": true}'),
('Gestor', 'Perfil para gestores', '{"dashboard": true, "reports": true, "service_orders": true, "analytics": true}'),
('Gestor Preventiva', 'Perfil para gestores de manutenção preventiva', '{"dashboard": true, "reports": true, "service_orders": true, "preventive": true}'),
('Controlador', 'Perfil para controladores', '{"dashboard": true, "reports": true, "control": true}');

-- Inserir algumas classes de usuário padrão
INSERT INTO public.user_classes (name, description, access_profile_id) 
SELECT 'Classe Técnico', 'Classe padrão para técnicos', id FROM public.access_profiles WHERE name = 'Técnico';

INSERT INTO public.user_classes (name, description, access_profile_id) 
SELECT 'Classe Administrador', 'Classe padrão para administradores', id FROM public.access_profiles WHERE name = 'Administrador';

-- Habilitar RLS nas tabelas
ALTER TABLE public.access_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS (apenas admins podem gerenciar configurações)
CREATE POLICY "Only admins can manage access profiles" ON public.access_profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage user classes" ON public.user_classes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage checklist items" ON public.checklist_items
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage report templates" ON public.report_templates
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para atualizar updated_at
CREATE TRIGGER handle_updated_at_access_profiles
  BEFORE UPDATE ON public.access_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_user_classes
  BEFORE UPDATE ON public.user_classes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_checklist_items
  BEFORE UPDATE ON public.checklist_items
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_report_templates
  BEFORE UPDATE ON public.report_templates
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
