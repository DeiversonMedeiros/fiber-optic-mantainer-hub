// Web Worker para exportação de CSV em background
// Este worker processa dados de relatórios sem bloquear a UI principal

interface WorkerMessage {
  type: string;
  filters?: any;
  batchSize?: number;
  batchNumber?: number;
  lastId?: string;
  data?: any[];
  hasMore?: boolean;
  error?: any;
}

interface CSVExportData {
  csvContent: string;
  filename: string;
}

// Função para limpar texto para CSV
const cleanTextForCSV = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Função para gerar número do relatório
const getReportNumber = (report: any): string => {
  if (report.report_number) {
    return `REL-${report.report_number}`;
  }
  if (report.id) {
    const shortId = report.id.replace(/-/g, '').slice(0, 8);
    return `REL-${shortId}`;
  }
  return 'REL-N/A';
};

// Função para processar checklist_data
const processChecklistData = (checklistData: any): string => {
  if (!checklistData) return '';
  
  try {
    const checklist = typeof checklistData === 'string' ? 
      JSON.parse(checklistData) : checklistData;
    
    if (Array.isArray(checklist)) {
      return checklist.map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          return `${item.name || item.material || item.id}: ${item.quantity || 0}`;
        }
        return String(item);
      }).join('; ');
    }
  } catch (e) {
    return 'Erro ao processar checklist';
  }
  
  return '';
};

// Função para processar attachments
const processAttachments = (attachments: any): string => {
  if (!attachments) return '';
  
  try {
    const atts = typeof attachments === 'string' ? 
      JSON.parse(attachments) : attachments;
    
    if (Array.isArray(atts)) {
      return atts.map((att: any) => {
        if (typeof att === 'object' && att !== null) {
          return att.url || att.name || 'arquivo';
        }
        return String(att);
      }).join('; ');
    }
  } catch (e) {
    return 'Erro ao processar anexos';
  }
  
  return '';
};

// Função para extrair dados do form_data
const extractFormDataFields = (formData: any): Record<string, any> => {
  if (!formData) return {};
  
  let parsedFormData = formData;
  if (typeof formData === 'string') {
    try {
      parsedFormData = JSON.parse(formData);
    } catch {
      return {};
    }
  }
  
  const extracted: Record<string, any> = {};
  
  // Função auxiliar para processar valores
  const processValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return cleanTextForCSV(value);
    if (typeof value === 'object' && value !== null) {
      if (value.url) return value.url;
      if (value.name) return value.name;
      if (value.id) return String(value.id);
      return JSON.stringify(value);
    }
    return String(value);
  };
  
  // Extrair campos específicos que são comumente usados
  const specificFields = {
    'Data do Serviço': parsedFormData.data_servico || parsedFormData.data || parsedFormData.data_do_servico || '',
    'Endereço': parsedFormData.endereco || parsedFormData.address || parsedFormData.endereco_servico || '',
    'Bairro': parsedFormData.bairro || parsedFormData.neighborhood || parsedFormData.bairro_servico || '',
    'Cidade': parsedFormData.cidade || parsedFormData.city || parsedFormData.cidade_servico || '',
    'Serviço Finalizado?': parsedFormData.servico_finalizado || parsedFormData.finalizado || parsedFormData.concluido || '',
    'Observações': parsedFormData.observacoes || parsedFormData.observations || parsedFormData.obs || '',
    'Cliente': parsedFormData.cliente || parsedFormData.customer || parsedFormData.nome_cliente || '',
    'Tipo de Serviço': parsedFormData.tipo_servico || parsedFormData.service_type || parsedFormData.categoria || ''
  };
  
  // Adicionar campos específicos apenas se não estiverem vazios
  Object.entries(specificFields).forEach(([label, value]) => {
    if (value && value !== '') {
      extracted[label] = cleanTextForCSV(String(value));
    }
  });
  
  // Extrair todos os outros campos do form_data
  Object.keys(parsedFormData).forEach(key => {
    const value = parsedFormData[key];
    if (value !== undefined && value !== null) {
      // Verificar se o campo já foi processado
      const existingField = Object.values(extracted).find(v => v === cleanTextForCSV(String(value)));
      if (!existingField) {
        // Usar o nome do campo como label se não foi processado
        const fieldLabel = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
        if (typeof value === 'string') {
          extracted[fieldLabel] = cleanTextForCSV(value);
        } else if (Array.isArray(value)) {
          extracted[fieldLabel] = value.map(processValue).join('; ');
        } else if (typeof value === 'object' && value !== null) {
          extracted[fieldLabel] = processValue(value);
        } else {
          extracted[fieldLabel] = String(value);
        }
      }
    }
  });
  
  return extracted;
};

