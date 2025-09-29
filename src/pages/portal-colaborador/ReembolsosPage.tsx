import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Plus, FileText, Calendar, AlertCircle, CheckCircle, XCircle, Upload } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeiroSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const ReembolsosPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Estados do formulário
  const [formData, setFormData] = useState({
    dataDespesa: '',
    valor: 0,
    descricao: '',
    categoria: '',
    observacoes: ''
  });

  // Buscar reembolsos do colaborador
  const { data: reembolsos, isLoading } = useQuery({
    queryKey: ['reembolsos', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await financeiroSupabase
        .from('reimbursement_requests')
        .select('*')
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Mutation para criar nova solicitação de reembolso
  const createReembolsoMutation = useMutation({
    mutationFn: async (data: any) => {
      let arquivoUrl = null;
      
      // Upload do arquivo se selecionado
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user?.id}_${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await financeiroSupabase.storage
          .from('reimbursement-documents')
          .upload(fileName, selectedFile);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = financeiroSupabase.storage
          .from('reimbursement-documents')
          .getPublicUrl(fileName);
        
        arquivoUrl = urlData.publicUrl;
      }

      const { error } = await financeiroSupabase
        .from('reimbursement_requests')
        .insert([{
          company_id: user?.id,
          employee_id: user?.id,
          data_despesa: data.dataDespesa,
          valor: data.valor,
          descricao: data.descricao,
          categoria: data.categoria,
          arquivo_comprovante: arquivoUrl,
          status: 'pendente',
          observacoes: data.observacoes
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Solicitação enviada!",
        description: "Sua solicitação de reembolso foi enviada para aprovação.",
      });
      queryClient.invalidateQueries({ queryKey: ['reembolsos', user?.id] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      dataDespesa: '',
      valor: 0,
      descricao: '',
      categoria: '',
      observacoes: ''
    });
    setSelectedFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.dataDespesa || !formData.valor || !formData.descricao || !formData.categoria) {
      toast({
        title: "Dados inválidos",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (formData.valor <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "Comprovante obrigatório",
        description: "Por favor, anexe o comprovante da despesa.",
        variant: "destructive",
      });
      return;
    }

    createReembolsoMutation.mutate(formData);
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

  const categorias = [
    'Alimentação',
    'Transporte',
    'Hospedagem',
    'Combustível',
    'Estacionamento',
    'Telefone',
    'Internet',
    'Material de Escritório',
    'Treinamento/Cursos',
    'Equipamentos',
    'Outros'
  ];

  // Estatísticas
  const estatisticas = {
    total: reembolsos?.length || 0,
    pendentes: reembolsos?.filter(r => r.status === 'pendente').length || 0,
    aprovados: reembolsos?.filter(r => r.status === 'aprovado').length || 0,
    valorTotal: reembolsos?.reduce((acc, r) => acc + (r.status === 'aprovado' ? r.valor : 0), 0) || 0
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitações de Reembolso</h1>
          <p className="text-gray-600">Solicite reembolsos de despesas relacionadas ao trabalho</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nova Solicitação</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Nova Solicitação de Reembolso</span>
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataDespesa">Data da Despesa</Label>
                  <Input
                    id="dataDespesa"
                    type="date"
                    value={formData.dataDespesa}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataDespesa: e.target.value }))}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Select 
                  value={formData.categoria} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
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

              <div>
                <Label htmlFor="descricao">Descrição da Despesa</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva detalhadamente a despesa..."
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="arquivo">Anexar Comprovante</Label>
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

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Processo de Aprovação</h4>
                    <p className="text-sm text-yellow-800 mt-1">
                      Após a aprovação do seu gestor, o reembolso será processado e 
                      integrado ao sistema de contas a pagar da empresa.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createReembolsoMutation.isPending}>
                  {createReembolsoMutation.isPending ? 'Enviando...' : 'Enviar Solicitação'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Solicitações</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.total}</div>
            <p className="text-xs text-muted-foreground">
              Solicitações enviadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{estatisticas.pendentes}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estatisticas.aprovados}</div>
            <p className="text-xs text-muted-foreground">
              Reembolsos aprovados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {estatisticas.valorTotal.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor aprovado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Reembolsos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Histórico de Solicitações</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando solicitações...</p>
            </div>
          ) : reembolsos && reembolsos.length > 0 ? (
            <div className="space-y-4">
              {reembolsos.map((reembolso) => (
                <div key={reembolso.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <div>
                        <h3 className="font-medium">
                          {reembolso.categoria} - R$ {reembolso.valor.toFixed(2)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(reembolso.data_despesa).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(reembolso.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Valor</p>
                      <p className="font-medium">R$ {reembolso.valor.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Categoria</p>
                      <p className="font-medium">{reembolso.categoria}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Solicitado em</p>
                      <p className="font-medium">
                        {new Date(reembolso.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Comprovante</p>
                      <p className="font-medium">
                        {reembolso.arquivo_comprovante ? (
                          <a 
                            href={reembolso.arquivo_comprovante} 
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
                  
                  <div className="mt-3 text-sm text-gray-600">
                    <p><strong>Descrição:</strong> {reembolso.descricao}</p>
                    {reembolso.observacoes && (
                      <p className="mt-1"><strong>Observações:</strong> {reembolso.observacoes}</p>
                    )}
                  </div>
                  
                  {reembolso.data_aprovacao && (
                    <div className="mt-3 text-sm text-gray-600">
                      <p>
                        <strong>
                          {reembolso.status === 'aprovado' ? 'Aprovado' : 'Processado'} em:
                        </strong> {new Date(reembolso.data_aprovacao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma solicitação encontrada
              </h3>
              <p className="text-gray-600">
                Você ainda não fez nenhuma solicitação de reembolso.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações Importantes */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Informações Importantes</h3>
              <ul className="text-sm text-blue-800 mt-1 space-y-1">
                <li>• Anexe sempre o comprovante original da despesa</li>
                <li>• Solicitações serão analisadas pelo seu gestor</li>
                <li>• Reembolsos aprovados são integrados às contas a pagar</li>
                <li>• Mantenha os comprovantes por até 5 anos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReembolsosPage;
