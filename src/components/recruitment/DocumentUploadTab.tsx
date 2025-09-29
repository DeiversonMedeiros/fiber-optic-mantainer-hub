import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Search, 
  Filter, 
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  Send,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentUpload {
  id: string;
  candidate_name: string;
  candidate_email: string;
  job_position: string;
  documents_count: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  upload_link: string;
  expires_at: string;
  created_at: string;
  status: string;
}

interface DocumentUploadTabProps {
  companyId: string;
}

const DocumentUploadTab: React.FC<DocumentUploadTabProps> = ({ companyId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'expirado' | 'usado'>('all');
  const [selectedUpload, setSelectedUpload] = useState<DocumentUpload | null>(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showGenerateLinkModal, setShowGenerateLinkModal] = useState(false);
  
  const { toast } = useToast();

  // Mock data - substituir por dados reais do banco
  const mockUploads: DocumentUpload[] = [
    {
      id: '1',
      candidate_name: 'Ana Silva',
      candidate_email: 'ana.silva@email.com',
      job_position: 'Desenvolvedor Frontend',
      documents_count: 12,
      pending_count: 3,
      approved_count: 8,
      rejected_count: 1,
      upload_link: 'https://empresa.com/upload/abc123',
      expires_at: '2024-02-15',
      created_at: '2024-01-15',
      status: 'ativo'
    },
    {
      id: '2',
      candidate_name: 'Carlos Santos',
      candidate_email: 'carlos.santos@email.com',
      job_position: 'Analista de RH',
      documents_count: 10,
      pending_count: 2,
      approved_count: 7,
      rejected_count: 1,
      upload_link: 'https://empresa.com/upload/def456',
      expires_at: '2024-01-30',
      created_at: '2024-01-10',
      status: 'expirado'
    },
    {
      id: '3',
      candidate_name: 'Mariana Costa',
      candidate_email: 'mariana.costa@email.com',
      job_position: 'Gerente de Projetos',
      documents_count: 15,
      pending_count: 0,
      approved_count: 14,
      rejected_count: 1,
      upload_link: 'https://empresa.com/upload/ghi789',
      expires_at: '2024-01-25',
      created_at: '2024-01-05',
      status: 'usado'
    }
  ];

  const filteredUploads = mockUploads.filter(upload => {
    const matchesSearch = upload.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         upload.candidate_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         upload.job_position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || upload.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'expirado':
        return <Badge className="bg-red-100 text-red-800">Expirado</Badge>;
      case 'usado':
        return <Badge className="bg-blue-100 text-blue-800">Usado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Desconhecido</Badge>;
    }
  };

  const handleViewDocuments = (upload: DocumentUpload) => {
    setSelectedUpload(upload);
    setShowDocumentsModal(true);
  };

  const handleGenerateLink = (candidateId: string) => {
    toast({
      title: "Link Gerado",
      description: "Novo link de upload foi gerado e enviado ao candidato",
      variant: "default"
    });
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copiado",
      description: "Link copiado para a área de transferência",
      variant: "default"
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por candidato ou vaga..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="expirado">Expirados</SelectItem>
                  <SelectItem value="usado">Usados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setShowGenerateLinkModal(true)}>
              <Send className="h-4 w-4 mr-2" />
              Gerar Novo Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Uploads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Links de Upload ({filteredUploads.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUploads.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum link de upload encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUploads.map((upload) => (
                <Card key={upload.id} className={`border-l-4 ${
                  upload.status === 'ativo' ? 'border-l-green-400' : 
                  upload.status === 'expirado' ? 'border-l-red-400' : 
                  'border-l-blue-400'
                }`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{upload.candidate_name}</h3>
                          {getStatusBadge(upload.status)}
                          {isExpired(upload.expires_at) && upload.status === 'ativo' && (
                            <Badge className="bg-orange-100 text-orange-800">Expirado</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Vaga: {upload.job_position}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Expira: {formatDate(upload.expires_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>Documentos: {upload.documents_count}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            <span>Pendentes: {upload.pending_count}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>Aprovados: {upload.approved_count}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span>Rejeitados: {upload.rejected_count}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocuments(upload)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Documentos
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(upload.upload_link)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Copiar Link
                        </Button>
                        {upload.status === 'expirado' && (
                          <Button
                            size="sm"
                            onClick={() => handleGenerateLink(upload.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Renovar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Documentos */}
      {showDocumentsModal && selectedUpload && (
        <DocumentsModal
          upload={selectedUpload}
          onClose={() => setShowDocumentsModal(false)}
          onApprove={(documentId: string) => {
            toast({
              title: "Documento Aprovado",
              description: "Documento foi aprovado com sucesso",
              variant: "default"
            });
          }}
          onReject={(documentId: string, reason: string) => {
            toast({
              title: "Documento Rejeitado",
              description: "Documento foi rejeitado",
              variant: "destructive"
            });
          }}
        />
      )}
    </div>
  );
};

// Modal de Documentos
const DocumentsModal: React.FC<{
  upload: DocumentUpload;
  onClose: () => void;
  onApprove: (documentId: string) => void;
  onReject: (documentId: string, reason: string) => void;
}> = ({ upload, onClose, onApprove, onReject }) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  // Mock documents - substituir por dados reais
  const mockDocuments = [
    {
      id: '1',
      document_type: 'cpf',
      document_name: 'CPF',
      status: 'aprovado',
      uploaded_at: '2024-01-15',
      file_path: '/documents/cpf.pdf'
    },
    {
      id: '2',
      document_type: 'rg_cnh',
      document_name: 'RG',
      status: 'aprovado',
      uploaded_at: '2024-01-15',
      file_path: '/documents/rg.pdf'
    },
    {
      id: '3',
      document_type: 'comprovante_residencia',
      document_name: 'Comprovante de Residência',
      status: 'pendente',
      uploaded_at: '2024-01-16',
      file_path: '/documents/residencia.pdf'
    },
    {
      id: '4',
      document_type: 'comprovante_escolaridade',
      document_name: 'Comprovante de Escolaridade',
      status: 'reprovado',
      uploaded_at: '2024-01-16',
      file_path: '/documents/escolaridade.pdf',
      rejection_reason: 'Documento ilegível'
    }
  ];

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'aprovado':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'reprovado':
        return <Badge className="bg-red-100 text-red-800">Reprovado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Desconhecido</Badge>;
    }
  };

  const handleRejectDocument = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setShowRejectModal(true);
  };

  const handleConfirmReject = () => {
    if (selectedDocumentId && rejectionReason.trim()) {
      onReject(selectedDocumentId, rejectionReason);
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedDocumentId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos de {upload.candidate_name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockDocuments.map((document) => (
              <Card key={document.id} className="border-l-4 border-l-gray-400">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{document.document_name}</h3>
                        {getDocumentStatusBadge(document.status)}
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Enviado em: {new Date(document.uploaded_at).toLocaleDateString('pt-BR')}</p>
                        {document.rejection_reason && (
                          <p className="text-red-600 mt-1">
                            <strong>Motivo da rejeição:</strong> {document.rejection_reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Visualizar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      {document.status === 'pendente' && (
                        <>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectDocument(document.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => onApprove(document.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Rejeição */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle>Motivo da Rejeição</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Por favor, informe o motivo da rejeição:</label>
                <textarea
                  placeholder="Informe o motivo da rejeição..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full mt-2 p-3 border rounded-lg resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmReject}
                  disabled={!rejectionReason.trim()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Rejeitar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Geração de Link */}
      {showGenerateLinkModal && (
        <GenerateLinkModal
          companyId={companyId}
          onClose={() => setShowGenerateLinkModal(false)}
          onSuccess={(linkData) => {
            setShowGenerateLinkModal(false);
            toast({
              title: "Link Gerado",
              description: `Link criado para ${linkData.candidate_name}. Expira em ${new Date(linkData.expires_at).toLocaleDateString('pt-BR')}`,
              variant: "default"
            });
          }}
        />
      )}
    </div>
  );
};

// Modal de Geração de Link
const GenerateLinkModal: React.FC<{
  companyId: string;
  onClose: () => void;
  onSuccess: (linkData: any) => void;
}> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    candidate_id: '',
    job_opening_id: '',
    expires_days: 30,
    custom_message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data para candidatos e vagas
  const mockCandidates = [
    { id: '1', name: 'Ana Silva', email: 'ana.silva@email.com' },
    { id: '2', name: 'Carlos Santos', email: 'carlos.santos@email.com' },
    { id: '3', name: 'Mariana Costa', email: 'mariana.costa@email.com' }
  ];

  const mockJobOpenings = [
    { id: '1', name: 'Desenvolvedor Frontend' },
    { id: '2', name: 'Analista de RH' },
    { id: '3', name: 'Gerente de Projetos' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Aqui você implementaria a chamada para a API
      // const linkData = await generateUploadLink({ ...formData, company_id: companyId });
      
      // Simular delay da API e dados de retorno
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockLinkData = {
        candidate_name: mockCandidates.find(c => c.id === formData.candidate_id)?.name || 'Candidato',
        expires_at: new Date(Date.now() + formData.expires_days * 24 * 60 * 60 * 1000).toISOString(),
        upload_link: `https://empresa.com/upload/${Math.random().toString(36).substr(2, 9)}`
      };
      
      onSuccess(mockLinkData);
    } catch (error) {
      console.error('Erro ao gerar link:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Gerar Link de Upload de Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Informações sobre o Link</h4>
              <p className="text-sm text-blue-700">
                Este link permitirá que o candidato faça upload dos documentos necessários para contratação. 
                O link será enviado por email e terá validade limitada.
              </p>
            </div>

            <div>
              <Label htmlFor="candidate_id">Candidato *</Label>
              <Select value={formData.candidate_id} onValueChange={(value) => setFormData({ ...formData, candidate_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um candidato" />
                </SelectTrigger>
                <SelectContent>
                  {mockCandidates.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      {candidate.name} - {candidate.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="job_opening_id">Vaga *</Label>
              <Select value={formData.job_opening_id} onValueChange={(value) => setFormData({ ...formData, job_opening_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma vaga" />
                </SelectTrigger>
                <SelectContent>
                  {mockJobOpenings.map((opening) => (
                    <SelectItem key={opening.id} value={opening.id}>
                      {opening.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="expires_days">Validade do Link (dias) *</Label>
              <Select value={formData.expires_days.toString()} onValueChange={(value) => setFormData({ ...formData, expires_days: parseInt(value) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="15">15 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="60">60 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="custom_message">Mensagem Personalizada</Label>
              <Textarea
                id="custom_message"
                value={formData.custom_message}
                onChange={(e) => setFormData({ ...formData, custom_message: e.target.value })}
                rows={3}
                placeholder="Mensagem adicional que será enviada junto com o link..."
              />
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Documentos Obrigatórios</h4>
              <div className="text-sm text-yellow-700 space-y-1">
                <p>• Carteira de Trabalho Digital</p>
                <p>• RG ou CNH</p>
                <p>• CPF</p>
                <p>• Título de Eleitor</p>
                <p>• Comprovante de Residência</p>
                <p>• Comprovante de Escolaridade</p>
                <p>• E outros documentos conforme necessário</p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.candidate_id || !formData.job_opening_id}>
                {isSubmitting ? "Gerando..." : "Gerar Link"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentUploadTab;
