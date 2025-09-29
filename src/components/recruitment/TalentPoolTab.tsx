import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  UserPlus, 
  Search, 
  Filter, 
  Plus,
  Eye,
  Star,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Talent {
  id: string;
  candidate_name: string;
  candidate_email: string;
  skill_category: string;
  skill_level: string;
  experience_years: number;
  availability: string;
  interest_areas: string[];
  salary_expectation?: number;
  added_date: string;
  notes?: string;
  city?: string;
  state?: string;
}

interface TalentPoolTabProps {
  companyId: string;
}

const TalentPoolTab: React.FC<TalentPoolTabProps> = ({ companyId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState<'all' | 'tecnologia' | 'marketing' | 'vendas' | 'rh' | 'financeiro' | 'outro'>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | 'iniciante' | 'intermediario' | 'avancado' | 'especialista'>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'imediata' | '1_mes' | '3_meses' | '6_meses' | 'indisponivel'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { toast } = useToast();

  // Mock data - substituir por dados reais do banco
  const mockTalents: Talent[] = [
    {
      id: '1',
      candidate_name: 'Ana Silva',
      candidate_email: 'ana.silva@email.com',
      skill_category: 'tecnologia',
      skill_level: 'avancado',
      experience_years: 5,
      availability: '1_mes',
      interest_areas: ['React', 'Node.js', 'TypeScript'],
      salary_expectation: 8000,
      added_date: '2024-01-15',
      notes: 'Excelente desenvolvedora com experiência em startups',
      city: 'São Paulo',
      state: 'SP'
    },
    {
      id: '2',
      candidate_name: 'Carlos Santos',
      candidate_email: 'carlos.santos@email.com',
      skill_category: 'marketing',
      skill_level: 'especialista',
      experience_years: 8,
      availability: 'imediata',
      interest_areas: ['Digital Marketing', 'SEO', 'Analytics'],
      salary_expectation: 12000,
      added_date: '2024-01-14',
      city: 'Rio de Janeiro',
      state: 'RJ'
    },
    {
      id: '3',
      candidate_name: 'Mariana Costa',
      candidate_email: 'mariana.costa@email.com',
      skill_category: 'rh',
      skill_level: 'intermediario',
      experience_years: 3,
      availability: '3_meses',
      interest_areas: ['Recrutamento', 'Treinamento', 'Gestão de Pessoas'],
      salary_expectation: 6000,
      added_date: '2024-01-10',
      city: 'Belo Horizonte',
      state: 'MG'
    },
    {
      id: '4',
      candidate_name: 'Pedro Oliveira',
      candidate_email: 'pedro.oliveira@email.com',
      skill_category: 'vendas',
      skill_level: 'avancado',
      experience_years: 6,
      availability: 'indisponivel',
      interest_areas: ['Vendas B2B', 'Gestão de Equipes', 'CRM'],
      salary_expectation: 10000,
      added_date: '2024-01-08',
      notes: 'Atualmente empregado, mas aberto a oportunidades'
    }
  ];

  const filteredTalents = mockTalents.filter(talent => {
    const matchesSearch = talent.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         talent.candidate_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         talent.interest_areas.some(area => area.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSkill = skillFilter === 'all' || talent.skill_category === skillFilter;
    const matchesLevel = levelFilter === 'all' || talent.skill_level === levelFilter;
    const matchesAvailability = availabilityFilter === 'all' || talent.availability === availabilityFilter;
    return matchesSearch && matchesSkill && matchesLevel && matchesAvailability;
  });

  const getSkillLevelBadge = (level: string) => {
    switch (level) {
      case 'iniciante':
        return <Badge className="bg-blue-100 text-blue-800">Iniciante</Badge>;
      case 'intermediario':
        return <Badge className="bg-yellow-100 text-yellow-800">Intermediário</Badge>;
      case 'avancado':
        return <Badge className="bg-orange-100 text-orange-800">Avançado</Badge>;
      case 'especialista':
        return <Badge className="bg-purple-100 text-purple-800">Especialista</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">N/A</Badge>;
    }
  };

  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case 'imediata':
        return <Badge className="bg-green-100 text-green-800">Imediata</Badge>;
      case '1_mes':
        return <Badge className="bg-blue-100 text-blue-800">1 Mês</Badge>;
      case '3_meses':
        return <Badge className="bg-yellow-100 text-yellow-800">3 Meses</Badge>;
      case '6_meses':
        return <Badge className="bg-orange-100 text-orange-800">6 Meses</Badge>;
      case 'indisponivel':
        return <Badge className="bg-red-100 text-red-800">Indisponível</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">N/A</Badge>;
    }
  };

  const getSkillCategoryBadge = (category: string) => {
    switch (category) {
      case 'tecnologia':
        return <Badge variant="outline" className="text-blue-600">Tecnologia</Badge>;
      case 'marketing':
        return <Badge variant="outline" className="text-green-600">Marketing</Badge>;
      case 'vendas':
        return <Badge variant="outline" className="text-purple-600">Vendas</Badge>;
      case 'rh':
        return <Badge variant="outline" className="text-orange-600">RH</Badge>;
      case 'financeiro':
        return <Badge variant="outline" className="text-red-600">Financeiro</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-600">Outro</Badge>;
    }
  };

  const handleViewTalent = (talentId: string) => {
    toast({
      title: "Visualizando Talento",
      description: "Carregando perfil completo do talento",
      variant: "default"
    });
  };

  const handleContactTalent = (talentId: string) => {
    toast({
      title: "Contatando Talento",
      description: "Enviando convite para oportunidade",
      variant: "default"
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatSalary = (salary?: number) => {
    if (!salary) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(salary);
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
                  placeholder="Buscar por nome, email ou habilidades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={skillFilter} onValueChange={(value: any) => setSkillFilter(value)}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Área de atuação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as áreas</SelectItem>
                  <SelectItem value="tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="vendas">Vendas</SelectItem>
                  <SelectItem value="rh">RH</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={levelFilter} onValueChange={(value: any) => setLevelFilter(value)}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os níveis</SelectItem>
                  <SelectItem value="iniciante">Iniciante</SelectItem>
                  <SelectItem value="intermediario">Intermediário</SelectItem>
                  <SelectItem value="avancado">Avançado</SelectItem>
                  <SelectItem value="especialista">Especialista</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={availabilityFilter} onValueChange={(value: any) => setAvailabilityFilter(value)}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Disponibilidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="imediata">Imediata</SelectItem>
                  <SelectItem value="1_mes">1 Mês</SelectItem>
                  <SelectItem value="3_meses">3 Meses</SelectItem>
                  <SelectItem value="6_meses">6 Meses</SelectItem>
                  <SelectItem value="indisponivel">Indisponível</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Talento
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Talentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Banco de Talentos ({filteredTalents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTalents.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum talento encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTalents.map((talent) => (
                <Card key={talent.id} className="border-l-4 border-l-purple-400">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{talent.candidate_name}</h3>
                          {getSkillLevelBadge(talent.skill_level)}
                          {getAvailabilityBadge(talent.availability)}
                          {getSkillCategoryBadge(talent.skill_category)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Experiência: {talent.experience_years} anos</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span>Pretensão: {formatSalary(talent.salary_expectation)}</span>
                          </div>
                          {talent.city && talent.state && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{talent.city}, {talent.state}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Adicionado: {formatDate(talent.added_date)}</span>
                          </div>
                        </div>
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">Habilidades: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {talent.interest_areas.map((area, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {talent.notes && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            <span className="font-medium">Observações: </span>
                            {talent.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewTalent(talent.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Perfil
                        </Button>
                        {talent.availability !== 'indisponivel' && (
                          <Button
                            size="sm"
                            onClick={() => handleContactTalent(talent.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Contatar
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

      {/* Modal de Adição de Talento */}
      {showCreateModal && (
        <AddTalentModal
          companyId={companyId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            toast({
              title: "Talento Adicionado",
              description: "O talento foi adicionado ao banco com sucesso",
              variant: "default"
            });
          }}
        />
      )}
    </div>
  );
};

// Modal de Adição de Talento
const AddTalentModal: React.FC<{
  companyId: string;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    candidate_id: '',
    skill_category: 'tecnologia',
    skill_level: 'intermediario',
    experience_years: 0,
    availability: 'imediata',
    interest_areas: [] as string[],
    salary_expectation: 0,
    notes: ''
  });

  const [newInterestArea, setNewInterestArea] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data para candidatos disponíveis
  const mockCandidates = [
    { id: '1', name: 'Ana Silva', email: 'ana.silva@email.com' },
    { id: '2', name: 'Carlos Santos', email: 'carlos.santos@email.com' },
    { id: '3', name: 'Mariana Costa', email: 'mariana.costa@email.com' },
    { id: '4', name: 'Pedro Oliveira', email: 'pedro.oliveira@email.com' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Aqui você implementaria a chamada para a API
      // await addTalentToPool({ ...formData, company_id: companyId });
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess();
    } catch (error) {
      console.error('Erro ao adicionar talento:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addInterestArea = () => {
    if (newInterestArea.trim() && !formData.interest_areas.includes(newInterestArea.trim())) {
      setFormData({
        ...formData,
        interest_areas: [...formData.interest_areas, newInterestArea.trim()]
      });
      setNewInterestArea('');
    }
  };

  const removeInterestArea = (area: string) => {
    setFormData({
      ...formData,
      interest_areas: formData.interest_areas.filter(a => a !== area)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Adicionar Talento ao Banco</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="skill_category">Área de Atuação *</Label>
                <Select value={formData.skill_category} onValueChange={(value) => setFormData({ ...formData, skill_category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tecnologia">Tecnologia</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="vendas">Vendas</SelectItem>
                    <SelectItem value="rh">RH</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="skill_level">Nível de Habilidade *</Label>
                <Select value={formData.skill_level} onValueChange={(value) => setFormData({ ...formData, skill_level: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iniciante">Iniciante</SelectItem>
                    <SelectItem value="intermediario">Intermediário</SelectItem>
                    <SelectItem value="avancado">Avançado</SelectItem>
                    <SelectItem value="especialista">Especialista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience_years">Anos de Experiência *</Label>
                <Input
                  id="experience_years"
                  type="number"
                  min="0"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="availability">Disponibilidade *</Label>
                <Select value={formData.availability} onValueChange={(value) => setFormData({ ...formData, availability: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="imediata">Imediata</SelectItem>
                    <SelectItem value="1_mes">1 Mês</SelectItem>
                    <SelectItem value="3_meses">3 Meses</SelectItem>
                    <SelectItem value="6_meses">6 Meses</SelectItem>
                    <SelectItem value="indisponivel">Indisponível</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="salary_expectation">Expectativa Salarial</Label>
              <Input
                id="salary_expectation"
                type="number"
                min="0"
                step="0.01"
                value={formData.salary_expectation}
                onChange={(e) => setFormData({ ...formData, salary_expectation: parseFloat(e.target.value) || 0 })}
                placeholder="Ex: 8000.00"
              />
            </div>

            <div>
              <Label>Áreas de Interesse</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newInterestArea}
                  onChange={(e) => setNewInterestArea(e.target.value)}
                  placeholder="Ex: React, Node.js"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterestArea())}
                />
                <Button type="button" onClick={addInterestArea} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.interest_areas.map((area, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {area}
                    <button
                      type="button"
                      onClick={() => removeInterestArea(area)}
                      className="ml-1 hover:text-red-500"
                    >
                      <XCircle className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.candidate_id}>
                {isSubmitting ? "Adicionando..." : "Adicionar Talento"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TalentPoolTab;
