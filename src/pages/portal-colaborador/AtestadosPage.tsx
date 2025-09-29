import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, Plus, FileText, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const AtestadosPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Estados do formulário
  const [formData, setFormData] = useState({
    dataInicio: '',
    dataFim: '',
    diasAfastamento: 0,
    cid: '',
    tipo: '',
    observacoes: ''
  });

  // Buscar atestados do colaborador
  const { data: atestados, isLoading } = useQuery({
    queryKey: ['atestados', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await rhSupabase
        .from('medical_certificates')
        .select('*')
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Buscar códigos CID disponíveis
  const { data: codigosCid } = useQuery({
    queryKey: ['codigos-cid'],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('cid_codes')
        .select('codigo, descricao')
        .eq('is_active', true)
        .order('codigo');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Mutation para criar novo atestado
  const createAtestadoMutation = useMutation({
    mutationFn: async (data: any) => {
      let arquivoUrl = null;
      
      // Upload do arquivo se selecionado
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user?.id}_${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await rhSupabase.storage
          .from('medical-certificates')
          .upload(fileName, selectedFile);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = rhSupabase.storage
          .from('medical-certificates')
          .getPublicUrl(fileName);
        
        arquivoUrl = urlData.publicUrl;
      }

      const { error } = await rhSupabase
        .from('medical_certificates')
        .insert([{
          company_id: user?.id, // Assumindo que o company_id é o mesmo do user
          employee_id: user?.id,
          data_inicio: data.dataInicio,
          data_fim: data.dataFim,
          dias_afastamento: data.diasAfastamento,
          cid: data.cid,
          tipo: data.tipo,
          arquivo_anexo: arquivoUrl,
          status: 'pendente'
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Atestado enviado!",
        description: "Seu atestado médico foi enviado para aprovação.",
      });
      queryClient.invalidateQueries({ queryKey: ['atestados', user?.id] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar atestado",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      dataInicio: '',
      dataFim: '',
      diasAfastamento: 0,
      cid: '',
      tipo: '',
      observacoes: ''
    });
    setSelectedFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.dataInicio || !formData.dataFim || !formData.tipo) {
      toast({
        title: "Dados inválidos",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "Arquivo obrigatório",
        description: "Por favor, anexe o atestado médico.",
        variant: "destructive",
      });
      return;
    }

    createAtestadoMutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Por favor, selecione um arquivo PDF, JPG ou PNG.",
          variant: "destructive",
        });
        return;
      }
      
      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const calculateDays = () => {
    if (formData.dataInicio && formData.dataFim) {
      const startDate = new Date(formData.dataInicio);
      const endDate = new Date(formData.dataFim);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setFormData(prev => ({ ...prev, diasAfastamento: diffDays }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'rejeitado':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atestados Médicos</h1>
          <p className="text-gray-600">Envie e acompanhe seus atestados médicos</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Enviar Atestado</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Novo Atestado Médico</span>
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataInicio">Data de Início do Afastamento</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataInicio: e.target.value }))}
                    onBlur={calculateDays}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="dataFim">Data de Fim do Afastamento</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={formData.dataFim}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataFim: e.target.value }))}
                    onBlur={calculateDays}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="diasAfastamento">Dias de Afastamento</Label>
                  <Input
                    id="diasAfastamento"
                    type="number"
                    min="1"
                    value={formData.diasAfastamento}
                    onChange={(e) => setFormData(prev => ({ ...prev, diasAfastamento: parseInt(e.target.value) || 0 }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="tipo">Tipo de Atestado</Label>
                  <Select 
                    value={formData.tipo} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doenca">Doença</SelectItem>
                      <SelectItem value="acidente">Acidente</SelectItem>
                      <SelectItem value="licenca-medica">Licença Médica</SelectItem>
                      <SelectItem value="preventivo">Exame Preventivo</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="cid">Código CID (opcional)</Label>
                <Select 
                  value={formData.cid} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, cid: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o CID (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {codigosCid?.map((cid) => (
                      <SelectItem key={cid.codigo} value={cid.codigo}>
                        {cid.codigo} - {cid.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="arquivo">Anexar Atestado</Label>
                <Input
                  id="arquivo"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  required
                />
                <p className="text-sm text-gray-600 mt-1">
                  Formatos aceitos: PDF, JPG, PNG (máximo 5MB)
                </p>
                {selectedFile && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-800">
                      <FileText className="inline h-4 w-4 mr-1" />
                      {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Observações adicionais (opcional)"
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createAtestadoMutation.isPending}>
                  {createAtestadoMutation.isPending ? 'Enviando...' : 'Enviar Atestado'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Informações Importantes */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Informações Importantes</h3>
              <ul className="text-sm text-blue-800 mt-1 space-y-1">
                <li>• Atestados médicos devem ser enviados preferencialmente no mesmo dia do afastamento</li>
                <li>• Anexe sempre o atestado original ou uma cópia legível</li>
                <li>• O atestado será analisado pela equipe de RH</li>
                <li>• Você receberá notificação sobre o status da aprovação</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Atestados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Histórico de Atestados</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando atestados...</p>
            </div>
          ) : atestados && atestados.length > 0 ? (
            <div className="space-y-4">
              {atestados.map((atestado) => (
                <div key={atestado.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="font-medium capitalize">
                          {atestado.tipo} - {atestado.dias_afastamento} dias
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(atestado.data_inicio).toLocaleDateString()} até {new Date(atestado.data_fim).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(atestado.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Dias de Afastamento</p>
                      <p className="font-medium">{atestado.dias_afastamento}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">CID</p>
                      <p className="font-medium">{atestado.cid || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Enviado em</p>
                      <p className="font-medium">
                        {new Date(atestado.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Anexo</p>
                      <p className="font-medium">
                        {atestado.arquivo_anexo ? (
                          <a 
                            href={atestado.arquivo_anexo} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Visualizar
                          </a>
                        ) : (
                          'Não anexado'
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {atestado.observacoes && (
                    <div className="mt-3 text-sm text-gray-600">
                      <p><strong>Observações:</strong> {atestado.observacoes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum atestado encontrado
              </h3>
              <p className="text-gray-600">
                Você ainda não enviou nenhum atestado médico.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AtestadosPage;
