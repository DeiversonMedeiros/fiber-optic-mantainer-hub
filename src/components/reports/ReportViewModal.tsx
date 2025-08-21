import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage, ThumbnailImage, FullImage } from '@/components/ui/OptimizedImage';
import { supabase } from "@/integrations/supabase/client";

interface ReportViewModalProps {
  report: any | null;
  open: boolean;
  onClose: () => void;
}

const ReportViewModal: React.FC<ReportViewModalProps> = ({ report, open, onClose }) => {
  if (!report) return null;

  // Log para depuração
  console.log("Report recebido no modal:", report);

  // Estado para imagem ampliada
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null);

  // Estado para o template
  const [template, setTemplate] = useState<any>(report.template || null);

  // Buscar template se não vier no report
  useEffect(() => {
    async function fetchTemplate() {
      if (!report.template_id) return;
      const { data, error } = await supabase
        .from("report_templates")
        .select("*")
        .eq("id", report.template_id)
        .single();
      if (!error && data) setTemplate(data);
    }
    if (!report.template && report.template_id) {
      fetchTemplate();
    } else if (report.template) {
      setTemplate(report.template);
    }
  }, [report]);

  const [managerName, setManagerName] = useState<string>("");

  useEffect(() => {
    async function fetchManager() {
      if (report && report.manager_id) {
        // Se já vier populado
        if (report.manager && report.manager.name) {
          setManagerName(report.manager.name);
          return;
        }
        // Buscar do supabase
        const { data, error } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", report.manager_id)
          .single();
        if (!error && data) setManagerName(data.name);
      }
    }
    fetchManager();
  }, [report]);

  let images: string[] = [];
  if (Array.isArray(report.attachments)) {
    images = report.attachments
      .map((item: any) => (item && typeof item === "object" && item.url ? item.url : null))
      .filter(Boolean);
  } else if (report.attachments && typeof report.attachments === "object" && Array.isArray(report.attachments.images)) {
    images = report.attachments.images;
  } else if (typeof report.attachments === "string") {
    try {
      const parsed = JSON.parse(report.attachments);
      if (Array.isArray(parsed)) images = parsed;
      else if (parsed && Array.isArray(parsed.images)) images = parsed.images;
      else if (typeof parsed === "string") images = [parsed];
    } catch {
      images = [report.attachments];
    }
  }

  // Função utilitária para formatar o status
  function formatStatus(status: string) {
    if (!status) return "-";
    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  // Função para formatar o número do relatório
  function formatReportNumber(reportNumber: string | number | null) {
    if (!reportNumber) return "-";
    return `REL-${reportNumber}`;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Relatório</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div><strong>Título:</strong> {report.title}</div>
            <div><strong>Número do Relatório:</strong> {formatReportNumber(report.report_number)}</div>
            <div><strong>Status:</strong> <Badge>{formatStatus(report.status)}</Badge></div>
            <div><strong>Data:</strong> {new Date(report.created_at).toLocaleString("pt-BR")}</div>
            <div><strong>Técnico:</strong> {report.technician?.name || "-"}</div>
            <div><strong>Gestor:</strong> {managerName || "-"}</div>
            <div><strong>FCA:</strong> {report.description}</div>
            {/* Campos dinâmicos do relatório */}
            {report.form_data && Array.isArray(template?.fields) && template.fields.length > 0 && (
              <div>
                <strong>Campos do Relatório:</strong>
                <div className="space-y-1 mt-1">
                  {template.fields.map((field: any, idx: number) => (
                    <div key={idx}>
                      <span className="font-medium">{field.label || field.name}:</span>{" "}
                      {Array.isArray(report.form_data[field.id || field.name])
                        ? report.form_data[field.id || field.name].join(", ")
                        : String(report.form_data[field.id || field.name] ?? "-")}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Checklist do relatório */}
            {Array.isArray(report.checklist_data) && report.checklist_data.length > 0 && (
              <div>
                <strong>Checklist enviado:</strong>
                <ul className="mt-1 space-y-1">
                  {report.checklist_data.map((item: any, idx: number) => (
                    <li key={item.id || idx} className="flex flex-col md:flex-row md:items-center md:gap-2">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-xs text-gray-500 ml-2">Qtd: {item.quantity || 1}</span>
                      {item.notes && (
                        <span className="text-xs text-gray-400 ml-2">Obs: {item.notes}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {images.length > 0 && (
              <div>
                <strong>Imagens:</strong>
                <div className="flex flex-wrap gap-2 mt-2">
                  {images.map((url, idx) => (
                    <div key={idx} className="relative">
                      <ThumbnailImage
                        src={url}
                        alt={`Imagem ${idx + 1}`}
                        className="max-w-[200px] max-h-[150px] w-auto h-auto rounded border object-cover"
                        onClick={() => setZoomedIndex(idx)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal para imagem ampliada */}
      <Dialog open={zoomedIndex !== null} onOpenChange={() => setZoomedIndex(null)}>
        <DialogContent className="flex flex-col items-center justify-center max-w-3xl">
          {zoomedIndex !== null && (
            <>
              <div className="flex items-center gap-4 mb-4 z-10 bg-white/90 px-4 py-2 rounded shadow">
                <button
                  className="px-2 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                  onClick={e => {
                    e.stopPropagation();
                    setZoomedIndex((prev) =>
                      prev !== null ? (prev - 1 + images.length) % images.length : 0
                    );
                  }}
                  disabled={images.length <= 1}
                >
                  &#8592; Anterior
                </button>
                <span className="text-sm text-gray-700 font-medium">
                  {zoomedIndex + 1} / {images.length}
                </span>
                <button
                  className="px-2 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                  onClick={e => {
                    e.stopPropagation();
                    setZoomedIndex((prev) =>
                      prev !== null ? (prev + 1) % images.length : 0
                    );
                  }}
                  disabled={images.length <= 1}
                >
                  Próxima &#8594;
                </button>
              </div>
              <FullImage
                src={images[zoomedIndex]}
                alt={`Imagem ampliada ${zoomedIndex + 1}`}
                className="max-h-[80vh] max-w-full rounded shadow-lg"
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReportViewModal; 