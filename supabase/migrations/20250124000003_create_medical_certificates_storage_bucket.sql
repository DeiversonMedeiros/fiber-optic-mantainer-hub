-- ============================================================================
-- MIGRAÇÃO: BUCKET PARA ATESTADOS MÉDICOS
-- ============================================================================
-- 
-- Data: 2025-01-24
-- Descrição: Cria bucket no Supabase Storage para armazenar atestados médicos
--           de funcionários com políticas de segurança
--
-- ============================================================================

-- Criar o bucket para atestados médicos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'medical-certificates',
    'medical-certificates',
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
CREATE POLICY "medical_certificates_upload_policy" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'medical-certificates' 
    AND auth.role() = 'authenticated'
);

-- Política para permitir visualização de arquivos (download)
-- Apenas o usuário que fez o upload pode visualizar seus próprios arquivos
-- ou usuários com permissões administrativas (RH, Gerência)
CREATE POLICY "medical_certificates_view_policy" ON storage.objects
FOR SELECT USING (
    bucket_id = 'medical-certificates' 
    AND (
        auth.uid()::text = (storage.foldername(name))[1]
        OR auth.role() = 'service_role'
    )
);

-- Política para permitir atualização de arquivos
-- Apenas o usuário que fez o upload pode atualizar seus próprios arquivos
CREATE POLICY "medical_certificates_update_policy" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'medical-certificates' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir exclusão de arquivos
-- Apenas o usuário que fez o upload pode excluir seus próprios arquivos
CREATE POLICY "medical_certificates_delete_policy" ON storage.objects
FOR DELETE USING (
    bucket_id = 'medical-certificates' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);
