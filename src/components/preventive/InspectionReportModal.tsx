
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface ScheduleItem {
  id: string;
  cable_number: string;
  client_site: string;
  scheduled_month: number;
  scheduled_year: number;
}

interface InspectionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: ScheduleItem | null;
  onSuccess: () => void;
}

const InspectionReportModal = ({ isOpen, onClose, schedule, onSuccess }: InspectionReportModalProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const { toast } = useToast();

  // Buscar template de "Relatório de Vistoria"
  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ['inspection-report-template'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .ilike('name', '%vistoria%')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!schedule
  });

  // Mutation para criar relatório
  const createReportMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não logado');

      const { error } = await supabase
        .from('reports')
        .insert({
          title: `Relatório de Vistoria - ${schedule?.cable_number}`,
          description: `Vistoria de ${schedule?.client_site}`,
          technician_id: user.user.id,
          template_id: template?.id || null,
          form_data: formData,
          service_order_id: schedule?.id, // Usar ID da programação como referência
          status: 'pendente'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Relatório enviado",
        description: "O relatório de vistoria foi enviado com sucesso",
      });
      onSuccess();
      onClose();
      setFormData({});
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar relatório",
        description: error.message,
        variant: "destructive",
      });
    }
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
    createReportMutation.mutate();
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
          <div className="p-4 text-center">Carregando template...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Relatório de Vistoria - {schedule?.cable_number}
          </DialogTitle>
        </DialogHeader>

        {!template ? (
          <div className="p-4 text-center text-muted-foreground">
            Template "Relatório de Vistoria" não encontrado. Verifique as configurações.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium mb-2">Informações da Vistoria</h4>
              <p className="text-sm text-muted-foreground">
                <strong>Cabo:</strong> {schedule?.cable_number}<br />
                <strong>Cliente/Site:</strong> {schedule?.client_site}<br />
                <strong>Período:</strong> {schedule?.scheduled_month}/{schedule?.scheduled_year}
              </p>
            </div>

            <div className="space-y-4">
              {Array.isArray(template.fields) && template.fields.map((field: any) => 
                renderField(field)
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createReportMutation.isPending}>
                {createReportMutation.isPending ? 'Enviando...' : 'Enviar Relatório'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InspectionReportModal;
