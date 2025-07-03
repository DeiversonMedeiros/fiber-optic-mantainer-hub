
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

interface Risk {
  id: string;
  risk_number: string | null;
  title: string;
}

interface RiskCompletionFormProps {
  isOpen: boolean;
  onClose: () => void;
  risk: Risk | null;
  onSubmit: (formData: any) => void;
  isLoading: boolean;
}

const RiskCompletionForm = ({ isOpen, onClose, risk, onSubmit, isLoading }: RiskCompletionFormProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Buscar template de relatório baseado na classe do usuário
  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ['user-report-template'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não logado');

      // Buscar perfil do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_class_id')
        .eq('id', user.user.id)
        .single();

      if (!profile?.user_class_id) return null;

      // Buscar template de relatório para a classe do usuário
      const { data: template, error } = await supabase
        .from('report_templates')
        .select('*')
        .eq('user_class_id', profile.user_class_id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return template;
    },
    enabled: isOpen && !!risk
  });

  useEffect(() => {
    if (template) {
      // Inicializar formData com valores padrão baseados nos campos do template
      const initialData: Record<string, any> = {};
      if (Array.isArray(template.fields)) {
        template.fields.forEach((field: any) => {
          switch (field.type) {
            case 'checkbox':
              initialData[field.name] = false;
              break;
            case 'radio':
            case 'dropdown':
              initialData[field.name] = '';
              break;
            default:
              initialData[field.name] = '';
          }
        });
      }
      setFormData(initialData);
    }
  }, [template]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const renderField = (field: any) => {
    switch (field.type) {
      case 'texto_curto':
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        );

      case 'texto_longo':
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>{field.label}</Label>
            <Textarea
              id={field.name}
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        );

      case 'data':
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              type="date"
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              required={field.required}
            />
          </div>
        );

      case 'dropdown':
        return (
          <div key={field.name}>
            <Label>{field.label}</Label>
            <Select
              value={formData[field.name] || ''}
              onValueChange={(value) => handleFieldChange(field.name, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'radio':
        return (
          <div key={field.name}>
            <Label>{field.label}</Label>
            <RadioGroup
              value={formData[field.name] || ''}
              onValueChange={(value) => handleFieldChange(field.name, value)}
            >
              {field.options?.map((option: string) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.name}-${option}`} />
                  <Label htmlFor={`${field.name}-${option}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.name} className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={formData[field.name] || false}
              onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
            />
            <Label htmlFor={field.name}>{field.label}</Label>
          </div>
        );

      default:
        return null;
    }
  };

  if (templateLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="p-4 text-center">Carregando formulário...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Concluir Risco: {risk?.risk_number}
          </DialogTitle>
        </DialogHeader>

        {!template ? (
          <div className="p-4 text-center text-muted-foreground">
            Nenhum template de formulário encontrado para sua classe de usuário.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              {Array.isArray(template.fields) && template.fields.map((field: any) => 
                renderField(field)
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Concluindo...' : 'Concluir Risco'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RiskCompletionForm;
