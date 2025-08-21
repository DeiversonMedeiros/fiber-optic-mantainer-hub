import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";

interface SearchSelectProps {
  label: string;
  placeholder: string;
  options: Array<{ id: string | number; name: string; value: string }>;
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function SearchSelect({
  label,
  placeholder,
  options,
  value,
  onValueChange,
  disabled = false,
  loading = false
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Filtro simples sem debounce para teste
  const filteredOptions = useMemo(() => {
    if (!searchValue) return options;
    
    console.log('🔍 Buscando:', searchValue);
    console.log('📋 Opções disponíveis:', options.length);
    
    const filtered = options.filter(option =>
      option.name.toLowerCase().includes(searchValue.toLowerCase())
    );
    
    console.log('✅ Resultados encontrados:', filtered.length);
    return filtered;
  }, [options, searchValue]);

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || loading}
            onClick={() => setOpen(true)}
          >
            {loading ? (
              "Carregando..."
            ) : selectedOption ? (
              selectedOption.name
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-4" align="start">
          <div className="space-y-2">
            <Input
              placeholder={`Buscar ${label.toLowerCase()}...`}
              value={searchValue}
              onChange={(e) => {
                console.log('🔍 Input mudou:', e.target.value);
                setSearchValue(e.target.value);
              }}
              className="mb-2"
            />
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredOptions.length === 0 ? (
                <div className="text-center text-muted-foreground py-2">
                  {searchValue ? "Nenhum resultado encontrado." : "Nenhuma opção disponível."}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded"
                    onClick={() => {
                      console.log('✅ Selecionado:', option.name);
                      onValueChange(option.value);
                      setOpen(false);
                      setSearchValue("");
                    }}
                  >
                    {option.name}
                  </div>
                ))
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 