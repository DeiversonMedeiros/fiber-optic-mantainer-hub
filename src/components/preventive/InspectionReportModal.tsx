import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import InspectionReportForm from './InspectionReportForm';
import { compressImage } from '@/lib/imageOptimization';

interface ScheduleItem {
  id: string;
  cable_number: string;
  client_site: string;
  scheduled_month: number;
  scheduled_year: number;
}

interface InspectionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: ScheduleItem | null;
  onSuccess: () => void;
}

const STORAGE_BUCKET = 'report-attachments';
const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 10;

async function uploadFiles(files: File[], userId: string) {
  const uploaded = [];
  for (const file of files) {
    const timestamp = Date.now();
    const filePath = `reports/${userId}/${timestamp}_${file.name}`;
    console.log('Fazendo upload de:', filePath, file);
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, { upsert: false });
    if (error) {
      console.error('Erro ao fazer upload:', error);
      throw error;
    }
    const { data: publicUrl } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
    uploaded.push({
      name: file.name,
      url: publicUrl.publicUrl,
      path: filePath,
      size: file.size,
      type: file.type
    });
  }
  return uploaded;
}

// Função para upload das imagens para o Supabase Storage
async function uploadImages(files: File[], userId: string) {
  const uploaded: string[] = [];
  for (const file of files) {
    console.log('[compressImage] Original:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Forçar compressão para JPEG antes do upload
    const optimized = await compressImage(file, { format: 'jpeg', quality: 0.8, maxWidth: 1920, maxHeight: 1080 });

    console.log('[compressImage] Otimizado:', {
      name: optimized.file.name,
      type: optimized.file.type,
      size: optimized.file.size,
      originalSize: optimized.originalSize,
      compressionRatio: optimized.compressionRatio
    });

    const timestamp = Date.now();
    // Garante extensão .jpg
    const filePath = `inspection-reports/${userId}/${timestamp}_${file.name.replace(/\.[^.]+$/, '.jpg')}`;
    console.log('[uploadImages] Uploadando arquivo:', {
      filePath,
      type: optimized.file.type,
      size: optimized.file.size
    });

    const { error } = await supabase.storage
      .from('report-attachments')
      .upload(filePath, optimized.file, { upsert: false });

    if (error) {
      console.error('[uploadImages] Erro ao fazer upload:', error);
      throw error;
    }

    const { data: publicUrl } = supabase.storage.from('report-attachments').getPublicUrl(filePath);
    uploaded.push(publicUrl.publicUrl);

    console.log('[uploadImages] Upload concluído:', {
      url: publicUrl.publicUrl,
      filePath
    });
  }
  return uploaded;
}

const InspectionReportModal = ({ isOpen, onClose, schedule, onSuccess }: InspectionReportModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(form: any) {
    setLoading(true);
    try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
        setLoading(false);
        return;
      }
      // Upload das imagens
      const photoUrls = await uploadImages(form.photos, user.user.id);
      // Inserir relatório na nova tabela
      const { error } = await supabase.from('inspection_reports').insert({
      technician_id: user.user.id,
        schedule_id: schedule?.id || null,
        risk_type: form.risk_type,
        risk_level: form.risk_level,
        address: form.address,
        city: form.city,
        neighborhood: form.neighborhood,
        cable_number: form.cable_number,
        network_type: form.network_type,
        description: form.description,
        photos: photoUrls
      });
      if (error) throw error;
      toast({ title: "Relatório enviado", description: "O relatório de vistoria foi enviado com sucesso." });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({ title: "Erro ao enviar relatório", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Relatório de Vistoria Preventiva</DialogTitle>
        </DialogHeader>
        <InspectionReportForm onSubmit={handleSubmit} loading={loading} cableNumber={schedule?.cable_number || ""} />
      </DialogContent>
    </Dialog>
  );
};

export default InspectionReportModal;