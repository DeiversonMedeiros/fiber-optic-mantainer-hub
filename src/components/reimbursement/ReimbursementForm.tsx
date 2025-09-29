import React, { useState } from 'react';
import { useReimbursementReceiptUpload } from '@/hooks/useReimbursementUpload';
import { ReimbursementFileUpload } from './ReimbursementFileUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveCompany } from '@/hooks/useActiveCompany';

interface ReimbursementFormData {
  data_despesa: Date;
  valor: string;
  descricao: string;
  categoria: string;
  observacoes?: string;
}

export function ReimbursementForm() {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const [formData, setFormData] = useState<ReimbursementFormData>({
    data_despesa: new Date(),
    valor: '',
    descricao: '',
    categoria: '',
    observacoes: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (field: keyof ReimbursementFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFilesUploaded = (files: any[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleFileRemoved = (filePath: string) => {
    setUploadedFiles(prev => prev.filter(file => file.path !== filePath));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !activeCompany) {
      alert('Usuário ou empresa não identificados');
      return;
    }

    if (!formData.descricao || !formData.valor || !formData.categoria) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setSubmitting(true);

    try {
      // Preparar dados do reembolso
      const reimbursementData = {
        company_id: activeCompany.id,
        employee_id: user.id,
        data_despesa: formData.data_despesa.toISOString().split('T')[0],
        valor: parseFloat(formData.valor),
        descricao: formData.descricao,
        categoria: formData.categoria,
        observacoes: formData.observacoes || null,
        arquivo_comprovante: uploadedFiles.length > 0 ? uploadedFiles[0].url : null, // Por enquanto, apenas o primeiro arquivo
        status: 'pending',
        created_by: user.id
      };

      // Inserir reembolso no banco
      const { data: reimbursement, error } = await supabase
        .from('financeiro.reimbursement_requests')
        .insert([reimbursementData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar reembolso:', error);
        alert('Erro ao criar solicitação de reembolso: ' + error.message);
        return;
      }

      console.log('✅ Reembolso criado com sucesso:', reimbursement);
      alert('Solicitação de reembolso criada com sucesso!');

      // Limpar formulário
      setFormData({
        data_despesa: new Date(),
        valor: '',
        descricao: '',
        categoria: '',
        observacoes: ''
      });
      setUploadedFiles([]);

    } catch (error) {
      console.error('Erro ao processar formulário:', error);
      alert('Erro ao processar solicitação de reembolso');
    } finally {
      setSubmitting(false);
    }
  };

  const categorias = [
    'Alimentação',
    'Transporte',
    'Hospedagem',
    'Combustível',
    'Material de Escritório',
    'Telefone/Internet',
    'Outros'
  ];

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Solicitação de Reembolso
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Data da Despesa */}
          <div className="space-y-2">
            <Label htmlFor="data_despesa">Data da Despesa *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.data_despesa && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.data_despesa ? (
                    format(formData.data_despesa, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.data_despesa}
                  onSelect={(date) => date && handleInputChange('data_despesa', date)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$) *</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={formData.valor}
              onChange={(e) => handleInputChange('valor', e.target.value)}
              required
            />
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria *</Label>
            <Select
              value={formData.categoria}
              onValueChange={(value) => handleInputChange('categoria', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição da Despesa *</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva detalhadamente a despesa..."
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              required
              rows={3}
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Informações adicionais (opcional)..."
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              rows={2}
            />
          </div>

          {/* Upload de Comprovantes */}
          {user && (
            <div className="space-y-2">
              <Label>Comprovantes *</Label>
              <ReimbursementFileUpload
                userId={user.id}
                onFilesUploaded={handleFilesUploaded}
                onFileRemoved={handleFileRemoved}
                maxFiles={3}
                disabled={submitting}
              />
            </div>
          )}

          {/* Botão de Envio */}
          <Button
            type="submit"
            className="w-full"
            disabled={submitting || !user || !activeCompany}
          >
            {submitting ? 'Enviando...' : 'Enviar Solicitação'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
