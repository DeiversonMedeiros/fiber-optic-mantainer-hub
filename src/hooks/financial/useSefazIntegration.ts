import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserCompany } from '@/hooks/useUserCompany';

export interface SefazIntegration {
  id: string;
  company_id: string;
  uf: string;
  ambiente: 'homologacao' | 'producao';
  webservice_url: string;
  certificado_a1?: string;
  senha_certificado?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface SefazStatus {
  id: string;
  company_id: string;
  uf: string;
  status: 'online' | 'offline' | 'manutencao' | 'erro';
  ultima_verificacao: string;
  observacoes?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  company_id: string;
  numero_nf: string;
  serie?: string;
  tipo: 'entrada' | 'saida';
  data_emissao?: string;
  data_entrada?: string;
  fornecedor_id?: string;
  cliente_id?: string;
  valor_total?: number;
  valor_icms?: number;
  valor_ipi?: number;
  valor_pis?: number;
  valor_cofins?: number;
  status: 'pendente' | 'autorizada' | 'rejeitada' | 'cancelada' | 'inutilizada';
  xml_anexo?: string;
  created_at: string;
  updated_at?: string;
}

export interface InvoiceItem {
  id: string;
  company_id: string;
  invoice_id: string;
  material_id?: string;
  descricao: string;
  quantidade?: number;
  valor_unitario?: number;
  valor_total?: number;
  ncm?: string;
  cfop?: string;
  cst?: string;
  created_at: string;
}

export interface SefazIntegrationFormData {
  uf: string;
  ambiente: 'homologacao' | 'producao';
  webservice_url: string;
  certificado_a1?: string;
  senha_certificado?: string;
  is_active?: boolean;
}

export const useSefazIntegration = () => {
  const [integrations, setIntegrations] = useState<SefazIntegration[]>([]);
  const [status, setStatus] = useState<SefazStatus[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { companyId } = useUserCompany();

  const fetchIntegrations = async () => {
    if (!companyId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('sefaz_integration')
        .select('*')
        .eq('company_id', companyId)
        .order('uf', { ascending: true });

      if (fetchError) throw fetchError;

      setIntegrations(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar integrações SEFAZ');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    if (!companyId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('sefaz_status')
        .select('*')
        .eq('company_id', companyId)
        .order('uf', { ascending: true });

      if (fetchError) throw fetchError;

      setStatus(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar status SEFAZ');
    }
  };

  const fetchInvoices = async (filters?: {
    uf?: string;
    status?: string;
    data_inicio?: string;
    data_fim?: string;
    tipo?: string;
  }) => {
    if (!companyId) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          invoice_items(*)
        `)
        .eq('company_id', companyId)
        .order('data_emissao', { ascending: false });

      if (filters) {
        if (filters.uf) {
          query = query.eq('uf', filters.uf);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.data_inicio) {
          query = query.gte('data_emissao', filters.data_inicio);
        }
        if (filters.data_fim) {
          query = query.lte('data_emissao', filters.data_fim);
        }
        if (filters.tipo) {
          query = query.eq('tipo', filters.tipo);
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setInvoices(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar notas fiscais');
    } finally {
      setLoading(false);
    }
  };

  const createIntegration = async (data: SefazIntegrationFormData) => {
    if (!companyId) throw new Error('ID da empresa não encontrado');

    setLoading(true);
    setError(null);

    try {
      const { data: newRecord, error: insertError } = await supabase
        .from('sefaz_integration')
        .insert([{ ...data, company_id: companyId }])
        .select()
        .single();

      if (insertError) throw insertError;

      setIntegrations(prev => [newRecord, ...prev]);
      return newRecord;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar integração SEFAZ');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateIntegration = async (id: string, data: Partial<SefazIntegrationFormData>) => {
    setLoading(true);
    setError(null);

    try {
      const { data: updatedRecord, error: updateError } = await supabase
        .from('sefaz_integration')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setIntegrations(prev =>
        prev.map(item => (item.id === id ? updatedRecord : item))
      );

      return updatedRecord;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar integração SEFAZ');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteIntegration = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('sefaz_integration')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setIntegrations(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir integração SEFAZ');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (integrationId: string) => {
    try {
      const { data, error: testError } = await supabase
        .rpc('test_sefaz_connection', { integration_id: integrationId });

      if (testError) throw testError;

      // Atualizar status após teste
      await fetchStatus();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao testar conexão SEFAZ');
      throw err;
    }
  };

  const uploadXml = async (file: File, uf: string) => {
    if (!companyId) throw new Error('ID da empresa não encontrado');

    setLoading(true);
    setError(null);

    try {
      // Upload do arquivo XML
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `sefaz/xml/${companyId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Processar XML e extrair dados da NF-e
      const { data, error: processError } = await supabase
        .rpc('process_nfe_xml', { 
          file_path: filePath,
          company_id: companyId,
          uf: uf
        });

      if (processError) throw processError;

      // Recarregar notas fiscais
      await fetchInvoices();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar XML');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const consultNfe = async (chaveAcesso: string, uf: string) => {
    try {
      const { data, error: consultError } = await supabase
        .rpc('consult_nfe_status', { 
          chave_acesso: chaveAcesso,
          uf: uf,
          company_id: companyId
        });

      if (consultError) throw consultError;

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao consultar NF-e');
      throw err;
    }
  };

  const cancelNfe = async (invoiceId: string, justificativa: string) => {
    try {
      const { data, error: cancelError } = await supabase
        .rpc('cancel_nfe', { 
          invoice_id: invoiceId,
          justificativa: justificativa,
          company_id: companyId
        });

      if (cancelError) throw cancelError;

      // Recarregar notas fiscais
      await fetchInvoices();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar NF-e');
      throw err;
    }
  };

  const inutilizeNfe = async (serie: string, numeroInicial: number, numeroFinal: number, justificativa: string, uf: string) => {
    try {
      const { data, error: inutilizeError } = await supabase
        .rpc('inutilize_nfe', { 
          serie: serie,
          numero_inicial: numeroInicial,
          numero_final: numeroFinal,
          justificativa: justificativa,
          uf: uf,
          company_id: companyId
        });

      if (inutilizeError) throw inutilizeError;

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao inutilizar NF-e');
      throw err;
    }
  };

  const downloadXml = async (invoiceId: string) => {
    try {
      const { data, error: downloadError } = await supabase
        .rpc('get_nfe_xml', { 
          invoice_id: invoiceId,
          company_id: companyId
        });

      if (downloadError) throw downloadError;

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao baixar XML');
      throw err;
    }
  };

  const generateDanfe = async (invoiceId: string) => {
    try {
      const { data, error: danfeError } = await supabase
        .rpc('generate_danfe', { 
          invoice_id: invoiceId,
          company_id: companyId
        });

      if (danfeError) throw danfeError;

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar DANFE');
      throw err;
    }
  };

  const getUfStatus = (uf: string) => {
    return status.find(s => s.uf === uf);
  };

  const getActiveIntegrations = () => {
    return integrations.filter(integration => integration.is_active);
  };

  useEffect(() => {
    if (companyId) {
      fetchIntegrations();
      fetchStatus();
      fetchInvoices();
    }
  }, [companyId]);

  return {
    integrations,
    status,
    invoices,
    loading,
    error,
    fetchIntegrations,
    fetchStatus,
    fetchInvoices,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testConnection,
    uploadXml,
    consultNfe,
    cancelNfe,
    inutilizeNfe,
    downloadXml,
    generateDanfe,
    getUfStatus,
    getActiveIntegrations,
  };
};



