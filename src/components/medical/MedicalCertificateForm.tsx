import React, { useState } from 'react';
import { useMedicalCertificateUpload } from '@/hooks/useMedicalCertificateUpload';
import { MedicalCertificateUpload } from './MedicalCertificateUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Stethoscope, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveCompany } from '@/hooks/useActiveCompany';

interface MedicalCertificateFormData {
  data_inicio: Date;
  data_fim: Date;
  dias_afastamento: number;
  cid: string;
  tipo: string;
}

export function MedicalCertificateForm() {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const [formData, setFormData] = useState<MedicalCertificateFormData>({
    data_inicio: new Date(),
    data_fim: new Date(),
    dias_afastamento: 1,
    cid: '',
    tipo: 'Atestado Médico'
  });
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (field: keyof MedicalCertificateFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Calcular dias automaticamente quando as datas mudarem
    if (field === 'data_inicio' || field === 'data_fim') {
      const inicio = field === 'data_inicio' ? value : prev.data_inicio;
      const fim = field === 'data_fim' ? value : prev.data_fim;
      
      if (inicio && fim) {
        const diffTime = Math.abs(fim.getTime() - inicio.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setFormData(prev => ({
          ...prev,
          [field]: value,
          dias_afastamento: diffDays
        }));
      }
    }
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

    if (!formData.cid || uploadedFiles.length === 0) {
      alert('Por favor, preencha o CID e anexe pelo menos um atestado médico');
      return;
    }

    if (formData.data_fim < formData.data_inicio) {
      alert('A data de fim não pode ser anterior à data de início');
      return;
    }

    setSubmitting(true);

    try {
      // Preparar dados do atestado médico
      const certificateData = {
        company_id: activeCompany.id,
        employee_id: user.id,
        data_inicio: formData.data_inicio.toISOString().split('T')[0],
        data_fim: formData.data_fim.toISOString().split('T')[0],
        dias_afastamento: formData.dias_afastamento,
        cid: formData.cid,
        tipo: formData.tipo,
        arquivo_anexo: uploadedFiles.length > 0 ? uploadedFiles[0].url : null,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      // Inserir atestado médico no banco
      const { data: certificate, error } = await supabase
        .from('rh.medical_certificates')
        .insert([certificateData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar atestado médico:', error);
        alert('Erro ao criar solicitação de atestado médico: ' + error.message);
        return;
      }

      // Criar registro de ausência relacionado
      const absenceData = {
        company_id: activeCompany.id,
        employee_id: user.id,
        absence_type_id: null, // Será preenchido pelo sistema
        start_date: formData.data_inicio.toISOString().split('T')[0],
        end_date: formData.data_fim.toISOString().split('T')[0],
        total_days: formData.dias_afastamento,
        reason: `Atestado médico - CID: ${formData.cid}`,
        medical_certificate_url: uploadedFiles.length > 0 ? uploadedFiles[0].url : null,
        status: 'pending',
        is_active: true,
        created_by: user.id
      };

      const { error: absenceError } = await supabase
        .from('rh.employee_absences')
        .insert([absenceData]);

      if (absenceError) {
        console.error('Erro ao criar ausência:', absenceError);
        // Não falha o processo, apenas loga o erro
      }

      console.log('✅ Atestado médico criado com sucesso:', certificate);
      alert('Solicitação de atestado médico enviada com sucesso!');

      // Limpar formulário
      setFormData({
        data_inicio: new Date(),
        data_fim: new Date(),
        dias_afastamento: 1,
        cid: '',
        tipo: 'Atestado Médico'
      });
      setUploadedFiles([]);

    } catch (error) {
      console.error('Erro ao processar formulário:', error);
      alert('Erro ao processar solicitação de atestado médico');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Stethoscope className="h-5 w-5 mr-2" />
          Solicitação de Atestado Médico
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Período de Afastamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data de Início */}
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data de Início *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.data_inicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.data_inicio ? (
                      format(formData.data_inicio, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.data_inicio}
                    onSelect={(date) => date && handleInputChange('data_inicio', date)}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data de Fim */}
            <div className="space-y-2">
              <Label htmlFor="data_fim">Data de Fim *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.data_fim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.data_fim ? (
                      format(formData.data_fim, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.data_fim}
                    onSelect={(date) => date && handleInputChange('data_fim', date)}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Dias de Afastamento */}
          <div className="space-y-2">
            <Label htmlFor="dias_afastamento">Dias de Afastamento</Label>
            <Input
              id="dias_afastamento"
              type="number"
              min="1"
              value={formData.dias_afastamento}
              onChange={(e) => handleInputChange('dias_afastamento', parseInt(e.target.value) || 1)}
              readOnly
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">
              Calculado automaticamente baseado nas datas selecionadas
            </p>
          </div>

          {/* CID */}
          <div className="space-y-2">
            <Label htmlFor="cid">CID (Código Internacional de Doenças) *</Label>
            <Input
              id="cid"
              placeholder="Ex: A00.0, F32.9, etc."
              value={formData.cid}
              onChange={(e) => handleInputChange('cid', e.target.value.toUpperCase())}
              required
            />
            <p className="text-xs text-gray-500">
              Código fornecido pelo médico no atestado
            </p>
          </div>

          {/* Tipo de Atestado */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Atestado</Label>
            <Input
              id="tipo"
              value={formData.tipo}
              onChange={(e) => handleInputChange('tipo', e.target.value)}
            />
          </div>

          {/* Upload de Atestados */}
          {user && (
            <div className="space-y-2">
              <Label>Atestados Médicos *</Label>
              <MedicalCertificateUpload
                userId={user.id}
                onFilesUploaded={handleFilesUploaded}
                onFileRemoved={handleFileRemoved}
                maxFiles={2}
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
