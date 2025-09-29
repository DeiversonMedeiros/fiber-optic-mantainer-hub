-- ============================================================================
-- MIGRAÇÃO: BUCKET PARA COMPROVANTES DE REEMBOLSO
-- ============================================================================
-- 
-- Data: 2025-01-24
-- Descrição: Cria bucket no Supabase Storage para armazenar comprovantes 
--           de reembolso de funcionários com políticas de segurança
--
-- ============================================================================

-- Criar o bucket para comprovantes de reembolso
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'reimbursement-receipts',
    'reimbursement-receipts',
    false, -- Bucket privado por segurança
    10485760, -- 10MB limite de tamanho
    ARRAY[
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- POLÍTICAS DE SEGURANÇA (RLS) PARA O BUCKET
-- ============================================================================

-- Política para permitir inserção de arquivos (upload)
-- Apenas usuários autenticados podem fazer upload
CREATE POLICY "reimbursement_receipts_upload_policy" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'reimbursement-receipts' 
    AND auth.role() = 'authenticated'
);

-- Política para permitir visualização de arquivos (download)
-- Apenas o usuário que fez o upload pode visualizar seus próprios arquivos
-- ou usuários com permissões administrativas
CREATE POLICY "reimbursement_receipts_view_policy" ON storage.objects
FOR SELECT USING (
    bucket_id = 'reimbursement-receipts' 
    AND (
        auth.uid()::text = (storage.foldername(name))[1]
        OR auth.role() = 'service_role'
    )
);

-- Política para permitir atualização de arquivos
-- Apenas o usuário que fez o upload pode atualizar seus próprios arquivos
CREATE POLICY "reimbursement_receipts_update_policy" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'reimbursement-receipts' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir exclusão de arquivos
-- Apenas o usuário que fez o upload pode excluir seus próprios arquivos
CREATE POLICY "reimbursement_receipts_delete_policy" ON storage.objects
FOR DELETE USING (
    bucket_id = 'reimbursement-receipts' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);
