// @ts-nocheck
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Users, X } from 'lucide-react';

const TalentPoolTab = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const candidates = [
    {
      id: 1,
      name: 'João Silva',
      email: 'joao.silva@email.com',
      position: 'Desenvolvedor Frontend',
      skills: ['React', 'JavaScript', 'CSS'],
      status: 'available'
    },
    {
      id: 2,
      name: 'Maria Santos',
      email: 'maria.santos@email.com',
      position: 'Analista de Sistemas',
      skills: ['Java', 'Spring', 'MySQL'],
      status: 'interviewing'
    }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: { label: 'Disponível', variant: 'default' },
      interviewing: { label: 'Em Processo', variant: 'secondary' }
    };

    const config = statusConfig[status] || statusConfig.available;
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const filteredCandidates = candidates.filter(candidate =>
    candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Banco de Talentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar candidatos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredCandidates.map((candidate) => (
              <Card key={candidate.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{candidate.name}</h3>
                      {getStatusBadge(candidate.status)}
                    </div>
                    
                    <p className="text-gray-600 mb-2">{candidate.position}</p>
                    <p className="text-gray-600 mb-3">{candidate.email}</p>

                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button size="sm" variant="outline">
                      Ver Perfil
                    </Button>
                    <Button size="sm">
                      Contatar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TalentPoolTab;