import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export interface ChecklistItem {
  id: string;
  name: string;
  category: string;
  quantity?: number | "";
  notes?: string;
  standard_quantity?: number | null;
}

interface ChecklistFormSectionProps {
  items: ChecklistItem[];
  value: ChecklistItem[];
  onChange: (selected: ChecklistItem[]) => void;
}

export const ChecklistFormSection: React.FC<ChecklistFormSectionProps> = ({
  items,
  value,
  onChange,
}) => {
  const [search, setSearch] = useState("");

  // Agrupa itens por categoria e filtra pelo termo de busca
  const groupedItems = useMemo(() => {
    const filtered = items.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
    const groups: Record<string, ChecklistItem[]> = {};
    filtered.forEach((item) => {
      const cat = item.category || "Outros";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [items, search]);

  // Verifica se item está selecionado
  const isChecked = (id: string) => value.some((v) => v.id === id);

  // Retorna a quantidade do item selecionado
  const getQuantity = (id: string) => {
    const q = value.find((v) => v.id === id)?.quantity;
    return q === undefined ? "" : q;
  };

  // Retorna as observações do item selecionado
  const getNotes = (id: string) =>
    value.find((v) => v.id === id)?.notes || "";

  // Lida com seleção/deseleção
  const handleCheck = (item: ChecklistItem, checked: boolean) => {
    if (checked) {
      // Sempre usar quantidade padrão 1 para todos os itens
      const defaultQuantity = 1;
      
      onChange([
        ...value,
        { ...item, quantity: defaultQuantity, notes: "" },
      ]);
    } else {
      onChange(value.filter((v) => v.id !== item.id));
    }
  };

  // Lida com alteração de quantidade
  const handleQuantity = (id: string, quantity: number) => {
    if (quantity < 1) quantity = 1;
    onChange(
      value.map((v) =>
        v.id === id ? { ...v, quantity } : v
      )
    );
  };

  // Lida com alteração de observações
  const handleNotes = (id: string, notes: string) => {
    onChange(
      value.map((v) =>
        v.id === id ? { ...v, notes } : v
      )
    );
  };

  // Remover item da lista de selecionados
  const handleRemove = (id: string) => {
    onChange(value.filter((v) => v.id !== id));
  };

  return (
    <div>
      <Label className="mb-2 block">Checklist</Label>
      <Input
        placeholder="Buscar itens..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-2"
      />

      <div className="max-h-72 overflow-y-auto border rounded p-2 bg-white">
        {Object.keys(groupedItems).length === 0 && (
          <div className="text-sm text-gray-500 p-4 text-center">
            Nenhum item encontrado.
          </div>
        )}
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="mb-4">
            <div className="font-semibold text-primary mb-2">{category}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center border rounded px-2 py-1 bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={isChecked(item.id)}
                    onChange={(e) =>
                      handleCheck(item, e.target.checked)
                    }
                    className="mr-2"
                  />
                  <div className="flex-1">
                    <span className="block">{item.name}</span>
                    {item.category === "materiais" && (
                      <span className="text-xs text-gray-500">
                        Padrão: {item.standard_quantity || 0}
                      </span>
                    )}
                  </div>
                  {isChecked(item.id) && (
                    <>
                      <input
                        type="number"
                        min="1"
                        value={getQuantity(item.id)}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            // Permite string vazia durante digitação
                            onChange(
                              value.map((v) =>
                                v.id === item.id ? { ...v, quantity: "" as const } : v
                              ) as ChecklistItem[]
                            );
                          } else {
                            const num = parseInt(val, 10);
                            if (!isNaN(num) && num > 0) {
                              handleQuantity(item.id, num);
                            }
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value === "") {
                            const defaultQty = 1;
                            handleQuantity(item.id, defaultQty);
                          }
                        }}
                        className="w-16 text-center border rounded ml-2"
                      />
                      <input
                        type="text"
                        placeholder="Observações"
                        value={getNotes(item.id)}
                        onChange={(e) => handleNotes(item.id, e.target.value)}
                        className="w-32 border rounded ml-2"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Itens Selecionados */}
      <div className="mt-4 border rounded p-2 bg-gray-50">
        <div className="font-semibold mb-2">Itens Selecionados</div>
        {value.length === 0 ? (
          <div className="text-sm text-gray-500">Nenhum item selecionado.</div>
        ) : (
          <ul className="space-y-1">
            {value.map((v) => (
              <li key={v.id} className="flex items-center justify-between">
                <span>
                  {v.name} <span className="text-xs text-gray-500">(Qtd: {v.quantity})</span>
                  {v.notes && <span className="text-xs text-gray-400 ml-2">Obs: {v.notes}</span>}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemove(v.id)}
                >
                  Remover
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}; 