// Função para gerar linha CSV de um relatório
const generateCSVLine = (report: any): string => {
  const formDataExtracted = extractFormDataFields(report.form_data);
  const checklistInfo = processChecklistData(report.checklist_data);
  const attachmentsInfo = processAttachments(report.attachments);
  
  // Definir ordem fixa das colunas
  const csvFields = [
    getReportNumber(report),
    report.id || '',
    report.numero_servico || '',
    cleanTextForCSV(report.title || ''),
    cleanTextForCSV(report.description || ''),
    report.status || '',
    '', // Técnico será preenchido depois
    report.created_at ? new Date(report.created_at).toLocaleDateString('pt-BR') : '',
    report.updated_at ? new Date(report.updated_at).toLocaleDateString('pt-BR') : '',
    report.validated_at ? new Date(report.validated_at).toLocaleDateString('pt-BR') : '',
    report.validated_by || '',
    report.service_order_id || '',
    report.assigned_to || '',
    cleanTextForCSV(report.pending_reason || ''),
    cleanTextForCSV(report.pending_notes || ''),
    report.parent_report_id || '',
    checklistInfo,
    attachmentsInfo
  ];
  
  // Adicionar campos dinâmicos do formulário em ordem alfabética
  const dynamicFields = Object.keys(formDataExtracted)
    .sort()
    .map(key => formDataExtracted[key]);
  
  return [...csvFields, ...dynamicFields].map(field => `"${field}"`).join(',');
};

// Função para gerar cabeçalho CSV
const generateCSVHeader = (reports: any[]): string => {
  const baseHeaders = [
    'Código Único', 'ID do Relatório', 'Número do Serviço', 'Título', 
    'FCA', 'Status', 'Técnico', 'Data de Criação', 'Data de Atualização',
    'Validado em', 'Validado por', 'ID da Ordem de Serviço', 'Atribuído para',
    'Motivo da Pendência', 'Observações da Pendência', 'ID do Relatório Pai',
    'Informações do Checklist', 'Anexos'
  ];
  
  // Coletar todos os campos dinâmicos únicos de todos os relatórios
  const dynamicFields = new Set<string>();
  
  reports.forEach(report => {
    if (report.form_data) {
      const extracted = extractFormDataFields(report.form_data);
      Object.keys(extracted).forEach(key => dynamicFields.add(key));
    }
  });
  
  const sortedDynamicFields = Array.from(dynamicFields).sort();
  
  return [...baseHeaders, ...sortedDynamicFields].join(',');
};

// Função para processar relatórios e gerar CSV
const processReportsToCSV = (reports: any[]): CSVExportData => {
  if (!reports || reports.length === 0) {
    throw new Error('Nenhum relatório fornecido para processamento');
  }
  
  // Gerar cabeçalho
  const header = generateCSVHeader(reports);
  let csvContent = header + '\n';
  
  // Processar cada relatório
  reports.forEach((report, index) => {
    try {
      const csvLine = generateCSVLine(report);
      csvContent += csvLine + '\n';
      
      // Reportar progresso a cada 100 relatórios
      if ((index + 1) % 100 === 0) {
        self.postMessage({
          type: 'PROGRESS_UPDATE',
          processed: index + 1,
          total: reports.length,
          percentage: Math.round(((index + 1) / reports.length) * 100)
        });
      }
    } catch (error) {
      console.error(`Erro ao processar relatório ${report.id}:`, error);
      // Continuar com o próximo relatório
    }
  });
  
  // Gerar nome do arquivo
  const now = new Date();
  const timestamp = now.toISOString().split('T')[0];
  const filename = `relatorios_validacao_worker_${timestamp}.csv`;
  
  return { csvContent, filename };
};

// Listener para mensagens do thread principal
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, data, filters, batchSize } = event.data;
  
  try {
    switch (type) {
      case 'EXPORT_CSV':
        // Iniciar processo de exportação
        self.postMessage({
          type: 'EXPORT_STARTED',
          message: 'Worker iniciado para exportação CSV'
        });
        break;
        
      case 'PROCESS_BATCH':
        // Processar lote de dados
        if (data && Array.isArray(data)) {
          const csvData = processReportsToCSV(data);
          self.postMessage({
            type: 'CSV_READY',
            csvContent: csvData.csvContent,
            filename: csvData.filename,
            processedCount: data.length
          });
        }
        break;
        
      case 'PROCESS_REPORTS':
        // Processar relatórios completos
        if (data && Array.isArray(data)) {
          const csvData = processReportsToCSV(data);
          self.postMessage({
            type: 'CSV_READY',
            csvContent: csvData.csvContent,
            filename: csvData.filename,
            processedCount: data.length
          });
        }
        break;
        
      default:
        self.postMessage({
          type: 'ERROR',
          error: `Tipo de mensagem desconhecido: ${type}`
        });
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: `Erro no worker: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    });
  }
});

// Mensagem de inicialização
self.postMessage({
  type: 'WORKER_READY',
  message: 'CSV Export Worker inicializado com sucesso'
});

export {};
