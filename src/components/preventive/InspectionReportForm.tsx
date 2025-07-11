import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const RISK_TYPES = [
  "Adequação / Acomodação Caixa De Emenda",
  "Adequação de Reserva Técnica",
  "Readequação de Reserva Técnica",
  "Cabo Óptico Danificado / Rompido / Vincado",
  "Tampa Caixa Subterrânea Danificada / Sem tampa",
  "Duto Lateral Danificado",
  "Tampa solta",
  "Cabo sem Riscos",
  "Entulho",
  "Roçado / Capinagem",
  "Erosão (buraco)",
  "Obra no trecho",
  "Posteamento Substituido / Abalroado",
  "Cabos Soltos / Bandolados / Pendente Espinamento",
  "Altura Rede Abaixo Da Recomendada Sobre Passeio",
  "Altura Rede Abaixo Da Recomendada Em Travessia",
  "Abraçadeira Bap Danificada / Inexistente",
  "Cordoalha Solta / Rompida",
  "Árvore Danificando Rede (Necessidade Poda)",
  "Rede Próximo A Rede Elétrica (Concessionária Energia)",
  "Rede Próximo A Iluminação Pública (Concessionária Energia)",
  "Existência Pragas Urbanas (Ratos, Abelhas, Formigas, Etc...)",
  "Aterramento Danificado / Inexistente"
];

const RISK_LEVELS = ["Alto", "Médio", "Baixo"];
const NETWORK_TYPES = ["Aérea", "Subterrânea"];

const CITY_OPTIONS = [
  "Camaçari",
  "Candeias",
  "Catu",
  "Dias D'Avila",
  "Lauro de Freitas",
  "Mata de São João",
  "Pojuca",
  "Salvador",
  "São Francisco do Conde",
  "Simões Filho"
];

export default function InspectionReportForm({ onSubmit, loading, cableNumber = "" }: {
  onSubmit: (data: any) => void,
  loading?: boolean,
  cableNumber?: string
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    risk_type: "",
    risk_level: "",
    address: "",
    city: "",
    neighborhood: "",
    cable_number: cableNumber, // inicializa com o valor vindo da prop
    network_type: "",
    description: "",
    photos: [] as File[]
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  function handleChange(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 2) {
      toast({ title: "Máximo 2 imagens permitidas.", variant: "destructive" });
      return;
    }
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Cada imagem deve ter até 10MB.", variant: "destructive" });
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast({ title: "Apenas arquivos de imagem são permitidos.", variant: "destructive" });
        return;
      }
    }
    handleChange("photos", files);
  }

  function validate() {
    const newErrors: typeof errors = {};
    if (!form.risk_type) newErrors.risk_type = "Obrigatório";
    if (!form.risk_level) newErrors.risk_level = "Obrigatório";
    if (!form.address) newErrors.address = "Obrigatório";
    if (!form.city) newErrors.city = "Obrigatório";
    if (!form.neighborhood) newErrors.neighborhood = "Obrigatório";
    if (!form.cable_number) newErrors.cable_number = "Obrigatório";
    if (!form.network_type) newErrors.network_type = "Obrigatório";
    if (!form.description) newErrors.description = "Obrigatório";
    if (!form.photos || form.photos.length === 0) newErrors.photos = "Obrigatório";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  }

  return (
    <form
      className="space-y-4 max-h-[70vh] overflow-y-auto pr-2"
      onSubmit={handleSubmit}
    >
      <div>
        <Label>Tipo de Risco *</Label>
        <Select value={form.risk_type} onValueChange={v => handleChange("risk_type", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo de risco" />
          </SelectTrigger>
          <SelectContent>
            {RISK_TYPES.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.risk_type && <span className="text-red-500 text-xs">{errors.risk_type}</span>}
      </div>
      <div>
        <Label>Grau de Risco *</Label>
        <Select value={form.risk_level} onValueChange={v => handleChange("risk_level", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o grau de risco" />
          </SelectTrigger>
          <SelectContent>
            {RISK_LEVELS.map((level) => (
              <SelectItem key={level} value={level}>{level}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.risk_level && <span className="text-red-500 text-xs">{errors.risk_level}</span>}
      </div>
      <div>
        <Label>Endereço *</Label>
        <Input value={form.address} onChange={e => handleChange("address", e.target.value)} />
        {errors.address && <span className="text-red-500 text-xs">{errors.address}</span>}
      </div>
      <div>
        <Label>Cidade *</Label>
        <Select value={form.city} onValueChange={v => handleChange("city", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a cidade" />
          </SelectTrigger>
          <SelectContent>
            {CITY_OPTIONS.map((city) => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.city && <span className="text-red-500 text-xs">{errors.city}</span>}
      </div>
      <div>
        <Label>Bairro *</Label>
        <Input value={form.neighborhood} onChange={e => handleChange("neighborhood", e.target.value)} />
        {errors.neighborhood && <span className="text-red-500 text-xs">{errors.neighborhood}</span>}
      </div>
      <div>
        <Label>Número do Cabo *</Label>
        <Input value={form.cable_number} readOnly />
        {errors.cable_number && <span className="text-red-500 text-xs">{errors.cable_number}</span>}
      </div>
      <div>
        <Label>Rede *</Label>
        <Select value={form.network_type} onValueChange={v => handleChange("network_type", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo de rede" />
          </SelectTrigger>
          <SelectContent>
            {NETWORK_TYPES.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.network_type && <span className="text-red-500 text-xs">{errors.network_type}</span>}
      </div>
      <div>
        <Label>Descrição *</Label>
        <Textarea value={form.description} onChange={e => handleChange("description", e.target.value)} />
        {errors.description && <span className="text-red-500 text-xs">{errors.description}</span>}
      </div>
      <div>
        <Label>Foto do Risco (máx. 2 imagens, até 10MB cada) *</Label>
        <Input type="file" accept="image/*" multiple onChange={handleFileChange} />
        {errors.photos && <span className="text-red-500 text-xs">{errors.photos}</span>}
        {form.photos.length > 0 && (
          <div className="flex gap-2 mt-2">
            {form.photos.map((file, idx) => (
              <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">{file.name}</span>
            ))}
          </div>
        )}
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Enviar Relatório"}
      </Button>
    </form>
  );
} 