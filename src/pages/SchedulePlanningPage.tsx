import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Download, Printer, Save, RefreshCw } from 'lucide-react';
import { SchedulePlanning } from '@/components/rh/SchedulePlanning';
import { useCompany } from '@/hooks/useCompany';

export default function SchedulePlanningPage() {
  const navigate = useNavigate();
  const { data: company, isLoading: companyLoading } = useCompany();

  return (
    <div className="w-full">
      {/* Header da página */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/rh')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar ao RH</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                ESCALA DE TRABALHO
              </h1>
              <p className="text-2xl font-semibold text-foreground mt-1">
                ESCALA EDITÁVEL
              </p>
              <p className="text-muted-foreground mt-2">
                Programe escalas mensais de trabalho, folgas, feriados e férias dos funcionários
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              ATUALIZAR ESCALA
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              IMPRIMIR
            </Button>
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              SALVAR EM PDF
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              GERAR ARQUIVO SIMP
            </Button>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <button 
            onClick={() => navigate('/rh')}
            className="hover:text-foreground transition-colors"
          >
            RH
          </button>
          <span>/</span>
          <span className="text-foreground font-medium">Programação de Escalas</span>
        </nav>
      </div>

      {/* Conteúdo principal */}
      {companyLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dados da empresa...</p>
          </div>
        </div>
      ) : company ? (
        <SchedulePlanning companyId={company.id} />
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Erro ao carregar dados da empresa</p>
        </div>
      )}
    </div>
  );
}
