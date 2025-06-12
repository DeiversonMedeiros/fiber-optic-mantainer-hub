
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus, CheckSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ReportTemplateModal from './ReportTemplateModal';

const ReportTemplatesSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['report-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_templates')
        .select(`
          *,
          user_classes (
            id,
            name
          ),
          checklist_class:user_classes!checklist_class_id (
            id,
            name
          )
        `)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('report_templates')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      toast({
        title: "Template excluído",
        description: "O template de relatório foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o template de relatório.",
        variant: "destructive",
      });
    }
  });

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedTemplate(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este template de relatório?')) {
      deleteTemplateMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Carregando templates de relatório...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Templates de Relatório</h2>
          <p className="text-gray-600">Gerencie os modelos de relatório com campos customizáveis</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Criar Novo Template
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Classe Vinculada</TableHead>
                <TableHead>Checklist</TableHead>
                <TableHead>Campos</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates?.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell className="text-gray-600">{template.description}</TableCell>
                  <TableCell>
                    {template.user_classes ? (
                      <Badge variant="outline">{template.user_classes.name}</Badge>
                    ) : (
                      <span className="text-gray-400">Não definido</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {template.checklist_enabled ? (
                        <>
                          <CheckSquare className="w-4 h-4 text-green-600" />
                          <span className="text-sm">
                            {template.checklist_class?.name || 'Ativo'}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400 text-sm">Desabilitado</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {Array.isArray(template.fields) ? template.fields.length : 0} campos
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(template.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ReportTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        template={selectedTemplate}
      />
    </div>
  );
};

export default ReportTemplatesSection;
